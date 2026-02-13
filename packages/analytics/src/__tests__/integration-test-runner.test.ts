import { describe, it, expect, beforeEach } from 'vitest';
import { IntegrationTestRunner } from '../integration-test-runner.js';
import { Ok, Err } from '@content-forge/core';
import type { Channel } from '@content-forge/core';
import type { IntegrationTestRunnerConfig } from '../integration-test-runner.js';

function makeConfig(overrides: Partial<IntegrationTestRunnerConfig> = {}): IntegrationTestRunnerConfig {
  return {
    dryRun: true,
    ...overrides,
  };
}

const ALL_CHANNELS: Channel[] = [
  'medium', 'linkedin', 'x-thread', 'brunch', 'newsletter',
  'blog', 'threads', 'kakao', 'youtube', 'shorts',
  'reels', 'tiktok', 'ig-carousel', 'ig-single', 'ig-story', 'webtoon',
];

describe('IntegrationTestRunner', () => {
  let runner: IntegrationTestRunner;

  beforeEach(() => {
    runner = new IntegrationTestRunner(makeConfig());
  });

  describe('testChannel', () => {
    it('should pass for a valid channel in dry-run mode', async () => {
      const result = await runner.testChannel('medium');
      expect(result.status).toBe('pass');
      expect(result.channel).toBe('medium');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should pass for all 16 channels in dry-run mode', async () => {
      for (const channel of ALL_CHANNELS) {
        const result = await runner.testChannel(channel);
        expect(result.status).toBe('pass');
        expect(result.channel).toBe(channel);
      }
    });

    it('should use registered handler when available', async () => {
      runner.registerHandler('medium', async (_channel, content) => {
        if (content.title.includes('Test')) {
          return Ok({ message: 'Handler passed' });
        }
        return Err({ message: 'Handler failed' });
      });

      const result = await runner.testChannel('medium');
      expect(result.status).toBe('pass');
    });

    it('should report failure when handler returns Err', async () => {
      runner.registerHandler('linkedin', async () => {
        return Err({ message: 'API key invalid' });
      });

      const result = await runner.testChannel('linkedin');
      expect(result.status).toBe('fail');
      expect(result.error).toBe('API key invalid');
    });

    it('should catch thrown errors and report as fail', async () => {
      runner.registerHandler('youtube', async () => {
        throw new Error('Connection timeout');
      });

      const result = await runner.testChannel('youtube');
      expect(result.status).toBe('fail');
      expect(result.error).toBe('Connection timeout');
    });

    it('should skip channel with no handler when not in dry-run mode', async () => {
      const nonDryRunner = new IntegrationTestRunner(makeConfig({ dryRun: false }));
      const result = await nonDryRunner.testChannel('medium');
      expect(result.status).toBe('skip');
    });

    it('should use handler even in non-dry-run mode', async () => {
      const nonDryRunner = new IntegrationTestRunner(makeConfig({ dryRun: false }));
      nonDryRunner.registerHandler('medium', async () => {
        return Ok({ message: 'Live test passed' });
      });
      const result = await nonDryRunner.testChannel('medium');
      expect(result.status).toBe('pass');
    });

    it('should measure latency', async () => {
      runner.registerHandler('tiktok', async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return Ok({ message: 'ok' });
      });

      const result = await runner.testChannel('tiktok');
      expect(result.latencyMs).toBeGreaterThanOrEqual(15);
    });
  });

  describe('testAllChannels', () => {
    it('should test all 16 channels by default', async () => {
      const result = await runner.testAllChannels();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.results).toHaveLength(16);
        expect(result.value.passed).toBe(16);
        expect(result.value.failed).toBe(0);
        expect(result.value.skipped).toBe(0);
      }
    });

    it('should test only specified channels', async () => {
      const limitedRunner = new IntegrationTestRunner(
        makeConfig({ channels: ['medium', 'linkedin', 'youtube'] }),
      );
      const result = await limitedRunner.testAllChannels();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.results).toHaveLength(3);
        expect(result.value.passed).toBe(3);
      }
    });

    it('should include executedAt timestamp', async () => {
      const result = await runner.testAllChannels();
      expect(result.ok).toBe(true);
      if (result.ok) {
        const executedAt = new Date(result.value.executedAt);
        expect(executedAt.getTime()).toBeLessThanOrEqual(Date.now());
        expect(executedAt.getTime()).toBeGreaterThan(Date.now() - 10000);
      }
    });

    it('should calculate totalLatencyMs', async () => {
      const result = await runner.testAllChannels();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalLatencyMs).toBeGreaterThanOrEqual(0);
        const sumLatency = result.value.results.reduce((s, r) => s + r.latencyMs, 0);
        expect(result.value.totalLatencyMs).toBe(sumLatency);
      }
    });

    it('should report mixed pass/fail/skip results', async () => {
      const mixedRunner = new IntegrationTestRunner(
        makeConfig({ dryRun: false, channels: ['medium', 'linkedin', 'youtube'] }),
      );

      mixedRunner.registerHandler('medium', async () => {
        return Ok({ message: 'pass' });
      });
      mixedRunner.registerHandler('linkedin', async () => {
        return Err({ message: 'fail' });
      });
      // youtube has no handler -> skip in non-dry-run

      const result = await mixedRunner.testAllChannels();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.passed).toBe(1);
        expect(result.value.failed).toBe(1);
        expect(result.value.skipped).toBe(1);
      }
    });

    it('should return results in channel order', async () => {
      const channels: Channel[] = ['blog', 'tiktok', 'medium'];
      const orderedRunner = new IntegrationTestRunner(makeConfig({ channels }));
      const result = await orderedRunner.testAllChannels();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.results[0]!.channel).toBe('blog');
        expect(result.value.results[1]!.channel).toBe('tiktok');
        expect(result.value.results[2]!.channel).toBe('medium');
      }
    });
  });

  describe('registerHandler', () => {
    it('should override default dry-run behavior', async () => {
      runner.registerHandler('medium', async () => {
        return Err({ message: 'Custom check failed' });
      });

      const result = await runner.testChannel('medium');
      expect(result.status).toBe('fail');
      expect(result.error).toBe('Custom check failed');
    });

    it('should receive correct channel and content', async () => {
      let receivedChannel: Channel | null = null;
      let receivedTitle: string | null = null;

      runner.registerHandler('webtoon', async (channel, content) => {
        receivedChannel = channel;
        receivedTitle = content.title;
        return Ok({ message: 'ok' });
      });

      await runner.testChannel('webtoon');
      expect(receivedChannel).toBe('webtoon');
      expect(receivedTitle).toBe('Test Webtoon Episode');
    });

    it('should allow multiple handlers for different channels', async () => {
      const results: string[] = [];
      runner.registerHandler('medium', async () => {
        results.push('medium');
        return Ok({ message: 'ok' });
      });
      runner.registerHandler('linkedin', async () => {
        results.push('linkedin');
        return Ok({ message: 'ok' });
      });

      await runner.testChannel('medium');
      await runner.testChannel('linkedin');
      expect(results).toEqual(['medium', 'linkedin']);
    });
  });
});
