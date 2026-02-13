/**
 * In-memory TaskRepository implementation for testing.
 */

import { randomUUID } from 'node:crypto';
import { Ok, Err, type Result } from '@content-forge/core';
import type { Task, TaskStatus } from '@content-forge/core';
import type {
  TaskRepository,
  TaskFilters,
  PaginationOptions,
  PaginatedResult,
  DbError,
} from '../interfaces.js';

export class InMemoryTaskRepository implements TaskRepository {
  private readonly store = new Map<string, Task>();

  findById(id: string): Promise<Result<Task | null, DbError>> {
    const item = this.store.get(id) ?? null;
    return Promise.resolve(Ok(item));
  }

  findAll(
    filters?: TaskFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<Task>, DbError>> {
    let items = Array.from(this.store.values());

    if (filters?.status !== undefined) {
      items = items.filter((t) => t.status === filters.status);
    }
    if (filters?.type !== undefined) {
      items = items.filter((t) => t.type === filters.type);
    }
    if (filters?.agentId !== undefined) {
      items = items.filter((t) => t.agentId === filters.agentId);
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = items.length;
    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;
    const data = items.slice(offset, offset + limit);

    return Promise.resolve(Ok({ data, total, limit, offset }));
  }

  create(
    task: Omit<Task, 'id' | 'createdAt'>,
  ): Promise<Result<Task, DbError>> {
    const now = new Date();
    const created: Task = {
      ...task,
      id: randomUUID(),
      createdAt: now,
    };
    this.store.set(created.id, created);
    return Promise.resolve(Ok(created));
  }

  update(
    id: string,
    data: Partial<Omit<Task, 'id' | 'createdAt'>>,
  ): Promise<Result<Task, DbError>> {
    const existing = this.store.get(id);
    if (!existing) {
      return Promise.resolve(Err({ code: 'NOT_FOUND', message: `Task ${id} not found` }));
    }
    const updated: Task = { ...existing, ...data };
    this.store.set(id, updated);
    return Promise.resolve(Ok(updated));
  }

  async updateStatus(
    id: string,
    status: TaskStatus,
  ): Promise<Result<Task, DbError>> {
    return this.update(id, { status });
  }
}
