/**
 * Tests for heygen-provider.ts — HeyGen API wrapper
 * Mocks global fetch to simulate HeyGen API responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HeyGenProvider } from '../avatar/heygen-provider.js';
import type { AvatarGenerationRequest } from '../avatar/avatar-client.js';
import type { AvatarProfile } from '@content-forge/core';

const mockProfile: AvatarProfile = {
  id: 'prof-1',
  name: 'Test Avatar',
  referencePhotos: ['https://example.com/photo.jpg'],
  provider: 'heygen',
  providerAvatarId: 'hg-avatar-123',
  style: { clothing: 'business', background: 'transparent' },
};

const mockRequest: AvatarGenerationRequest = {
  profile: mockProfile,
  audioUrl: 'https://example.com/audio.mp3',
  gesture: 'talking',
  durationMs: 5000,
  outputFormat: 'mp4',
};

function createProvider(baseUrl?: string): HeyGenProvider {
  return new HeyGenProvider({
    apiKey: 'test-api-key',
    baseUrl: baseUrl ?? 'https://api.heygen.com',
  });
}

describe('HeyGenProvider', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('should have provider set to heygen', () => {
    const provider = createProvider();
    expect(provider.provider).toBe('heygen');
  });

  describe('generateAvatar', () => {
    it('should create video and poll until completion', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/v2/video/generate')) {
          return new Response(
            JSON.stringify({ data: { video_id: 'vid-001' } }),
            { status: 200 }
          );
        }
        if (url.includes('/v1/video_status.get')) {
          callCount++;
          if (callCount < 2) {
            return new Response(
              JSON.stringify({ data: { status: 'processing' } }),
              { status: 200 }
            );
          }
          return new Response(
            JSON.stringify({
              data: { status: 'completed', video_url: 'https://cdn.heygen.com/result.mp4' },
            }),
            { status: 200 }
          );
        }
        return new Response('Not found', { status: 404 });
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.generateAvatar(mockRequest);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.videoUrl).toBe('https://cdn.heygen.com/result.mp4');
        expect(result.value.durationMs).toBe(5000);
        expect(result.value.provider).toBe('heygen');
      }
    });

    it('should return error when profile has no providerAvatarId', async () => {
      const provider = createProvider();
      const request: AvatarGenerationRequest = {
        ...mockRequest,
        profile: { ...mockProfile, providerAvatarId: undefined },
      };

      const result = await provider.generateAvatar(request);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('providerAvatarId');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should return error on API failure (500)', async () => {
      globalThis.fetch = vi.fn(async () => {
        return new Response('Internal Server Error', { status: 500 });
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.generateAvatar(mockRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('500');
        expect(result.error.retryable).toBe(true);
      }
    });

    it('should return error on API failure (400)', async () => {
      globalThis.fetch = vi.fn(async () => {
        return new Response('Bad Request', { status: 400 });
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.generateAvatar(mockRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('400');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should return error when video generation fails', async () => {
      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/v2/video/generate')) {
          return new Response(
            JSON.stringify({ data: { video_id: 'vid-fail' } }),
            { status: 200 }
          );
        }
        if (url.includes('/v1/video_status.get')) {
          return new Response(
            JSON.stringify({
              data: { status: 'failed', error: 'Avatar rendering crashed' },
            }),
            { status: 200 }
          );
        }
        return new Response('Not found', { status: 404 });
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.generateAvatar(mockRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Avatar rendering crashed');
        expect(result.error.retryable).toBe(true);
      }
    });

    it('should return error on network failure', async () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error('Network unreachable');
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.generateAvatar(mockRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Network unreachable');
        expect(result.error.retryable).toBe(true);
      }
    });

    it('should return error when API returns no video_id', async () => {
      globalThis.fetch = vi.fn(async () => {
        return new Response(JSON.stringify({ data: {} }), { status: 200 });
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.generateAvatar(mockRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('no video_id');
      }
    });

    it('should send correct headers with API key', async () => {
      const fetchSpy = vi.fn(async () => {
        return new Response(JSON.stringify({ data: {} }), { status: 200 });
      }) as unknown as typeof fetch;
      globalThis.fetch = fetchSpy;

      const provider = createProvider();
      await provider.generateAvatar(mockRequest);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/v2/video/generate'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Api-Key': 'test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('createAvatarProfile', () => {
    it('should create an avatar profile successfully', async () => {
      globalThis.fetch = vi.fn(async () => {
        return new Response(
          JSON.stringify({ data: { avatar_id: 'new-avatar-456' } }),
          { status: 200 }
        );
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.createAvatarProfile('My Avatar', [
        'https://example.com/photo.jpg',
      ]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.providerAvatarId).toBe('new-avatar-456');
      }
    });

    it('should return error when no reference photos provided', async () => {
      const provider = createProvider();
      const result = await provider.createAvatarProfile('My Avatar', []);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('reference photo');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should return error on API failure', async () => {
      globalThis.fetch = vi.fn(async () => {
        return new Response('Forbidden', { status: 403 });
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.createAvatarProfile('Test', ['photo.jpg']);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('403');
      }
    });

    it('should return error on network failure', async () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error('Connection refused');
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.createAvatarProfile('Test', ['photo.jpg']);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Connection refused');
        expect(result.error.retryable).toBe(true);
      }
    });
  });

  describe('getAvailableAvatars', () => {
    it('should list available avatars', async () => {
      globalThis.fetch = vi.fn(async () => {
        return new Response(
          JSON.stringify({
            data: {
              avatars: [
                { avatar_id: 'av-1' },
                { avatar_id: 'av-2' },
                { avatar_id: 'av-3' },
              ],
            },
          }),
          { status: 200 }
        );
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.getAvailableAvatars();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(['av-1', 'av-2', 'av-3']);
      }
    });

    it('should return empty array when no avatars exist', async () => {
      globalThis.fetch = vi.fn(async () => {
        return new Response(
          JSON.stringify({ data: { avatars: [] } }),
          { status: 200 }
        );
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.getAvailableAvatars();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });

    it('should return error on API failure', async () => {
      globalThis.fetch = vi.fn(async () => {
        return new Response('Unauthorized', { status: 401 });
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.getAvailableAvatars();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('401');
      }
    });
  });
});
