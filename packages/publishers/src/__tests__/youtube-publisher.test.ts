/**
 * Tests for YouTube publisher
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { YouTubePublisher } from '../youtube-publisher.js';
import type { PublisherConfig } from '../base-publisher.js';

// Mock node:fs/promises
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from('fake-video-data'))
}));

describe('YouTubePublisher', () => {
  const mockPublisherConfig: PublisherConfig = {
    channel: 'youtube',
    maxRetries: 3
  };

  const mockYouTubeConfig = {
    accessToken: 'test-youtube-token'
  };

  let publisher: YouTubePublisher;

  beforeEach(() => {
    publisher = new YouTubePublisher(mockPublisherConfig, mockYouTubeConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('uploadVideo', () => {
    it('should upload video successfully via resumable upload flow', async () => {
      const mockInitResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'Location': 'https://upload.youtube.com/resumable/123' }),
        text: async () => ''
      };

      const mockUploadResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          id: 'yt_video_123',
          snippet: {
            title: 'Test Video',
            description: 'Test description',
            publishedAt: '2024-01-01T00:00:00Z'
          },
          status: {
            privacyStatus: 'private',
            uploadStatus: 'uploaded'
          }
        })
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce(mockInitResponse)
        .mockResolvedValueOnce(mockUploadResponse);

      const result = await publisher.uploadVideo({
        videoFilePath: '/tmp/test-video.mp4',
        title: 'Test Video',
        description: 'Test description',
        tags: ['test', 'video'],
        categoryId: '28',
        privacyStatus: 'private'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('youtube');
        expect(result.value.externalId).toBe('yt_video_123');
        expect(result.value.externalUrl).toBe('https://www.youtube.com/watch?v=yt_video_123');
        expect(result.value.publishedAt).toBeInstanceOf(Date);
      }

      // Verify initiate call
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-youtube-token'
          })
        })
      );

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should upload video with thumbnail', async () => {
      const mockInitResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'Location': 'https://upload.youtube.com/resumable/123' }),
        text: async () => ''
      };

      const mockUploadResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          id: 'yt_video_456',
          snippet: {
            title: 'Test Video',
            description: 'Test',
            publishedAt: '2024-01-01T00:00:00Z'
          },
          status: { privacyStatus: 'private', uploadStatus: 'uploaded' }
        })
      };

      const mockThumbnailResponse = {
        ok: true,
        status: 200,
        json: async () => ({ items: [{ default: { url: 'https://img.youtube.com/thumb.jpg' } }] })
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce(mockInitResponse)
        .mockResolvedValueOnce(mockUploadResponse)
        .mockResolvedValueOnce(mockThumbnailResponse);

      const result = await publisher.uploadVideo({
        videoFilePath: '/tmp/test-video.mp4',
        title: 'Test Video',
        description: 'Test',
        tags: ['test'],
        thumbnailPath: '/tmp/thumb.png'
      });

      expect(result.ok).toBe(true);
      // 3 calls: initiate + upload + thumbnail
      expect(global.fetch).toHaveBeenCalledTimes(3);

      // Verify thumbnail call
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('thumbnails/set?videoId=yt_video_456'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-youtube-token'
          })
        })
      );
    });

    it('should handle auth failure (401)', async () => {
      const mockAuthError = {
        ok: false,
        status: 401,
        text: async () => 'Unauthorized: Invalid access token'
      };

      global.fetch = vi.fn().mockResolvedValue(mockAuthError);

      const result = await publisher.uploadVideo({
        videoFilePath: '/tmp/test-video.mp4',
        title: 'Test Video',
        description: 'Test',
        tags: []
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('youtube');
        expect(result.error.message).toContain('Unauthorized');
        expect(result.error.statusCode).toBe(401);
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should handle quota exceeded (403)', async () => {
      const mockQuotaError = {
        ok: false,
        status: 403,
        text: async () => 'Quota exceeded for YouTube Data API'
      };

      global.fetch = vi.fn().mockResolvedValue(mockQuotaError);

      const result = await publisher.uploadVideo({
        videoFilePath: '/tmp/test-video.mp4',
        title: 'Test Video',
        description: 'Test',
        tags: []
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('youtube');
        expect(result.error.message).toContain('Quota exceeded');
        expect(result.error.statusCode).toBe(403);
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should handle missing upload URL in initiate response', async () => {
      const mockInitResponse = {
        ok: true,
        status: 200,
        headers: new Headers({}), // No Location header
        text: async () => ''
      };

      global.fetch = vi.fn().mockResolvedValue(mockInitResponse);

      const result = await publisher.uploadVideo({
        videoFilePath: '/tmp/test-video.mp4',
        title: 'Test Video',
        description: 'Test',
        tags: []
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('No upload URL');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should retry on server errors', async () => {
      const mockServerError = {
        ok: false,
        status: 500,
        text: async () => 'Internal server error'
      };

      const mockInitSuccess = {
        ok: true,
        status: 200,
        headers: new Headers({ 'Location': 'https://upload.youtube.com/resumable/123' }),
        text: async () => ''
      };

      const mockUploadSuccess = {
        ok: true,
        status: 200,
        json: async () => ({
          id: 'yt_video_789',
          snippet: { title: 'Test', description: 'Test', publishedAt: '2024-01-01T00:00:00Z' },
          status: { privacyStatus: 'private', uploadStatus: 'uploaded' }
        })
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce(mockServerError)   // First attempt: initiate fails
        .mockResolvedValueOnce(mockInitSuccess)    // Second attempt: initiate succeeds
        .mockResolvedValueOnce(mockUploadSuccess); // Second attempt: upload succeeds

      const result = await publisher.uploadVideo({
        videoFilePath: '/tmp/test-video.mp4',
        title: 'Test Video',
        description: 'Test',
        tags: []
      });

      expect(result.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});
