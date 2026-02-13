import { describe, it, expect, vi } from 'vitest';
import { createApp } from '../app.js';
import { createInMemoryRepositories } from '@content-forge/db/testing';
import type { AppConfig } from '../config.js';
import type { Repositories } from '@content-forge/db';

// Mock collectors to avoid real HTTP calls
vi.mock('@content-forge/collectors', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@content-forge/collectors')>();
  return {
    ...actual,
    RssCollector: class MockRssCollector {
      async collect() {
        return {
          ok: true as const,
          value: [
            {
              id: 'rss-1',
              source: 'rss',
              url: 'https://example.com/ai-deep-learning',
              title: 'Deep Learning Breakthroughs in Natural Language Processing',
              content: 'Content from RSS feed about AI and technology trends.',
              score: 0,
              tags: ['tech'],
              status: 'new' as const,
              collectedAt: new Date(),
              createdAt: new Date(),
            },
            {
              id: 'rss-2',
              source: 'rss',
              url: 'https://example.com/marketing-strategy',
              title: 'How Content Marketing Drives Business Growth in Korea',
              content: 'Another article about content marketing strategies.',
              score: 0,
              tags: ['marketing'],
              status: 'new' as const,
              collectedAt: new Date(),
              createdAt: new Date(),
            },
          ],
        };
      }
    },
    TrendCollector: class MockTrendCollector {
      async collect() {
        return {
          ok: true as const,
          value: [
            {
              id: 'trend-1',
              source: 'trend',
              url: 'https://trends.google.com/trend-1',
              title: 'Trending Topic 1',
              content: 'Trending topic about AI developments.',
              score: 7,
              tags: ['trend', 'KR'],
              status: 'new' as const,
              collectedAt: new Date(),
              createdAt: new Date(),
            },
          ],
        };
      }
    },
    BookmarkCollector: class MockBookmarkCollector {
      async collect() {
        return {
          ok: true as const,
          value: [
            {
              id: 'bookmark-1',
              source: 'bookmark',
              url: 'https://example.com/bookmarked',
              title: 'Bookmarked Article',
              content: 'A bookmarked article about content creation.',
              score: 0,
              tags: ['saved'],
              status: 'new' as const,
              collectedAt: new Date(),
              createdAt: new Date(),
            },
          ],
        };
      }
    },
  };
});

const testConfig: AppConfig = {
  PORT: 3000,
  NODE_ENV: 'test',
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_SERVICE_KEY: 'test',
  CONTENT_FORGE_API_KEY: 'test-api-key',
  LOG_LEVEL: 'error',
  CORS_ORIGIN: 'http://localhost:5173',
  RSS_FEED_URLS: 'https://example.com/feed.xml',
  TREND_GEO: 'KR',
  RAINDROP_API_KEY: 'test-raindrop-key',
  SCORING_KEYWORDS: 'AI,콘텐츠,마케팅',
};

const authHeaders = {
  Authorization: 'Bearer test-api-key',
  'Content-Type': 'application/json',
};

function createTestApp(repos?: Repositories) {
  return createApp({ repos: repos ?? createInMemoryRepositories(), config: testConfig });
}

