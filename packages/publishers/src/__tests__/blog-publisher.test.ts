/**
 * Tests for Blog publisher
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BlogPublisher } from '../blog-publisher.js';
import type { ChannelContent, PublisherConfig } from '@content-forge/core';

describe('BlogPublisher', () => {
  const mockConfig: PublisherConfig = {
    channel: 'blog',
    apiKey: 'test-blog-key',
    maxRetries: 3
  };

  let publisher: BlogPublisher;

  const createMockContent = (bodyLength: number): ChannelContent => {
    const body = 'a'.repeat(bodyLength);
    return {
      channel: 'blog',
      title: 'Test Blog Post',
      body,
      metadata: {
        format: 'markdown',
        tags: ['test', 'blog']
      }
    };
  };

  beforeEach(() => {
    publisher = new BlogPublisher(mockConfig);
  });

  describe('publish', () => {
    it('should publish valid content successfully (mocked)', async () => {
      const content = createMockContent(5000);

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('blog');
        expect(result.value.externalId).toContain('blog-');
        expect(result.value.externalUrl).toContain('blog.example.com/posts');
        expect(result.value.publishedAt).toBeInstanceOf(Date);
      }
    });

    it('should reject content that is too short', async () => {
      const content = createMockContent(1000); // Less than 1500

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('blog');
        expect(result.error.message).toContain('too short');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject content that is too long', async () => {
      const content = createMockContent(16000); // More than 15000

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('blog');
        expect(result.error.message).toContain('too long');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should accept content within valid range', async () => {
      const validLengths = [1500, 8000, 15000];

      for (const length of validLengths) {
        const content = createMockContent(length);
        const result = await publisher.publish(content);
        expect(result.ok).toBe(true);
      }
    });

    it('should include char count in error message for long content', async () => {
      const content = createMockContent(16000);

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('16000');
        expect(result.error.message).toContain('maximum 15000');
      }
    });
  });
});
