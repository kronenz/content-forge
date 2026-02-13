/**
 * Tests for LinkedIn publisher
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LinkedInPublisher } from '../linkedin-publisher.js';
import type { ChannelContent, PublisherConfig } from '@content-forge/core';

describe('LinkedInPublisher', () => {
  const mockConfig: PublisherConfig = {
    channel: 'linkedin',
    apiKey: 'test-linkedin-key',
    maxRetries: 3
  };

  let publisher: LinkedInPublisher;

  const createMockContent = (bodyLength: number): ChannelContent => {
    const body = 'a'.repeat(bodyLength);
    return {
      channel: 'linkedin',
      title: 'Test Post',
      body,
      metadata: {
        format: 'text',
        hashtags: ['test', 'professional']
      }
    };
  };

  beforeEach(() => {
    publisher = new LinkedInPublisher(mockConfig);
  });

  describe('publish', () => {
    it('should publish valid content successfully (mocked)', async () => {
      const content = createMockContent(500);

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('linkedin');
        expect(result.value.externalId).toContain('linkedin-');
        expect(result.value.externalUrl).toContain('linkedin.com/feed/update');
        expect(result.value.publishedAt).toBeInstanceOf(Date);
      }
    });

    it('should reject content that is too short', async () => {
      const content = createMockContent(200); // Less than 300

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('linkedin');
        expect(result.error.message).toContain('too short');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject content that is too long', async () => {
      const content = createMockContent(1000); // More than 800

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('linkedin');
        expect(result.error.message).toContain('too long');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should accept content within valid range', async () => {
      const validLengths = [300, 500, 800];

      for (const length of validLengths) {
        const content = createMockContent(length);
        const result = await publisher.publish(content);
        expect(result.ok).toBe(true);
      }
    });
  });
});
