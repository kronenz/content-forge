/**
 * Supabase MaterialRepository implementation.
 */

import { Ok, Err, type Result } from '@content-forge/core';
import type { Material, MaterialStatus } from '@content-forge/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  MaterialRepository,
  MaterialFilters,
  PaginationOptions,
  PaginatedResult,
  DbError,
} from '../interfaces.js';
import { materialFromRow, materialToRow } from '../../types.js';
import type { MaterialRow } from '../../types.js';

function toDbError(err: unknown): DbError {
  if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
    const e = err as { code: string; message: string };
    return { code: e.code, message: e.message, cause: err };
  }
  return { code: 'UNKNOWN', message: String(err), cause: err };
}

export class SupabaseMaterialRepository implements MaterialRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Result<Material | null, DbError>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error } = await this.client
        .from('materials')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) return Err(toDbError(error));
      if (!data) return Ok(null);
      return Ok(materialFromRow(data as MaterialRow));
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async findAll(
    filters?: MaterialFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<Material>, DbError>> {
    try {
      const limit = pagination?.limit ?? 50;
      const offset = pagination?.offset ?? 0;

      let query = this.client
        .from('materials')
        .select('*', { count: 'exact' });

      if (filters?.status !== undefined) {
        query = query.eq('status', filters.status);
      }
      if (filters?.source !== undefined) {
        query = query.eq('source', filters.source);
      }
      if (filters?.minScore !== undefined) {
        query = query.gte('score', filters.minScore);
      }

      query = query.order('created_at', { ascending: false });
      query = query.range(offset, offset + limit - 1);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error, count } = await query;

      if (error) return Err(toDbError(error));

      const materials = (data as MaterialRow[]).map(materialFromRow);
      return Ok({ data: materials, total: count ?? 0, limit, offset });
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async create(
    material: Omit<Material, 'id' | 'createdAt'>,
  ): Promise<Result<Material, DbError>> {
    try {
      const row = materialToRow(material);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error } = await this.client
        .from('materials')
        .insert(row)
        .select('*')
        .single();

      if (error) return Err(toDbError(error));
      return Ok(materialFromRow(data as MaterialRow));
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async update(
    id: string,
    data: Partial<Omit<Material, 'id' | 'createdAt'>>,
  ): Promise<Result<Material, DbError>> {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.source !== undefined) updateData['source'] = data.source;
      if (data.url !== undefined) updateData['url'] = data.url;
      if (data.title !== undefined) updateData['title'] = data.title;
      if (data.content !== undefined) updateData['content'] = data.content;
      if (data.score !== undefined) updateData['score'] = data.score;
      if (data.tags !== undefined) updateData['tags'] = data.tags;
      if (data.status !== undefined) updateData['status'] = data.status;
      if (data.collectedAt !== undefined) {
        updateData['collected_at'] = data.collectedAt.toISOString();
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data: row, error } = await this.client
        .from('materials')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) return Err(toDbError(error));
      return Ok(materialFromRow(row as MaterialRow));
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async updateStatus(
    id: string,
    status: MaterialStatus,
  ): Promise<Result<Material, DbError>> {
    return this.update(id, { status });
  }

  async countByStatus(): Promise<Result<Record<MaterialStatus, number>, DbError>> {
    try {
      const counts: Record<MaterialStatus, number> = {
        new: 0,
        scored: 0,
        assigned: 0,
        processed: 0,
      };

      const statuses: MaterialStatus[] = ['new', 'scored', 'assigned', 'processed'];

      for (const status of statuses) {
        const { count, error } = await this.client
          .from('materials')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);

        if (error) return Err(toDbError(error));
        counts[status] = count ?? 0;
      }

      return Ok(counts);
    } catch (err) {
      return Err(toDbError(err));
    }
  }
}
