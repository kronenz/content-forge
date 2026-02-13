import { describe, it, expect, beforeEach } from 'vitest';
import { isOk } from '@content-forge/core';
import { InMemoryMetricRepository } from '../repositories/in-memory/metric-repository.js';
import type { Metric } from '@content-forge/core';

function makeMetric(overrides: Partial<Omit<Metric, 'id'>> = {}): Omit<Metric, 'id'> {
  return {
    publicationId: 'pub-1',
    views: 100,
    likes: 10,
    comments: 3,
    shares: 2,
    clicks: 50,
    measuredAt: new Date('2025-01-16T00:00:00.000Z'),
    ...overrides,
  };
}

describe('InMemoryMetricRepository', () => {
  let repo: InMemoryMetricRepository;

  beforeEach(() => {
    repo = new InMemoryMetricRepository();
  });

  it('creates a metric and assigns an id', async () => {
    const result = await repo.create(makeMetric());
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.id).toBeDefined();
    expect(result.value.views).toBe(100);
  });

  it('finds a metric by id', async () => {
    const createResult = await repo.create(makeMetric());
    if (!isOk(createResult)) return;

    const result = await repo.findById(createResult.value.id);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).not.toBeNull();
    expect(result.value!.publicationId).toBe('pub-1');
  });

  it('returns null for non-existent metric', async () => {
    const result = await repo.findById('nope');
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toBeNull();
  });

  it('filters by publicationId', async () => {
    await repo.create(makeMetric({ publicationId: 'pub-1' }));
    await repo.create(makeMetric({ publicationId: 'pub-2' }));
    await repo.create(makeMetric({ publicationId: 'pub-1' }));

    const result = await repo.findAll({ publicationId: 'pub-1' });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data.length).toBe(2);
  });

  it('returns summary for a publication', async () => {
    await repo.create(makeMetric({ publicationId: 'pub-1', views: 100, likes: 10, comments: 3, shares: 2, clicks: 50 }));
    await repo.create(makeMetric({ publicationId: 'pub-1', views: 200, likes: 20, comments: 5, shares: 3, clicks: 80 }));

    const result = await repo.getSummary('pub-1');
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).not.toBeNull();
    expect(result.value!.totalViews).toBe(300);
    expect(result.value!.totalLikes).toBe(30);
    expect(result.value!.totalComments).toBe(8);
    expect(result.value!.totalShares).toBe(5);
    expect(result.value!.totalClicks).toBe(130);
    expect(result.value!.count).toBe(2);
  });

  it('returns null summary when no metrics exist', async () => {
    const result = await repo.getSummary('pub-nonexistent');
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toBeNull();
  });

  it('paginates results', async () => {
    for (let i = 0; i < 5; i++) {
      await repo.create(makeMetric({ views: i * 100 }));
    }

    const result = await repo.findAll(undefined, { limit: 2, offset: 1 });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data.length).toBe(2);
    expect(result.value.total).toBe(5);
  });

  it('sorts by measuredAt descending', async () => {
    await repo.create(makeMetric({
      measuredAt: new Date('2025-01-10T00:00:00.000Z'),
      views: 50,
    }));
    await repo.create(makeMetric({
      measuredAt: new Date('2025-01-20T00:00:00.000Z'),
      views: 500,
    }));

    const result = await repo.findAll();
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data[0]!.views).toBe(500);
  });
});
