/**
 * Tests for flux-provider.ts — Flux AI image generation with polling
 * Mocks global fetch to simulate Flux API responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FluxProvider } from '../providers/flux-provider.js';

function createProvider(baseUrl?: string): FluxProvider {
  return new FluxProvider({ apiKey: 'test-flux-key', baseUrl });
}

describe('FluxProvider', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('should have provider set to flux', () => {
    const provider = createProvider();
    expect(provider.provider).toBe('flux');
  });

  it('should submit generation and poll until completion', async () => {
    let statusCalls = 0;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/generate')) {
        return new Response(JSON.stringify({ task_id: 'flux-task-001' }), { status: 200 });
      }
      if (url.includes('/api/status/flux-task-001')) {
        statusCalls++;
        if (statusCalls < 2) {
          return new Response(JSON.stringify({ status: 'processing' }), { status: 200 });
        }
        return new Response(
          JSON.stringify({
            status: 'completed',
            image_url: 'https://cdn.flux.ai/result.png',
          }),
          { status: 200 }
        );
      }
      return new Response('Not found', { status: 404 });
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.generate({
      prompt: 'abstract art',
      aspectRatio: '16:9',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.imageUrl).toBe('https://cdn.flux.ai/result.png');
      expect(result.value.width).toBe(1920);
      expect(result.value.height).toBe(1080);
      expect(result.value.provider).toBe('flux');
    }
  });

  it('should strip trailing slash from baseUrl', async () => {
    const fetchSpy = vi.fn(async () => {
      // Return error to avoid entering poll loop — we only check the URL
      return new Response('Bad Request', { status: 400 });
    }) as unknown as typeof fetch;
    globalThis.fetch = fetchSpy;

    const provider = createProvider('https://my-flux.example.com/');
    await provider.generate({ prompt: 'test', aspectRatio: '16:9' });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://my-flux.example.com/api/generate',
      expect.anything()
    );
  });

  it('should return error when generation fails', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/generate')) {
        return new Response(JSON.stringify({ task_id: 'fail-task' }), { status: 200 });
      }
      if (url.includes('/api/status/fail-task')) {
        return new Response(
          JSON.stringify({ status: 'failed', error: 'NSFW content detected' }),
          { status: 200 }
        );
      }
      return new Response('Not found', { status: 404 });
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.generate({ prompt: 'test', aspectRatio: '16:9' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('NSFW content detected');
      expect(result.error.retryable).toBe(true);
    }
  });

  it('should return error on initial API failure', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response('Internal Server Error', { status: 500 });
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.generate({ prompt: 'test', aspectRatio: '16:9' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('500');
      expect(result.error.retryable).toBe(true);
    }
  });

  it('should return error on network failure', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.generate({ prompt: 'test', aspectRatio: '16:9' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('ECONNREFUSED');
      expect(result.error.retryable).toBe(true);
    }
  });
});
