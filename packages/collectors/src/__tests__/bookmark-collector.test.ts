import { describe, it, expect, vi, afterEach } from 'vitest';
import { BookmarkCollector } from '../bookmark-collector.js';

describe('BookmarkCollector', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should create an instance', () => {
    const collector = new BookmarkCollector({
      name: 'test-bookmarks',
      source: 'raindrop',
      intervalMs: 3600000,
      apiToken: 'test-token',
    });
    expect(collector).toBeDefined();
  });

  it('should collect bookmarks from Raindrop API', async () => {
    const mockResponse = {
      result: true,
      items: [
        {
          _id: 123,
          link: 'https://example.com/article',
          title: 'Great Article',
          excerpt: 'Article summary here',
          tags: ['tech', 'ai'],
          created: '2024-01-01T00:00:00Z',
          domain: 'example.com',
        },
        {
          _id: 456,
          link: 'https://other.com/post',
          title: 'Another Post',
          excerpt: 'Post summary',
          tags: ['design'],
          created: '2024-01-02T00:00:00Z',
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const collector = new BookmarkCollector({
      name: 'test-bookmarks',
      source: 'raindrop',
      intervalMs: 3600000,
      apiToken: 'test-token',
    });

    const result = await collector.collect();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0]!.title).toBe('Great Article');
      expect(result.value[0]!.url).toBe('https://example.com/article');
      expect(result.value[0]!.tags).toContain('tech');
      expect(result.value[0]!.tags).toContain('domain:example.com');
    }

    // Verify auth header
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('raindrop.io'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
        }),
      }),
    );
  });

  it('should handle API error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    const collector = new BookmarkCollector({
      name: 'test-bookmarks',
      source: 'raindrop',
      intervalMs: 3600000,
      apiToken: 'bad-token',
    });

    const result = await collector.collect();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.collector).toBe('test-bookmarks');
    }
  });

  it('should skip items without link or title', async () => {
    const mockResponse = {
      result: true,
      items: [
        { _id: 1, link: 'https://a.com', title: 'Valid', excerpt: '', tags: [], created: '2024-01-01T00:00:00Z' },
        { _id: 2, link: '', title: 'No Link', excerpt: '', tags: [], created: '2024-01-01T00:00:00Z' },
        { _id: 3, link: 'https://b.com', title: '', excerpt: '', tags: [], created: '2024-01-01T00:00:00Z' },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const collector = new BookmarkCollector({
      name: 'test-bookmarks',
      source: 'raindrop',
      intervalMs: 3600000,
      apiToken: 'test-token',
    });

    const result = await collector.collect();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
    }
  });
});
