/**
 * Tests for pexels-provider.ts — Pexels stock photo search API wrapper
 * Mocks global fetch to simulate Pexels API responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PexelsProvider } from '../providers/pexels-provider.js';

function createProvider(): PexelsProvider {
  return new PexelsProvider({ apiKey: 'test-pexels-key' });
}

describe('PexelsProvider', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should have source set to pexels', () => {
    const provider = createProvider();
    expect(provider.source).toBe('pexels');
  });

  it('should search photos with pagination', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          total_results: 125,
          page: 1,
          photos: [
            {
              id: 12345,
              width: 4000,
              height: 2667,
              alt: 'Beautiful sunset over ocean',
              src: {
                original: 'https://images.pexels.com/photos/12345/original.jpeg',
                medium: 'https://images.pexels.com/photos/12345/medium.jpeg',
              },
            },
            {
              id: 67890,
              width: 3000,
              height: 2000,
              alt: 'Mountain landscape',
              src: {
                original: 'https://images.pexels.com/photos/67890/original.jpeg',
                medium: 'https://images.pexels.com/photos/67890/medium.jpeg',
              },
            },
          ],
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.search('nature sunset', 1, 10);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toHaveLength(2);
      expect(result.value.totalCount).toBe(125);
      expect(result.value.page).toBe(1);
      expect(result.value.items[0].id).toBe('12345');
      expect(result.value.items[0].url).toBe(
        'https://images.pexels.com/photos/12345/original.jpeg'
      );
      expect(result.value.items[0].source).toBe('pexels');
      expect(result.value.items[0].license).toBe('Pexels License');
    }
  });

  it('should send correct authorization header', async () => {
    const fetchSpy = vi.fn(async () => {
      return new Response(
        JSON.stringify({ total_results: 0, page: 1, photos: [] }),
        { status: 200 }
      );
    }) as unknown as typeof fetch;
    globalThis.fetch = fetchSpy;

    const provider = createProvider();
    await provider.search('test');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://api.pexels.com/v1/search'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'test-pexels-key',
        }),
      })
    );
  });

  it('should handle empty results', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({ total_results: 0, page: 1, photos: [] }),
        { status: 200 }
      );
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.search('xyznonexistent');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toHaveLength(0);
      expect(result.value.totalCount).toBe(0);
    }
  });

  it('should return error on API failure (403)', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response('Forbidden', { status: 403 });
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.search('test');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('403');
      expect(result.error.provider).toBe('pexels');
      expect(result.error.retryable).toBe(false);
    }
  });

  it('should return error on network failure', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('DNS resolution failed');
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.search('test');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('DNS resolution failed');
      expect(result.error.retryable).toBe(true);
    }
  });
});
