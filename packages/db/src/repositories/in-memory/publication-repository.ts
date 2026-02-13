/**
 * In-memory PublicationRepository implementation for testing.
 */

import { randomUUID } from 'node:crypto';
import { Ok, type Result } from '@content-forge/core';
import type { Publication } from '@content-forge/core';
import type {
  PublicationRepository,
  PublicationFilters,
  PaginationOptions,
  PaginatedResult,
  DbError,
} from '../interfaces.js';

export class InMemoryPublicationRepository implements PublicationRepository {
  private readonly store = new Map<string, Publication>();

  findById(id: string): Promise<Result<Publication | null, DbError>> {
    const item = this.store.get(id) ?? null;
    return Promise.resolve(Ok(item));
  }

  findAll(
    filters?: PublicationFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<Publication>, DbError>> {
    let items = Array.from(this.store.values());

    if (filters?.channel !== undefined) {
      items = items.filter((p) => p.channel === filters.channel);
    }
    if (filters?.contentId !== undefined) {
      items = items.filter((p) => p.contentId === filters.contentId);
    }

    items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    const total = items.length;
    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;
    const data = items.slice(offset, offset + limit);

    return Promise.resolve(Ok({ data, total, limit, offset }));
  }

  create(
    publication: Omit<Publication, 'id'>,
  ): Promise<Result<Publication, DbError>> {
    const created: Publication = {
      ...publication,
      id: randomUUID(),
    };
    this.store.set(created.id, created);
    return Promise.resolve(Ok(created));
  }
}
