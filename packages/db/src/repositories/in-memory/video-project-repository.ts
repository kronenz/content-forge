/**
 * In-memory VideoProjectRepository implementation for testing.
 */

import { randomUUID } from 'node:crypto';
import { Ok, Err, type Result } from '@content-forge/core';
import type { VideoProject } from '@content-forge/core';
import type {
  VideoProjectRepository,
  VideoProjectFilters,
  PaginationOptions,
  PaginatedResult,
  DbError,
} from '../interfaces.js';

export class InMemoryVideoProjectRepository implements VideoProjectRepository {
  private readonly store = new Map<string, VideoProject>();

  findById(id: string): Promise<Result<VideoProject | null, DbError>> {
    const item = this.store.get(id) ?? null;
    return Promise.resolve(Ok(item));
  }

  findAll(
    filters?: VideoProjectFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<VideoProject>, DbError>> {
    let items = Array.from(this.store.values());

    if (filters?.status !== undefined) {
      items = items.filter((p) => p.status === filters.status);
    }
    if (filters?.aspectRatio !== undefined) {
      items = items.filter((p) => p.aspectRatio === filters.aspectRatio);
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = items.length;
    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;
    const data = items.slice(offset, offset + limit);

    return Promise.resolve(Ok({ data, total, limit, offset }));
  }

  create(
    project: Omit<VideoProject, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Result<VideoProject, DbError>> {
    const now = new Date().toISOString();
    const created: VideoProject = {
      ...project,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(created.id, created);
    return Promise.resolve(Ok(created));
  }

  update(
    id: string,
    data: Partial<Omit<VideoProject, 'id' | 'createdAt'>>,
  ): Promise<Result<VideoProject, DbError>> {
    const existing = this.store.get(id);
    if (!existing) {
      return Promise.resolve(Err({ code: 'NOT_FOUND', message: `VideoProject ${id} not found` }));
    }
    const updated: VideoProject = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.store.set(id, updated);
    return Promise.resolve(Ok(updated));
  }

  delete(id: string): Promise<Result<void, DbError>> {
    const existing = this.store.get(id);
    if (!existing) {
      return Promise.resolve(Err({ code: 'NOT_FOUND', message: `VideoProject ${id} not found` }));
    }
    this.store.delete(id);
    return Promise.resolve(Ok(undefined));
  }
}
