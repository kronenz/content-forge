/**
 * Tests for Medium publisher
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MediumPublisher } from '../medium-publisher.js';
import type { ChannelContent, PublisherConfig } from '@content-forge/core';

describe('MediumPublisher', () => {
  const mockConfig: PublisherConfig = {
    channel: 'medium',
    apiKey: 'test-medium-key',
    maxRetries: 3
  };

  let publisher: MediumPublisher;

  const createMockContent = (bodyLength: number): ChannelContent => {
    const body = 'a'.repeat(bodyLength);
    return {
      channel: 'medium',
      title: 'Test Article',
      body,
      metadata: {
        format: 'markdown',
        tags: ['test', 'article']
      }
    };
  };

  beforeEach(() => {
    publisher = new MediumPublisher(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('publish', () => {
    it('should publish valid content successfully', async () => {
      const content = createMockContent(3000);

      const mockResponse = {
        ok: true,
        status: 201,
        json: async () => ({
          data: {
            id: 'medium_123',
            title: 'Test Article',
            authorId: 'author_123',
            url: 'https://medium.com/@user/test-article-123',
            publishStatus: 'public',
            publishedAt: Date.now()
          }
        })
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('medium');
        expect(result.value.externalId).toBe('medium_123');
        expect(result.value.externalUrl).toBe('https://medium.com/@user/test-article-123');
        expect(result.value.publishedAt).toBeInstanceOf(Date);
      }

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.medium.com/v1/users/@me/posts',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-medium-key'
          })
        })
      );
    });

    it('should reject content that is too short', async () => {
      const content = createMockContent(1500); // Less than 2000

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('medium');
        expect(result.error.message).toContain('too short');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject content that is too long', async () => {
      const content = createMockContent(5000); // More than 4000

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('medium');
        expect(result.error.message).toContain('too long');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should retry on server errors', async () => {
      const content = createMockContent(3000);

      const errorResponse = {
        ok: false,
        status: 500,
        text: async () => 'Internal server error'
      };

      const successResponse = {
        ok: true,
        status: 201,
        json: async () => ({
          data: {
            id: 'medium_123',
            title: 'Test Article',
            authorId: 'author_123',
            url: 'https://medium.com/@user/test-article-123',
            publishStatus: 'public',
            publishedAt: Date.now()
          }
        })
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(successResponse);

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle missing API key', async () => {
      const noKeyPublisher = new MediumPublisher({ ...mockConfig, apiKey: undefined });
      const content = createMockContent(3000);

      const result = await noKeyPublisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('API key not configured');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should handle network errors with retry', async () => {
      const content = createMockContent(3000);

      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: 'medium_123',
              title: 'Test Article',
              authorId: 'author_123',
              url: 'https://medium.com/@user/test-article-123',
              publishStatus: 'public',
              publishedAt: Date.now()
            }
          })
        });

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
