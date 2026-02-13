/**
 * Tests for Newsletter publisher
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NewsletterPublisher } from '../newsletter-publisher.js';
import type { ChannelContent, PublisherConfig } from '@content-forge/core';

describe('NewsletterPublisher', () => {
  const mockConfig: PublisherConfig = {
    channel: 'newsletter',
    apiKey: 'test-newsletter-key',
    maxRetries: 3
  };

  let publisher: NewsletterPublisher;

  const createMockContent = (bodyLength: number): ChannelContent => {
    const body = 'a'.repeat(bodyLength);
    return {
      channel: 'newsletter',
      title: 'Test Newsletter',
      body,
      metadata: {
        format: 'html',
        tags: ['test', 'newsletter']
      }
    };
  };

  beforeEach(() => {
    publisher = new NewsletterPublisher(mockConfig);
  });

  describe('publish', () => {
    it('should publish valid content successfully (mocked)', async () => {
      const content = createMockContent(5000);

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('newsletter');
        expect(result.value.externalId).toContain('newsletter-');
        expect(result.value.externalUrl).toContain('buttondown.com/archive');
        expect(result.value.publishedAt).toBeInstanceOf(Date);
      }
    });

    it('should reject content that is too short', async () => {
      const content = createMockContent(500); // Less than 1000

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('newsletter');
        expect(result.error.message).toContain('too short');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject content that is too long', async () => {
      const content = createMockContent(25000); // More than 20000

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('newsletter');
        expect(result.error.message).toContain('too long');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should accept content within valid range', async () => {
      const validLengths = [1000, 10000, 20000];

      for (const length of validLengths) {
        const content = createMockContent(length);
        const result = await publisher.publish(content);
        expect(result.ok).toBe(true);
      }
    });

    it('should include char count in error message for short content', async () => {
      const content = createMockContent(800);

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('800');
        expect(result.error.message).toContain('minimum 1000');
      }
    });
  });
});
