/**
 * Tests for Threads publisher
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ThreadsPublisher } from '../threads-publisher.js';
import type { ChannelContent, PublisherConfig } from '@content-forge/core';

describe('ThreadsPublisher', () => {
  const mockConfig: PublisherConfig = {
    channel: 'threads',
    apiKey: 'test-threads-key',
    maxRetries: 3
  };

  let publisher: ThreadsPublisher;

  const createMockContent = (bodyLength: number): ChannelContent => {
    const body = 'a'.repeat(bodyLength);
    return {
      channel: 'threads',
      title: 'Test Post',
      body,
      metadata: {
        format: 'text',
        hashtags: ['test', 'threads']
      }
    };
  };

  beforeEach(() => {
    publisher = new ThreadsPublisher(mockConfig);
  });

  describe('publish', () => {
    it('should publish valid content successfully (mocked)', async () => {
      const content = createMockContent(300);

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('threads');
        expect(result.value.externalId).toContain('threads-');
        expect(result.value.externalUrl).toContain('threads.net/@user/post');
        expect(result.value.publishedAt).toBeInstanceOf(Date);
      }
    });

    it('should reject content that is too short', async () => {
      const content = createMockContent(50); // Less than 100

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('threads');
        expect(result.error.message).toContain('too short');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject content that is too long', async () => {
      const content = createMockContent(600); // More than 500

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('threads');
        expect(result.error.message).toContain('too long');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should accept content within valid range', async () => {
      const validLengths = [100, 300, 500];

      for (const length of validLengths) {
        const content = createMockContent(length);
        const result = await publisher.publish(content);
        expect(result.ok).toBe(true);
      }
    });

    it('should include char count in error message for short content', async () => {
      const content = createMockContent(80);

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('80');
        expect(result.error.message).toContain('minimum 100');
      }
    });
  });
});
