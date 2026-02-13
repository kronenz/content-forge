/**
 * In-memory MetricRepository implementation for testing.
 */

import { randomUUID } from 'node:crypto';
import { Ok, type Result } from '@content-forge/core';
import type { Metric } from '@content-forge/core';
import type {
  MetricRepository,
  MetricFilters,
  PaginationOptions,
  PaginatedResult,
  DbError,
} from '../interfaces.js';

export class InMemoryMetricRepository implements MetricRepository {
  private readonly store = new Map<string, Metric>();

  findById(id: string): Promise<Result<Metric | null, DbError>> {
    const item = this.store.get(id) ?? null;
    return Promise.resolve(Ok(item));
  }

  findAll(
    filters?: MetricFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<Metric>, DbError>> {
    let items = Array.from(this.store.values());

    if (filters?.publicationId !== undefined) {
      items = items.filter((m) => m.publicationId === filters.publicationId);
    }

    items.sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime());

    const total = items.length;
    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;
    const data = items.slice(offset, offset + limit);

    return Promise.resolve(Ok({ data, total, limit, offset }));
  }

  create(
    metric: Omit<Metric, 'id'>,
  ): Promise<Result<Metric, DbError>> {
    const created: Metric = {
      ...metric,
      id: randomUUID(),
    };
    this.store.set(created.id, created);
    return Promise.resolve(Ok(created));
  }

  getSummary(
    publicationId: string,
  ): Promise<
    Result<
      { totalViews: number; totalLikes: number; totalComments: number; totalShares: number; totalClicks: number; count: number } | null,
      DbError
    >
  > {
    const items = Array.from(this.store.values()).filter(
      (m) => m.publicationId === publicationId,
    );

    if (items.length === 0) {
      return Promise.resolve(Ok(null));
    }

    const summary = {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalClicks: 0,
      count: items.length,
    };

    for (const m of items) {
      summary.totalViews += m.views;
      summary.totalLikes += m.likes;
      summary.totalComments += m.comments;
      summary.totalShares += m.shares;
      summary.totalClicks += m.clicks;
    }

    return Promise.resolve(Ok(summary));
  }
}
