/**
 * Tests for YouTube Shorts publisher
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShortsPublisher } from '../shorts-publisher.js';
import type { PublisherConfig } from '../base-publisher.js';

// Mock node:fs/promises
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from('fake-short-video'))
}));

describe('ShortsPublisher', () => {
  const mockPublisherConfig: PublisherConfig = {
    channel: 'shorts',
    maxRetries: 3
  };

  const mockYouTubeConfig = {
    accessToken: 'test-shorts-token'
  };

  let publisher: ShortsPublisher;

  const createSuccessfulMocks = () => {
    const mockInitResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'Location': 'https://upload.youtube.com/resumable/short-123' }),
      text: async () => ''
    };

    const mockUploadResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        id: 'short_video_123',
        snippet: {
          title: 'Test Short #Shorts',
          description: 'Test description #Shorts',
          publishedAt: '2024-01-01T00:00:00Z'
        },
        status: { privacyStatus: 'private', uploadStatus: 'uploaded' }
      })
    };

    return { mockInitResponse, mockUploadResponse };
  };

  beforeEach(() => {
    publisher = new ShortsPublisher(mockPublisherConfig, mockYouTubeConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('uploadShort', () => {
    it('should inject #Shorts tag into title and description', async () => {
      const { mockInitResponse, mockUploadResponse } = createSuccessfulMocks();

      global.fetch = vi.fn()
        .mockResolvedValueOnce(mockInitResponse)
        .mockResolvedValueOnce(mockUploadResponse);

      await publisher.uploadShort({
        videoFilePath: '/tmp/short.mp4',
        title: 'Cool Tech Tip',
        description: 'Learn something new',
        tags: ['tech']
      });

      // Verify the initiate call contains #Shorts in the metadata
      const initCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(initCall[1].body);
      expect(body.snippet.title).toContain('#Shorts');
      expect(body.snippet.description).toContain('#Shorts');
      expect(body.snippet.tags).toContain('Shorts');
    });

    it('should not duplicate #Shorts tag if already present', async () => {
      const { mockInitResponse, mockUploadResponse } = createSuccessfulMocks();

      global.fetch = vi.fn()
        .mockResolvedValueOnce(mockInitResponse)
        .mockResolvedValueOnce(mockUploadResponse);

      await publisher.uploadShort({
        videoFilePath: '/tmp/short.mp4',
        title: 'Cool Tech Tip #Shorts',
        description: 'Learn something new #Shorts',
        tags: ['tech']
      });

      const initCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(initCall[1].body);
      // Should not have doubled #Shorts
      expect(body.snippet.title).toBe('Cool Tech Tip #Shorts');
      expect(body.snippet.description).toBe('Learn something new #Shorts');
    });

    it('should upload short successfully', async () => {
      const { mockInitResponse, mockUploadResponse } = createSuccessfulMocks();

      global.fetch = vi.fn()
        .mockResolvedValueOnce(mockInitResponse)
        .mockResolvedValueOnce(mockUploadResponse);

      const result = await publisher.uploadShort({
        videoFilePath: '/tmp/short.mp4',
        title: 'Test Short',
        description: 'Test description',
        tags: ['test']
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('shorts');
        expect(result.value.externalId).toBe('short_video_123');
        expect(result.value.externalUrl).toBe('https://www.youtube.com/shorts/short_video_123');
        expect(result.value.publishedAt).toBeInstanceOf(Date);
      }
    });

    it('should reject title longer than 100 chars', async () => {
      const result = await publisher.uploadShort({
        videoFilePath: '/tmp/short.mp4',
        title: 'a'.repeat(101),
        description: 'Test',
        tags: []
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('shorts');
        expect(result.error.message).toContain('Title too long');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should handle API errors', async () => {
      const mockError = {
        ok: false,
        status: 403,
        text: async () => 'Forbidden: quota exceeded'
      };

      global.fetch = vi.fn().mockResolvedValue(mockError);

      const result = await publisher.uploadShort({
        videoFilePath: '/tmp/short.mp4',
        title: 'Test Short',
        description: 'Test',
        tags: []
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('shorts');
        expect(result.error.statusCode).toBe(403);
      }
    });
  });
});
