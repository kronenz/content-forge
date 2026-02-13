/**
 * In-memory MaterialRepository implementation for testing.
 */

import { randomUUID } from 'node:crypto';
import { Ok, Err, type Result } from '@content-forge/core';
import type { Material, MaterialStatus } from '@content-forge/core';
import type {
  MaterialRepository,
  MaterialFilters,
  PaginationOptions,
  PaginatedResult,
  DbError,
} from '../interfaces.js';

export class InMemoryMaterialRepository implements MaterialRepository {
  private readonly store = new Map<string, Material>();

  findById(id: string): Promise<Result<Material | null, DbError>> {
    const item = this.store.get(id) ?? null;
    return Promise.resolve(Ok(item));
  }

  findAll(
    filters?: MaterialFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<Material>, DbError>> {
    let items = Array.from(this.store.values());

    if (filters?.status !== undefined) {
      items = items.filter((m) => m.status === filters.status);
    }
    if (filters?.source !== undefined) {
      items = items.filter((m) => m.source === filters.source);
    }
    if (filters?.minScore !== undefined) {
      const minScore = filters.minScore;
      items = items.filter((m) => m.score >= minScore);
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = items.length;
    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;
    const data = items.slice(offset, offset + limit);

    return Promise.resolve(Ok({ data, total, limit, offset }));
  }

  create(
    material: Omit<Material, 'id' | 'createdAt'>,
  ): Promise<Result<Material, DbError>> {
    const now = new Date();
    const created: Material = {
      ...material,
      id: randomUUID(),
      createdAt: now,
    };
    this.store.set(created.id, created);
    return Promise.resolve(Ok(created));
  }

  update(
    id: string,
    data: Partial<Omit<Material, 'id' | 'createdAt'>>,
  ): Promise<Result<Material, DbError>> {
    const existing = this.store.get(id);
    if (!existing) {
      return Promise.resolve(Err({ code: 'NOT_FOUND', message: `Material ${id} not found` }));
    }
    const updated: Material = { ...existing, ...data };
    this.store.set(id, updated);
    return Promise.resolve(Ok(updated));
  }

  async updateStatus(
    id: string,
    status: MaterialStatus,
  ): Promise<Result<Material, DbError>> {
    return this.update(id, { status });
  }

  countByStatus(): Promise<Result<Record<MaterialStatus, number>, DbError>> {
    const counts: Record<MaterialStatus, number> = {
      new: 0,
      scored: 0,
      assigned: 0,
      processed: 0,
    };
    for (const m of this.store.values()) {
      counts[m.status]++;
    }
    return Promise.resolve(Ok(counts));
  }
}
