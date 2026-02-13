/**
 * Tests for runway-provider.ts — Runway Gen video generation API wrapper
 * Mocks global fetch to simulate Runway API responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RunwayProvider } from '../providers/runway-provider.js';

function createProvider(): RunwayProvider {
  return new RunwayProvider({ apiKey: 'test-runway-key' });
}

describe('RunwayProvider', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('should have provider set to runway', () => {
    const provider = createProvider();
    expect(provider.provider).toBe('runway');
  });

  it('should create task and poll until completion', async () => {
    let pollCalls = 0;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/v1/text_to_video')) {
        return new Response(JSON.stringify({ id: 'task-runway-001' }), { status: 200 });
      }
      if (url.includes('/v1/tasks/task-runway-001')) {
        pollCalls++;
        if (pollCalls < 2) {
          return new Response(JSON.stringify({ status: 'RUNNING' }), { status: 200 });
        }
        return new Response(
          JSON.stringify({
            status: 'SUCCEEDED',
            output: ['https://cdn.runway.com/result.mp4'],
          }),
          { status: 200 }
        );
      }
      return new Response('Not found', { status: 404 });
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.generate({
      prompt: 'a drone shot over mountains',
      aspectRatio: '16:9',
      durationMs: 6000,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.videoUrl).toBe('https://cdn.runway.com/result.mp4');
      expect(result.value.durationMs).toBe(6000);
      expect(result.value.width).toBe(1920);
      expect(result.value.height).toBe(1080);
      expect(result.value.provider).toBe('runway');
    }
  });

  it('should send correct headers with API key', async () => {
    const fetchSpy = vi.fn(async () => {
      // Return error to avoid entering poll loop — we only check headers
      return new Response('Bad Request', { status: 400 });
    }) as unknown as typeof fetch;
    globalThis.fetch = fetchSpy;

    const provider = createProvider();
    await provider.generate({ prompt: 'test', aspectRatio: '16:9' });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/v1/text_to_video'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-runway-key',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('should return error when generation fails', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/v1/text_to_video')) {
        return new Response(JSON.stringify({ id: 'task-fail' }), { status: 200 });
      }
      if (url.includes('/v1/tasks/task-fail')) {
        return new Response(
          JSON.stringify({ status: 'FAILED', error: 'Content policy violation' }),
          { status: 200 }
        );
      }
      return new Response('Not found', { status: 404 });
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.generate({ prompt: 'test', aspectRatio: '16:9' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Content policy violation');
      expect(result.error.retryable).toBe(true);
    }
  });

  it('should return error on API failure (500)', async () => {
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
      throw new Error('Network timeout');
    }) as typeof fetch;

    const provider = createProvider();
    const result = await provider.generate({ prompt: 'test', aspectRatio: '16:9' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Network timeout');
      expect(result.error.retryable).toBe(true);
    }
  });
});
