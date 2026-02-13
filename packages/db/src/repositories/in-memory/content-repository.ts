/**
 * In-memory ContentRepository implementation for testing.
 */

import { randomUUID } from 'node:crypto';
import { Ok, Err, type Result } from '@content-forge/core';
import type { Content, ContentStatus } from '@content-forge/core';
import type {
  ContentRepository,
  ContentFilters,
  PaginationOptions,
  PaginatedResult,
  DbError,
} from '../interfaces.js';

export class InMemoryContentRepository implements ContentRepository {
  private readonly store = new Map<string, Content>();

  findById(id: string): Promise<Result<Content | null, DbError>> {
    const item = this.store.get(id) ?? null;
    return Promise.resolve(Ok(item));
  }

  findAll(
    filters?: ContentFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<Content>, DbError>> {
    let items = Array.from(this.store.values());

    if (filters?.status !== undefined) {
      items = items.filter((c) => c.status === filters.status);
    }
    if (filters?.channel !== undefined) {
      items = items.filter((c) => c.channel === filters.channel);
    }
    if (filters?.materialId !== undefined) {
      items = items.filter((c) => c.materialId === filters.materialId);
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = items.length;
    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;
    const data = items.slice(offset, offset + limit);

    return Promise.resolve(Ok({ data, total, limit, offset }));
  }

  create(
    content: Omit<Content, 'id' | 'createdAt'>,
  ): Promise<Result<Content, DbError>> {
    const now = new Date();
    const created: Content = {
      ...content,
      id: randomUUID(),
      createdAt: now,
    };
    this.store.set(created.id, created);
    return Promise.resolve(Ok(created));
  }

  update(
    id: string,
    data: Partial<Omit<Content, 'id' | 'createdAt'>>,
  ): Promise<Result<Content, DbError>> {
    const existing = this.store.get(id);
    if (!existing) {
      return Promise.resolve(Err({ code: 'NOT_FOUND', message: `Content ${id} not found` }));
    }
    const updated: Content = { ...existing, ...data };
    this.store.set(id, updated);
    return Promise.resolve(Ok(updated));
  }

  async updateStatus(
    id: string,
    status: ContentStatus,
  ): Promise<Result<Content, DbError>> {
    return this.update(id, { status });
  }
}
