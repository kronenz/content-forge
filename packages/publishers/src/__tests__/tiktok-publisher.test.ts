/**
 * Tests for TikTok publisher
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TikTokPublisher } from '../tiktok-publisher.js';
import type { PublisherConfig } from '../base-publisher.js';

// Mock node:fs/promises
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from('fake-tiktok-video'))
}));

describe('TikTokPublisher', () => {
  const mockPublisherConfig: PublisherConfig = {
    channel: 'tiktok',
    maxRetries: 3
  };

  const mockTikTokConfig = {
    accessToken: 'test-tiktok-token'
  };

  let publisher: TikTokPublisher;

  beforeEach(() => {
    publisher = new TikTokPublisher(mockPublisherConfig, mockTikTokConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('uploadVideo', () => {
    it('should complete the 3-step upload flow successfully', async () => {
      const mockInitResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            publish_id: 'tiktok_pub_123',
            upload_url: 'https://upload.tiktok.com/video/123'
          },
          error: { code: 'ok', message: '' }
        })
      };

      const mockUploadResponse = {
        ok: true,
        status: 200
      };

      const mockPublishResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            publish_id: 'tiktok_pub_123',
            share_url: 'https://www.tiktok.com/@user/video/123456'
          },
          error: { code: 'ok', message: '' }
        })
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce(mockInitResponse)
        .mockResolvedValueOnce(mockUploadResponse)
        .mockResolvedValueOnce(mockPublishResponse);

      const result = await publisher.uploadVideo({
        videoFilePath: '/tmp/tiktok.mp4',
        title: 'Fun TikTok Video',
        privacyLevel: 'PUBLIC_TO_EVERYONE'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('tiktok');
        expect(result.value.externalId).toBe('tiktok_pub_123');
        expect(result.value.externalUrl).toBe('https://www.tiktok.com/@user/video/123456');
        expect(result.value.publishedAt).toBeInstanceOf(Date);
      }

      // Verify init call
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('post/publish/inbox/video/init'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-tiktok-token'
          })
        })
      );

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should reject title longer than 150 chars', async () => {
      const result = await publisher.uploadVideo({
        videoFilePath: '/tmp/tiktok.mp4',
        title: 'a'.repeat(151)
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('tiktok');
        expect(result.error.message).toContain('Title too long');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should handle API init error', async () => {
      const mockError = {
        ok: false,
        status: 401,
        text: async () => 'Unauthorized: Invalid access token'
      };

      global.fetch = vi.fn().mockResolvedValue(mockError);

      const result = await publisher.uploadVideo({
        videoFilePath: '/tmp/tiktok.mp4',
        title: 'Test Video'
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('tiktok');
        expect(result.error.message).toContain('Unauthorized');
        expect(result.error.statusCode).toBe(401);
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should handle TikTok API error response with error code', async () => {
      const mockInitResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            publish_id: '',
            upload_url: ''
          },
          error: {
            code: 'spam_risk_too_many_posts',
            message: 'Too many posts in a short period'
          }
        })
      };

      global.fetch = vi.fn().mockResolvedValue(mockInitResponse);

      const result = await publisher.uploadVideo({
        videoFilePath: '/tmp/tiktok.mp4',
        title: 'Test Video'
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('tiktok');
        expect(result.error.message).toContain('Too many posts');
      }
    });
  });
});
