import { describe, it, expect } from 'vitest';
import {
  channelToDbEnum,
  dbEnumToChannel,
  materialToRow,
  materialFromRow,
  contentToRow,
  contentFromRow,
  taskToRow,
  taskFromRow,
  publicationToRow,
  publicationFromRow,
  metricToRow,
  metricFromRow,
} from '../types.js';
import type { MaterialRow, ContentRow, TaskRow, PublicationRow, MetricRow } from '../types.js';
import type { Channel } from '@content-forge/core';

describe('Channel DB mapping', () => {
  it('maps x-thread to x in DB enum', () => {
    expect(channelToDbEnum('x-thread')).toBe('x');
  });

  it('maps ig-carousel to ig_carousel in DB enum', () => {
    expect(channelToDbEnum('ig-carousel')).toBe('ig_carousel');
  });

  it('maps ig-single to ig_single in DB enum', () => {
    expect(channelToDbEnum('ig-single')).toBe('ig_single');
  });

  it('maps ig-story to ig_story in DB enum', () => {
    expect(channelToDbEnum('ig-story')).toBe('ig_story');
  });

  it('passes through channels without special mapping', () => {
    const simpleChannels: Channel[] = [
      'medium', 'linkedin', 'threads', 'brunch', 'newsletter',
      'blog', 'kakao', 'youtube', 'shorts', 'reels', 'tiktok', 'webtoon',
    ];
    for (const ch of simpleChannels) {
      expect(channelToDbEnum(ch)).toBe(ch);
    }
  });

  it('round-trips all 16 channels through DB mapping', () => {
    const channels: Channel[] = [
      'medium', 'linkedin', 'x-thread', 'threads', 'brunch', 'newsletter',
      'blog', 'kakao', 'youtube', 'shorts', 'reels', 'tiktok',
      'ig-carousel', 'ig-single', 'ig-story', 'webtoon',
    ];
    for (const ch of channels) {
      expect(dbEnumToChannel(channelToDbEnum(ch))).toBe(ch);
    }
  });
});

describe('Material row mapping', () => {
  const now = new Date('2025-01-15T10:00:00.000Z');

  it('converts domain to row for INSERT', () => {
    const row = materialToRow({
      source: 'rss',
      url: 'https://example.com/article',
      title: 'Test Article',
      content: 'Body text',
      score: 8,
      tags: ['tech', 'ai'],
      status: 'new',
      collectedAt: now,
    });

    expect(row.source).toBe('rss');
    expect(row.collected_at).toBe(now.toISOString());
    expect(row.tags).toEqual(['tech', 'ai']);
    expect(row).not.toHaveProperty('id');
    expect(row).not.toHaveProperty('created_at');
  });

  it('converts row to domain Material', () => {
    const dbRow: MaterialRow = {
      id: 'abc-123',
      source: 'trend',
      url: 'https://example.com',
      title: 'Trending',
      content: 'Content',
      score: 5,
      tags: ['trend'],
      status: 'scored',
      collected_at: now.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const material = materialFromRow(dbRow);
    expect(material.id).toBe('abc-123');
    expect(material.collectedAt).toEqual(now);
    expect(material.createdAt).toEqual(now);
    expect(material.tags).toEqual(['trend']);
  });
});

describe('Content row mapping', () => {
  it('converts channel to DB enum in toRow', () => {
    const row = contentToRow({
      materialId: 'mat-1',
      channel: 'x-thread',
      format: 'thread',
      body: 'Thread content',
      metadata: {},
      status: 'draft',
    });

    expect(row.channel).toBe('x');
    expect(row.material_id).toBe('mat-1');
  });

  it('converts DB enum back to channel in fromRow', () => {
    const dbRow: ContentRow = {
      id: 'cnt-1',
      material_id: 'mat-1',
      channel: 'ig_carousel',
      format: 'carousel',
      body: 'Carousel content',
      metadata: { slides: 5 },
      status: 'approved',
      created_at: '2025-01-15T10:00:00.000Z',
      updated_at: '2025-01-15T10:00:00.000Z',
    };

    const content = contentFromRow(dbRow);
    expect(content.channel).toBe('ig-carousel');
    expect(content.materialId).toBe('mat-1');
  });
});

describe('Task row mapping', () => {
  it('handles nullable dates in toRow', () => {
    const row = taskToRow({
      type: 'write',
      status: 'pending',
      agentId: 'writer-agent',
      input: { prompt: 'test' },
      output: null,
      error: null,
      startedAt: null,
      completedAt: null,
    });

    expect(row.started_at).toBeNull();
    expect(row.completed_at).toBeNull();
    expect(row.agent_id).toBe('writer-agent');
  });

  it('converts date values in fromRow', () => {
    const dbRow: TaskRow = {
      id: 'task-1',
      type: 'collect',
      status: 'completed',
      agent_id: 'collector',
      input: {},
      output: { count: 10 },
      error: null,
      started_at: '2025-01-15T10:00:00.000Z',
      completed_at: '2025-01-15T10:05:00.000Z',
      created_at: '2025-01-15T09:59:00.000Z',
      updated_at: '2025-01-15T10:05:00.000Z',
    };

    const task = taskFromRow(dbRow);
    expect(task.startedAt).toEqual(new Date('2025-01-15T10:00:00.000Z'));
    expect(task.completedAt).toEqual(new Date('2025-01-15T10:05:00.000Z'));
  });
});

describe('Publication row mapping', () => {
  it('round-trips through toRow and fromRow', () => {
    const pubData = {
      contentId: 'cnt-1',
      channel: 'ig-story' as Channel,
      externalUrl: 'https://instagram.com/story/123',
      externalId: 'story-123',
      publishedAt: new Date('2025-01-15T12:00:00.000Z'),
      metadata: { reach: 1000 },
    };

    const row = publicationToRow(pubData);
    expect(row.channel).toBe('ig_story');
    expect(row.content_id).toBe('cnt-1');

    const fullRow: PublicationRow = {
      id: 'pub-1',
      ...row,
      created_at: '2025-01-15T12:00:00.000Z',
    };
    const pub = publicationFromRow(fullRow);
    expect(pub.channel).toBe('ig-story');
    expect(pub.contentId).toBe('cnt-1');
  });
});

describe('Metric row mapping', () => {
  it('round-trips through toRow and fromRow', () => {
    const metricData = {
      publicationId: 'pub-1',
      views: 1000,
      likes: 50,
      comments: 10,
      shares: 5,
      clicks: 100,
      measuredAt: new Date('2025-01-16T00:00:00.000Z'),
    };

    const row = metricToRow(metricData);
    expect(row.publication_id).toBe('pub-1');
    expect(row.views).toBe(1000);

    const fullRow: MetricRow = {
      id: 'met-1',
      ...row,
      created_at: '2025-01-16T00:00:00.000Z',
    };
    const metric = metricFromRow(fullRow);
    expect(metric.publicationId).toBe('pub-1');
    expect(metric.measuredAt).toEqual(new Date('2025-01-16T00:00:00.000Z'));
  });
});
