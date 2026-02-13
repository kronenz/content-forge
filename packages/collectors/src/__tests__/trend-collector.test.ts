import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrendCollector } from '../trend-collector.js';

// Mock rss-parser
vi.mock('rss-parser', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      parseURL: vi.fn(),
    })),
  };
});

describe('TrendCollector', () => {
  let collector: TrendCollector;

  beforeEach(() => {
    vi.restoreAllMocks();
    collector = new TrendCollector({
      name: 'test-trends',
      source: 'google-trends',
      intervalMs: 3600000,
      geo: 'KR',
    });
  });

  it('should create an instance', () => {
    expect(collector).toBeDefined();
  });

  it('should collect trends from RSS feed', async () => {
    const mockFeed = {
      items: [
        {
          title: 'AI Technology',
          link: 'https://trends.google.com/ai',
          contentSnippet: '50,000+ searches',
          pubDate: 'Wed, 01 Jan 2025 00:00:00 GMT',
        },
        {
          title: 'Machine Learning',
          link: 'https://trends.google.com/ml',
          contentSnippet: '20,000+ searches',
          pubDate: 'Wed, 01 Jan 2025 00:00:00 GMT',
        },
      ],
    };

    const parserInstance = (collector as any).parser;
    parserInstance.parseURL = vi.fn().mockResolvedValue(mockFeed);

    const result = await collector.collect();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBeGreaterThanOrEqual(1);
      expect(result.value[0]!.source).toBe('google-trends');
      expect(result.value[0]!.status).toBe('new');
      expect(result.value[0]!.tags).toContain('trend');
      expect(result.value[0]!.tags).toContain('geo:KR');
    }
  });

  it('should handle fetch failure', async () => {
    const parserInstance = (collector as any).parser;
    parserInstance.parseURL = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await collector.collect();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.collector).toBe('test-trends');
    }
  });

  it('should handle network error', async () => {
    const parserInstance = (collector as any).parser;
    parserInstance.parseURL = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await collector.collect();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('KR');
    }
  });

  it('should skip items without link or title', async () => {
    const mockFeed = {
      items: [
        { title: 'Valid', link: 'https://trends.google.com/v', contentSnippet: 'ok' },
        { title: '', link: 'https://trends.google.com/a', contentSnippet: '' },
        { title: 'No Link', link: '', contentSnippet: '' },
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
