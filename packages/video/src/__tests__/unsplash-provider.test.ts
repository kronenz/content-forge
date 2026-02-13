/**
 * Tests for unsplash-provider.ts — Unsplash stock photo search API wrapper
 * Mocks global fetch to simulate Unsplash API responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UnsplashProvider } from '../providers/unsplash-provider.js';

function createProvider(): UnsplashProvider {
  return new UnsplashProvider({ apiKey: 'test-unsplash-key' });
}

describe('UnsplashProvider', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should have source set to unsplash', () => {
    const provider = createProvider();
    expect(provider.source).toBe('unsplash');
  });

  it('should search photos with pagination', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          total: 500,
          results: [
            {
              id: 'abc123',
              width: 4000,
              height: 3000,
              description: 'A beautiful mountain lake',
              alt_description: 'mountain lake at dawn',
              urls: {
                raw: 'https://images.unsplash.com/photo-abc123',
                small: 'https://images.unsplash.com/photo-abc123?w=400',
              },
            },
            {
              id: 'def456',
              width: 5000,
              height: 3333,
              description: null,
              alt_description: 'forest path in autumn',
              urls: {
                raw: 'https://images.unsplash.com/photo-def456',
                small: 'https://images.unsplash.com/photo-def456?w=400',
              },
            },
          ],
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.search('nature', 2, 20);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toHaveLength(2);
      expect(result.value.totalCount).toBe(500);
      expect(result.value.page).toBe(2);
      expect(result.value.items[0].id).toBe('abc123');
      expect(result.value.items[0].url).toBe('https://images.unsplash.com/photo-abc123');
      expect(result.value.items[0].description).toBe('A beautiful mountain lake');
      expect(result.value.items[0].source).toBe('unsplash');
      expect(result.value.items[0].license).toBe('Unsplash License');
      // Null description falls back to alt_description
      expect(result.value.items[1].description).toBe('forest path in autumn');
    }
  });

  it('should send correct Client-ID authorization header', async () => {
    const fetchSpy = vi.fn(async () => {
      return new Response(JSON.stringify({ total: 0, results: [] }), { status: 200 });
    }) as unknown as typeof fetch;
    globalThis.fetch = fetchSpy;

    const provider = createProvider();
    await provider.search('test');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://api.unsplash.com/search/photos'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Client-ID test-unsplash-key',
        }),
      })
    );
  });

  it('should handle empty results', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(JSON.stringify({ total: 0, results: [] }), { status: 200 });
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.search('xyznonexistent');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toHaveLength(0);
      expect(result.value.totalCount).toBe(0);
    }
  });

  it('should return error on API failure (401)', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response('Unauthorized', { status: 401 });
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.search('test');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('401');
      expect(result.error.provider).toBe('unsplash');
      expect(result.error.retryable).toBe(false);
    }
  });

  it('should return error on network failure', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('Connection refused');
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.search('test');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Connection refused');
      expect(result.error.retryable).toBe(true);
    }
  });
});