describe('materials routes', () => {
  it('should return empty materials list', async () => {
    const app = createTestApp();
    const res = await app.request('/api/materials', {
      headers: authHeaders,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.data).toEqual([]);
    expect(body.data.total).toBe(0);
  });

  it('should create and retrieve a material', async () => {
    const app = createTestApp();

    // Create
    const createRes = await app.request('/api/materials', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        source: 'rss',
        url: 'https://example.com/article',
        title: 'Test Article',
        content: 'This is test content for the article.',
        score: 7,
        tags: ['tech', 'ai'],
      }),
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.ok).toBe(true);
    expect(created.data.title).toBe('Test Article');
    expect(created.data.score).toBe(7);
    expect(created.data.status).toBe('new');

    // Retrieve by id
    const getRes = await app.request(`/api/materials/${created.data.id}`, {
      headers: authHeaders,
    });
    expect(getRes.status).toBe(200);
    const retrieved = await getRes.json();
    expect(retrieved.ok).toBe(true);
    expect(retrieved.data.id).toBe(created.data.id);
    expect(retrieved.data.title).toBe('Test Article');
  });

  it('should return 404 for non-existent material', async () => {
    const app = createTestApp();
    const res = await app.request('/api/materials/non-existent-id', {
      headers: authHeaders,
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should support pagination parameters', async () => {
    const app = createTestApp();
    const res = await app.request('/api/materials?limit=5&offset=0', {
      headers: authHeaders,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.limit).toBe(5);
    expect(body.data.offset).toBe(0);
  });
});

describe('materials collect', () => {
  it('should collect materials from specified sources and save to DB', async () => {
    const repos = createInMemoryRepositories();
    const app = createTestApp(repos);

    const res = await app.request('/api/materials/collect', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ sources: ['rss'] }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.length).toBe(2);
    expect(body.data[0].source).toBe('rss');

    // Verify materials were persisted in DB
    const dbResult = await repos.materials.findAll();
    expect(dbResult.ok).toBe(true);
    if (dbResult.ok) {
      expect(dbResult.value.total).toBe(2);
    }
  });

  it('should collect from multiple sources in parallel', async () => {
    const repos = createInMemoryRepositories();
    const app = createTestApp(repos);

    const res = await app.request('/api/materials/collect', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ sources: ['rss', 'trend', 'bookmark'] }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    // 2 rss + 1 trend + 1 bookmark = 4
    expect(body.data.length).toBe(4);

    // Verify all saved in DB
    const dbResult = await repos.materials.findAll();
    expect(dbResult.ok).toBe(true);
    if (dbResult.ok) {
      expect(dbResult.value.total).toBe(4);
    }
  });

  it('should return empty array when no sources configured', async () => {
    const configNoSources: AppConfig = {
      ...testConfig,
      RSS_FEED_URLS: '',
      RAINDROP_API_KEY: '',
    };
    const app = createApp({
      repos: createInMemoryRepositories(),
      config: configNoSources,
    });

    const res = await app.request('/api/materials/collect', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ sources: ['rss', 'bookmark'] }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toEqual([]);
  });
});

describe('materials score', () => {
  it('should score new materials and update status to scored', async () => {
    const repos = createInMemoryRepositories();
    const app = createTestApp(repos);

    // First, create some materials manually
    await repos.materials.create({
      source: 'rss',
      url: 'https://example.com/ai-article',
      title: 'AI Technology Trends',
      content: 'This article covers AI and 콘텐츠 마케팅 strategies for modern businesses.',
      score: 0,
      tags: ['tech'],
      status: 'new',
      collectedAt: new Date(),
    });
    await repos.materials.create({
      source: 'rss',
      url: 'https://example.com/another',
      title: 'Another Article',
      content: 'Short content.',
      score: 0,
      tags: [],
      status: 'new',
      collectedAt: new Date(),
    });

    // Score all new materials
    const res = await app.request('/api/materials/score', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.length).toBe(2);

    // All scored materials should have status 'scored'
    for (const material of body.data) {
      expect(material.status).toBe('scored');
      expect(material.score).toBeGreaterThan(0);
    }
  });

  it('should score specific materials by ID', async () => {
    const repos = createInMemoryRepositories();
    const app = createTestApp(repos);

    // Create materials
    const m1 = await repos.materials.create({
      source: 'rss',
      url: 'https://example.com/specific',
      title: 'Specific AI Article',
      content: 'Content about AI technology and 콘텐츠 creation.',
      score: 0,
      tags: [],
      status: 'new',
      collectedAt: new Date(),
    });
    await repos.materials.create({
      source: 'rss',
      url: 'https://example.com/other',
      title: 'Other Article',
      content: 'Other content.',
      score: 0,
      tags: [],
      status: 'new',
      collectedAt: new Date(),
    });

    // Score only the first one
    const targetId = m1.ok ? m1.value.id : '';
    const res = await app.request('/api/materials/score', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ materialIds: [targetId] }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.length).toBe(1);
    expect(body.data[0].status).toBe('scored');
  });

  it('should return empty array when no materials to score', async () => {
    const app = createTestApp();
    const res = await app.request('/api/materials/score', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toEqual([]);
  });
});
