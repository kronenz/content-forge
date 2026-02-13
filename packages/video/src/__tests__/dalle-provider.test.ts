/**
 * Tests for dalle-provider.ts — OpenAI DALL-E API wrapper
 * Mocks global fetch to simulate DALL-E API responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DalleProvider } from '../providers/dalle-provider.js';

function createProvider(model?: string): DalleProvider {
  return new DalleProvider({ apiKey: 'test-openai-key', model });
}

describe('DalleProvider', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should have provider set to dalle', () => {
    const provider = createProvider();
    expect(provider.provider).toBe('dalle');
  });

  it('should generate image successfully with 16:9 aspect ratio', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          data: [{ url: 'https://oaidalleapiprodscus.blob.core.windows.net/result.png' }],
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.generate({
      prompt: 'a futuristic city at sunset',
      aspectRatio: '16:9',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.imageUrl).toBe(
        'https://oaidalleapiprodscus.blob.core.windows.net/result.png'
      );
      expect(result.value.width).toBe(1792);
      expect(result.value.height).toBe(1024);
      expect(result.value.provider).toBe('dalle');
    }
  });

  it('should use 1024x1792 for 9:16 aspect ratio', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({ data: [{ url: 'https://example.com/vertical.png' }] }),
        { status: 200 }
      );
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.generate({
      prompt: 'portrait scene',
      aspectRatio: '9:16',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.width).toBe(1024);
      expect(result.value.height).toBe(1792);
    }
  });

  it('should send correct request body and headers', async () => {
    const fetchSpy = vi.fn(async () => {
      return new Response(JSON.stringify({ data: [{ url: 'https://example.com/img.png' }] }), {
        status: 200,
      });
    }) as unknown as typeof fetch;
    globalThis.fetch = fetchSpy;

    const provider = createProvider('dall-e-3');
    await provider.generate({
      prompt: 'test prompt',
      aspectRatio: '16:9',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.openai.com/v1/images/generations',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-openai-key',
          'Content-Type': 'application/json',
        }),
      })
    );

    const callArgs = fetchSpy.mock.calls[0];
    const body = JSON.parse((callArgs[1] as RequestInit).body as string);
    expect(body.model).toBe('dall-e-3');
    expect(body.quality).toBe('hd');
    expect(body.size).toBe('1792x1024');
    expect(body.response_format).toBe('url');
  });

  it('should return error on API failure (rate limit 429)', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response('Rate limit exceeded', { status: 429 });
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.generate({
      prompt: 'test',
      aspectRatio: '16:9',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('429');
      expect(result.error.retryable).toBe(true);
      expect(result.error.provider).toBe('dalle');
    }
  });

  it('should return error on API failure (400)', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response('Bad Request', { status: 400 });
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.generate({
      prompt: 'test',
      aspectRatio: '16:9',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('400');
      expect(result.error.retryable).toBe(false);
    }
  });

  it('should return error when API returns no image URL', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.generate({
      prompt: 'test',
      aspectRatio: '16:9',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('no image URL');
    }
  });

  it('should return error on network failure', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('Network unreachable');
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.generate({
      prompt: 'test',
      aspectRatio: '16:9',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Network unreachable');
      expect(result.error.retryable).toBe(true);
    }
  });
});
