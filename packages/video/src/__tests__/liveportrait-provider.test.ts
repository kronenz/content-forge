/**
 * Tests for liveportrait-provider.ts — LivePortrait self-hosted wrapper
 * Mocks global fetch to simulate LivePortrait server responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LivePortraitProvider } from '../avatar/liveportrait-provider.js';
import type { AvatarGenerationRequest } from '../avatar/avatar-client.js';
import type { AvatarProfile } from '@content-forge/core';

const mockProfile: AvatarProfile = {
  id: 'prof-1',
  name: 'Test Avatar',
  referencePhotos: ['https://example.com/photo.jpg'],
  provider: 'liveportrait',
  style: { clothing: 'casual', background: 'transparent' },
};

const mockRequest: AvatarGenerationRequest = {
  profile: mockProfile,
  audioUrl: 'https://example.com/audio.mp3',
  gesture: 'explaining',
  durationMs: 8000,
  outputFormat: 'mp4',
};

function createProvider(serverUrl?: string, timeout?: number): LivePortraitProvider {
  return new LivePortraitProvider({
    serverUrl: serverUrl ?? 'http://localhost:8000',
    timeout,
  });
}

describe('LivePortraitProvider', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should have provider set to liveportrait', () => {
    const provider = createProvider();
    expect(provider.provider).toBe('liveportrait');
  });

  it('should strip trailing slash from serverUrl', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/generate')) {
        return new Response(JSON.stringify({ task_id: 'task-1' }), { status: 200 });
      }
      if (url.includes('/api/status/task-1')) {
        return new Response(JSON.stringify({ status: 'completed' }), { status: 200 });
      }
      return new Response('Not found', { status: 404 });
    }) as typeof fetch;
    globalThis.fetch = fetchSpy;

    const provider = createProvider('http://localhost:8000/');
    await provider.generateAvatar(mockRequest);

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:8000/api/generate',
      expect.anything()
    );
  });

  describe('generateAvatar', () => {
    it('should submit task and poll until completion', async () => {
      let statusCalls = 0;
      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/generate')) {
          return new Response(
            JSON.stringify({ task_id: 'task-001' }),
            { status: 200 }
          );
        }
        if (url.includes('/api/status/task-001')) {
          statusCalls++;
          if (statusCalls < 2) {
            return new Response(
              JSON.stringify({ status: 'processing' }),
              { status: 200 }
            );
          }
          return new Response(
            JSON.stringify({ status: 'completed' }),
            { status: 200 }
          );
        }
        return new Response('Not found', { status: 404 });
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.generateAvatar(mockRequest);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.videoUrl).toBe('http://localhost:8000/api/result/task-001');
        expect(result.value.durationMs).toBe(8000);
        expect(result.value.provider).toBe('liveportrait');
      }
    });

    it('should return error when profile has no reference photos', async () => {
      const provider = createProvider();
      const request: AvatarGenerationRequest = {
        ...mockRequest,
        profile: { ...mockProfile, referencePhotos: [] },
      };

      const result = await provider.generateAvatar(request);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('no reference photos');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should return error on server failure (500)', async () => {
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

    it('should return error when generation fails', async () => {
      globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/generate')) {
          return new Response(
            JSON.stringify({ task_id: 'task-fail' }),
            { status: 200 }
          );
        }
        if (url.includes('/api/status/task-fail')) {
          return new Response(
            JSON.stringify({ status: 'failed', error: 'GPU out of memory' }),
            { status: 200 }
          );
        }
        return new Response('Not found', { status: 404 });
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.generateAvatar(mockRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('GPU out of memory');
        expect(result.error.retryable).toBe(true);
      }
    });

    it('should return error on network failure (server down)', async () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.generateAvatar(mockRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('ECONNREFUSED');
        expect(result.error.retryable).toBe(true);
      }
    });

    it('should return error when API returns no task_id', async () => {
      globalThis.fetch = vi.fn(async () => {
        return new Response(JSON.stringify({}), { status: 200 });
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.generateAvatar(mockRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('no task_id');
      }
    });
  });

  describe('createAvatarProfile', () => {
    it('should create a profile successfully', async () => {
      globalThis.fetch = vi.fn(async () => {
        return new Response(
          JSON.stringify({ profile_id: 'lp-prof-789' }),
          { status: 200 }
        );
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.createAvatarProfile(
        'My Avatar',
        ['https://example.com/photo.jpg'],
        'https://example.com/video.mp4'
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.providerAvatarId).toBe('lp-prof-789');
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

    it('should return error on server failure', async () => {
      globalThis.fetch = vi.fn(async () => {
        return new Response('Service Unavailable', { status: 503 });
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.createAvatarProfile('Test', ['photo.jpg']);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('503');
        expect(result.error.retryable).toBe(true);
      }
    });

    it('should return error on network failure', async () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error('Connection reset');
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.createAvatarProfile('Test', ['photo.jpg']);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Connection reset');
        expect(result.error.retryable).toBe(true);
      }
    });
  });

  describe('getAvailableAvatars', () => {
    it('should list available profiles', async () => {
      globalThis.fetch = vi.fn(async () => {
        return new Response(
          JSON.stringify({
            profiles: [{ id: 'prof-1' }, { id: 'prof-2' }],
          }),
          { status: 200 }
        );
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.getAvailableAvatars();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(['prof-1', 'prof-2']);
      }
    });

    it('should return empty array when no profiles exist', async () => {
      globalThis.fetch = vi.fn(async () => {
        return new Response(
          JSON.stringify({ profiles: [] }),
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

    it('should return error on server failure', async () => {
      globalThis.fetch = vi.fn(async () => {
        return new Response('Gateway Timeout', { status: 504 });
      }) as typeof fetch;

      const provider = createProvider();
      const result = await provider.getAvailableAvatars();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('504');
        expect(result.error.retryable).toBe(true);
      }
    });
  });
});
