/**
 * Tests for comfyui-provider.ts — ComfyUI server wrapper with workflow submission
 * Mocks global fetch to simulate ComfyUI server responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComfyUIProvider } from '../providers/comfyui-provider.js';

function createProvider(serverUrl?: string): ComfyUIProvider {
  return new ComfyUIProvider({
    serverUrl: serverUrl ?? 'http://localhost:8188',
    workflow: 'sdxl-turbo',
  });
}

describe('ComfyUIProvider', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should have provider set to comfyui', () => {
    const provider = createProvider();
    expect(provider.provider).toBe('comfyui');
  });

  it('should submit workflow and poll history for result', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/history/')) {
        return new Response(
          JSON.stringify({
            'prompt-001': {
              status: { completed: true },
              outputs: {
                '9': {
                  images: [{ filename: 'ComfyUI_00001_.png' }],
                },
              },
            },
          }),
          { status: 200 }
        );
      }
      if (url.endsWith('/prompt')) {
        return new Response(
          JSON.stringify({ prompt_id: 'prompt-001' }),
          { status: 200 }
        );
      }
      return new Response('Not found', { status: 404 });
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.generate({
      prompt: 'a cat in space',
      aspectRatio: '16:9',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.imageUrl).toContain('/view?filename=ComfyUI_00001_.png');
      expect(result.value.width).toBe(1920);
      expect(result.value.height).toBe(1080);
      expect(result.value.provider).toBe('comfyui');
    }
  });

  it('should return error when workflow submission fails', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response('Queue full', { status: 503 });
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.generate({ prompt: 'test', aspectRatio: '16:9' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('503');
      expect(result.error.retryable).toBe(true);
    }
  });

  it('should return error when generation fails in history', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/prompt')) {
        return new Response(JSON.stringify({ prompt_id: 'fail-prompt' }), { status: 200 });
      }
      if (url.includes('/history/fail-prompt')) {
        return new Response(
          JSON.stringify({
            'fail-prompt': {
              status: { error: 'Model not found: sdxl-turbo' },
              outputs: {},
            },
          }),
          { status: 200 }
        );
      }
      return new Response('Not found', { status: 404 });
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.generate({ prompt: 'test', aspectRatio: '16:9' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Model not found');
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

  it('should return error when API returns no prompt_id', async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(JSON.stringify({}), { status: 200 });
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.generate({ prompt: 'test', aspectRatio: '16:9' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('no prompt_id');
    }
  });
});
