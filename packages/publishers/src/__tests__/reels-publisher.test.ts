/**
 * Tests for Instagram Reels publisher
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReelsPublisher } from '../reels-publisher.js';
import type { PublisherConfig } from '../base-publisher.js';

describe('ReelsPublisher', () => {
  const mockPublisherConfig: PublisherConfig = {
    channel: 'reels',
    maxRetries: 3
  };

  const mockReelsConfig = {
    accessToken: 'test-ig-token',
    igUserId: '12345678'
  };

  let publisher: ReelsPublisher;

  beforeEach(() => {
    publisher = new ReelsPublisher(mockPublisherConfig, mockReelsConfig);
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('uploadReel', () => {
    it('should complete the 3-step flow successfully (create → poll → publish)', async () => {
      const mockCreateContainer = {
        ok: true,
        status: 200,
        json: async () => ({ id: 'container_123' })
      };

      const mockPollFinished = {
        ok: true,
        status: 200,
        json: async () => ({ status_code: 'FINISHED' })
      };

      const mockPublish = {
        ok: true,
        status: 200,
        json: async () => ({ id: 'media_456' })
      };

      const mockPermalink = {
        ok: true,
        status: 200,
        json: async () => ({ permalink: 'https://www.instagram.com/reel/ABC123/' })
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce(mockCreateContainer)
        .mockResolvedValueOnce(mockPollFinished)
        .mockResolvedValueOnce(mockPublish)
        .mockResolvedValueOnce(mockPermalink);

      const resultPromise = publisher.uploadReel({
        videoUrl: 'https://cdn.example.com/video.mp4',
        caption: 'Check out this reel!'
      });

      // Advance timers for any sleeps
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('reels');
        expect(result.value.externalId).toBe('media_456');
        expect(result.value.externalUrl).toBe('https://www.instagram.com/reel/ABC123/');
        expect(result.value.publishedAt).toBeInstanceOf(Date);
      }

      // Verify create container call
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('12345678/media'),
        expect.objectContaining({ method: 'POST' })
      );

      // Verify publish call
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('12345678/media_publish'),
        expect.objectContaining({ method: 'POST' })
      );

      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should handle polling with intermediate IN_PROGRESS status', async () => {
      const mockCreateContainer = {
        ok: true,
        status: 200,
        json: async () => ({ id: 'container_789' })
      };

      const mockPollInProgress = {
        ok: true,
        status: 200,
        json: async () => ({ status_code: 'IN_PROGRESS' })
      };

      const mockPollFinished = {
        ok: true,
        status: 200,
        json: async () => ({ status_code: 'FINISHED' })
      };

      const mockPublish = {
        ok: true,
        status: 200,
        json: async () => ({ id: 'media_789' })
      };

      const mockPermalink = {
        ok: true,
        status: 200,
        json: async () => ({ permalink: 'https://www.instagram.com/reel/DEF456/' })
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce(mockCreateContainer)
        .mockResolvedValueOnce(mockPollInProgress)
        .mockResolvedValueOnce(mockPollInProgress)
        .mockResolvedValueOnce(mockPollFinished)
        .mockResolvedValueOnce(mockPublish)
        .mockResolvedValueOnce(mockPermalink);

      const resultPromise = publisher.uploadReel({
        videoUrl: 'https://cdn.example.com/video.mp4',
        caption: 'My reel'
      });

      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.externalId).toBe('media_789');
      }

      // 1 create + 3 polls + 1 publish + 1 permalink = 6
      expect(global.fetch).toHaveBeenCalledTimes(6);
    });

    it('should handle media processing error', async () => {
      const mockCreateContainer = {
        ok: true,
        status: 200,
        json: async () => ({ id: 'container_err' })
      };

      const mockPollError = {
        ok: true,
        status: 200,
        json: async () => ({ status_code: 'ERROR', status: 'Video format not supported' })
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce(mockCreateContainer)
        .mockResolvedValueOnce(mockPollError);

      const resultPromise = publisher.uploadReel({
        videoUrl: 'https://cdn.example.com/bad-video.avi',
        caption: 'Test'
      });

      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('reels');
        expect(result.error.message).toContain('processing failed');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should handle create container API error', async () => {
      const mockApiError = {
        ok: false,
        status: 400,
        text: async () => 'Invalid video URL'
      };

      global.fetch = vi.fn().mockResolvedValue(mockApiError);

      const resultPromise = publisher.uploadReel({
        videoUrl: 'not-a-url',
        caption: 'Test'
      });

      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('reels');
        expect(result.error.message).toContain('Invalid video URL');
        expect(result.error.statusCode).toBe(400);
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should pass cover timestamp and share_to_feed options', async () => {
      const mockCreateContainer = {
        ok: true,
        status: 200,
        json: async () => ({ id: 'container_opt' })
      };

      const mockPollFinished = {
        ok: true,
        status: 200,
        json: async () => ({ status_code: 'FINISHED' })
      };

      const mockPublish = {
        ok: true,
        status: 200,
        json: async () => ({ id: 'media_opt' })
      };

      const mockPermalink = {
        ok: true,
        status: 200,
        json: async () => ({ permalink: 'https://www.instagram.com/reel/OPT/' })
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce(mockCreateContainer)
        .mockResolvedValueOnce(mockPollFinished)
        .mockResolvedValueOnce(mockPublish)
        .mockResolvedValueOnce(mockPermalink);

      const resultPromise = publisher.uploadReel({
        videoUrl: 'https://cdn.example.com/video.mp4',
        caption: 'Test with options',
        coverTimestampMs: 5000,
        shareToFeed: false
      });

      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.ok).toBe(true);

      // Verify the create container call includes thumb_offset and share_to_feed
      const createCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = createCall[1].body as string;
      expect(body).toContain('thumb_offset=5000');
      expect(body).toContain('share_to_feed=false');
    });
  });
});
