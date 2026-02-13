import { describe, it, expect, beforeEach } from 'vitest';
import { PublishRetryManager } from '../publish-retry-manager.js';
import { Ok, Err } from '@content-forge/core';
import type { Channel, PublishResult } from '@content-forge/core';
import type { PublishFailure, PublishRetryManagerConfig } from '../publish-retry-manager.js';

function makeConfig(overrides: Partial<PublishRetryManagerConfig> = {}): PublishRetryManagerConfig {
  return {
    maxRetries: 3,
    baseDelayMs: 100,
    ...overrides,
  };
}

function makePublishFailure(overrides: Partial<PublishFailure> = {}): PublishFailure {
  return {
    publisher: 'medium',
    message: 'API request failed',
    statusCode: 500,
    retryable: true,
    ...overrides,
  };
}

function makePublishResult(channel: Channel): PublishResult {
  return {
    channel,
    externalUrl: `https://example.com/${channel}/post-1`,
    externalId: 'ext-123',
    publishedAt: new Date(),
  };
}

describe('PublishRetryManager', () => {
  let manager: PublishRetryManager;

  beforeEach(() => {
    manager = new PublishRetryManager(makeConfig());
  });

  describe('trackFailure', () => {
    it('should track a single failure', () => {
      manager.trackFailure('medium', 'pub-1', makePublishFailure());
      const failures = manager.getFailedPublications();
      expect(failures).toHaveLength(1);
      expect(failures[0]!.channel).toBe('medium');
      expect(failures[0]!.publicationId).toBe('pub-1');
      expect(failures[0]!.attempts).toBe(1);
    });

    it('should increment attempts on repeated failures', () => {
      manager.trackFailure('medium', 'pub-1', makePublishFailure());
      manager.trackFailure('medium', 'pub-1', makePublishFailure());
      manager.trackFailure('medium', 'pub-1', makePublishFailure());
      const failures = manager.getFailedPublications();
      expect(failures).toHaveLength(1);
      expect(failures[0]!.attempts).toBe(3);
    });

    it('should track failures for different channels separately', () => {
      manager.trackFailure('medium', 'pub-1', makePublishFailure({ publisher: 'medium' }));
      manager.trackFailure('linkedin', 'pub-2', makePublishFailure({ publisher: 'linkedin' }));
      expect(manager.getFailedPublications()).toHaveLength(2);
    });

    it('should track failures for same channel different publications', () => {
      manager.trackFailure('medium', 'pub-1', makePublishFailure());
      manager.trackFailure('medium', 'pub-2', makePublishFailure());
      expect(manager.getFailedPublications()).toHaveLength(2);
    });

    it('should set lastAttemptAt timestamp', () => {
      manager.trackFailure('medium', 'pub-1', makePublishFailure());
      const failures = manager.getFailedPublications();
      const lastAttempt = new Date(failures[0]!.lastAttemptAt);
      expect(lastAttempt.getTime()).toBeLessThanOrEqual(Date.now());
      expect(lastAttempt.getTime()).toBeGreaterThan(Date.now() - 5000);
    });

    it('should calculate nextRetryAt with exponential backoff', () => {
      const config = makeConfig({ baseDelayMs: 1000 });
      const mgr = new PublishRetryManager(config);

      mgr.trackFailure('medium', 'pub-1', makePublishFailure());
      const first = mgr.getFailedPublications()[0]!;
      const firstRetry = new Date(first.nextRetryAt);
      const firstAttempt = new Date(first.lastAttemptAt);
      // First attempt: baseDelay * 2^0 = 1000ms
      const diff1 = firstRetry.getTime() - firstAttempt.getTime();
      expect(diff1).toBeGreaterThanOrEqual(900);
      expect(diff1).toBeLessThanOrEqual(1500);

      mgr.trackFailure('medium', 'pub-1', makePublishFailure());
      const second = mgr.getFailedPublications()[0]!;
      const secondRetry = new Date(second.nextRetryAt);
      const secondAttempt = new Date(second.lastAttemptAt);
      // Second attempt: baseDelay * 2^1 = 2000ms
      const diff2 = secondRetry.getTime() - secondAttempt.getTime();
      expect(diff2).toBeGreaterThanOrEqual(1900);
      expect(diff2).toBeLessThanOrEqual(2500);
    });

    it('should store the last error', () => {
      const error = makePublishFailure({ message: 'Rate limit exceeded', statusCode: 429 });
      manager.trackFailure('x-thread', 'pub-1', error);
      const failures = manager.getFailedPublications();
      expect(failures[0]!.lastError.message).toBe('Rate limit exceeded');
      expect(failures[0]!.lastError.statusCode).toBe(429);
    });
  });

  describe('getFailureCount', () => {
    it('should return 0 initially', () => {
      expect(manager.getFailureCount()).toBe(0);
    });

    it('should return correct count after tracking', () => {
      manager.trackFailure('medium', 'pub-1', makePublishFailure());
      manager.trackFailure('linkedin', 'pub-2', makePublishFailure());
      expect(manager.getFailureCount()).toBe(2);
    });
  });

  describe('retryFailed', () => {
    it('should retry eligible publications and report success', async () => {
      // Use 0 baseDelay so nextRetryAt is immediately in the past
      const mgr = new PublishRetryManager(makeConfig({ baseDelayMs: 0 }));
      mgr.trackFailure('medium', 'pub-1', makePublishFailure());

      const result = await mgr.retryFailed(async (pub) => {
        return Ok(makePublishResult(pub.channel));
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.total).toBe(1);
        expect(result.value.succeeded).toBe(1);
        expect(result.value.failed).toBe(0);
        expect(result.value.remaining).toBe(0);
      }
    });

    it('should remove succeeded publications from tracking', async () => {
      const mgr = new PublishRetryManager(makeConfig({ baseDelayMs: 0 }));
      mgr.trackFailure('medium', 'pub-1', makePublishFailure());
      mgr.trackFailure('linkedin', 'pub-2', makePublishFailure());

      await mgr.retryFailed(async (pub) => {
        return Ok(makePublishResult(pub.channel));
      });

      expect(mgr.getFailureCount()).toBe(0);
    });

    it('should report failures when publish fn fails', async () => {
      const mgr = new PublishRetryManager(makeConfig({ baseDelayMs: 0 }));
      mgr.trackFailure('medium', 'pub-1', makePublishFailure());

      const result = await mgr.retryFailed(async () => {
        return Err(makePublishFailure({ message: 'Still failing' }));
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.succeeded).toBe(0);
        expect(result.value.failed).toBe(1);
        expect(result.value.remaining).toBe(1);
      }
    });

    it('should not retry non-retryable failures', async () => {
      const mgr = new PublishRetryManager(makeConfig({ baseDelayMs: 0 }));
      mgr.trackFailure('medium', 'pub-1', makePublishFailure({ retryable: false }));

      let called = false;
      const result = await mgr.retryFailed(async (pub) => {
        called = true;
        return Ok(makePublishResult(pub.channel));
      });

      expect(called).toBe(false);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.total).toBe(0);
      }
    });

    it('should not retry when max retries exceeded', async () => {
      const mgr = new PublishRetryManager(makeConfig({ maxRetries: 2, baseDelayMs: 0 }));
      // Track 2 failures (already at max)
      mgr.trackFailure('medium', 'pub-1', makePublishFailure());
      mgr.trackFailure('medium', 'pub-1', makePublishFailure());

      let called = false;
      const result = await mgr.retryFailed(async (pub) => {
        called = true;
        return Ok(makePublishResult(pub.channel));
      });

      expect(called).toBe(false);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.total).toBe(0);
      }
    });

    it('should handle mixed success and failure', async () => {
      const mgr = new PublishRetryManager(makeConfig({ baseDelayMs: 0 }));
      mgr.trackFailure('medium', 'pub-1', makePublishFailure());
      mgr.trackFailure('linkedin', 'pub-2', makePublishFailure());

      const result = await mgr.retryFailed(async (pub) => {
        if (pub.channel === 'medium') {
          return Ok(makePublishResult(pub.channel));
        }
        return Err(makePublishFailure({ message: 'linkedin still down' }));
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.succeeded).toBe(1);
        expect(result.value.failed).toBe(1);
        expect(result.value.remaining).toBe(1);
      }
    });
  });

  describe('sendAlert', () => {
    it('should not throw when no webhook URL configured', async () => {
      const mgr = new PublishRetryManager(makeConfig());
      const failure = mgr.getFailedPublications()[0];
      // Create a mock failure to pass
      const mockFailure = {
        channel: 'medium' as Channel,
        publicationId: 'pub-1',
        attempts: 3,
        lastError: makePublishFailure(),
        lastAttemptAt: new Date().toISOString(),
        nextRetryAt: new Date().toISOString(),
      };
      await expect(mgr.sendAlert(mockFailure)).resolves.not.toThrow();
    });

    it('should not throw when webhook URL is configured', async () => {
      const mgr = new PublishRetryManager(
        makeConfig({ alertWebhookUrl: 'https://hooks.slack.com/test' }),
      );
      const mockFailure = {
        channel: 'linkedin' as Channel,
        publicationId: 'pub-2',
        attempts: 5,
        lastError: makePublishFailure({ message: 'Server error' }),
        lastAttemptAt: new Date().toISOString(),
        nextRetryAt: new Date().toISOString(),
      };
      await expect(mgr.sendAlert(mockFailure)).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all tracked failures', () => {
      manager.trackFailure('medium', 'pub-1', makePublishFailure());
      manager.trackFailure('linkedin', 'pub-2', makePublishFailure());
      expect(manager.getFailureCount()).toBe(2);
      manager.clear();
      expect(manager.getFailureCount()).toBe(0);
      expect(manager.getFailedPublications()).toHaveLength(0);
    });
  });
});
