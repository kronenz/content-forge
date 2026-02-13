import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RssCollector } from '../rss-collector.js';

// Mock rss-parser
vi.mock('rss-parser', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      parseURL: vi.fn(),
    })),
  };
});

describe('RssCollector', () => {
  let collector: RssCollector;

  beforeEach(() => {
    vi.restoreAllMocks();
    collector = new RssCollector({
      name: 'test-rss',
      source: 'rss-feed',
      intervalMs: 60000,
      feedUrls: ['https://example.com/feed.xml'],
    });
  });

  it('should create an instance with config', () => {
    expect(collector).toBeDefined();
  });

  it('should collect materials from feed', async () => {
    const mockFeed = {
      items: [
        {
          title: 'Test Article',
          link: 'https://example.com/article-1',
          content: 'Article content here',
          contentSnippet: 'Article content',
          pubDate: '2024-01-01T00:00:00Z',
          categories: ['tech'],
        },
        {
          title: 'Another Article',
          link: 'https://example.com/article-2',
          content: 'More content',
          contentSnippet: 'More content',
          pubDate: '2024-01-02T00:00:00Z',
          categories: ['science'],
        },
      ],
    };

    // Access the parser mock
    const parserInstance = (collector as any).parser;
    parserInstance.parseURL = vi.fn().mockResolvedValue(mockFeed);

    const result = await collector.collect();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0]!.title).toBe('Test Article');
      expect(result.value[0]!.url).toBe('https://example.com/article-1');
      expect(result.value[0]!.source).toBe('rss-feed');
      expect(result.value[0]!.status).toBe('new');
      expect(result.value[0]!.tags).toContain('tech');
    }
  });

  it('should skip items without link or title', async () => {
    const mockFeed = {
      items: [
        { title: 'Valid', link: 'https://example.com/1', content: 'ok' },
        { title: '', link: 'https://example.com/2', content: 'no title' },
        { title: 'No Link', link: '', content: 'no link' },
        { title: null, link: null, content: 'null fields' },
      ],
    };

    const parserInstance = (collector as any).parser;
    parserInstance.parseURL = vi.fn().mockResolvedValue(mockFeed);

    const result = await collector.collect();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
    }
  });

  it('should handle feed parse failure gracefully', async () => {
    const parserInstance = (collector as any).parser;
    parserInstance.parseURL = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await collector.collect();

    // Should still succeed with empty results (graceful degradation)
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(0);
    }
  });

  it('should deduplicate materials by URL', async () => {
    const mockFeed = {
      items: [
        { title: 'Article A', link: 'https://example.com/same', content: 'a' },
        { title: 'Article B', link: 'https://example.com/same', content: 'b' },
      ],
    };

    const parserInstance = (collector as any).parser;
    parserInstance.parseURL = vi.fn().mockResolvedValue(mockFeed);

    const result = await collector.collect();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
    }
  });
});
