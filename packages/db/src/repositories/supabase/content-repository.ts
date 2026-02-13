/**
 * Supabase ContentRepository implementation.
 */

import { Ok, Err, type Result } from '@content-forge/core';
import type { Content, ContentStatus } from '@content-forge/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ContentRepository,
  ContentFilters,
  PaginationOptions,
  PaginatedResult,
  DbError,
} from '../interfaces.js';
import { contentFromRow, contentToRow, channelToDbEnum } from '../../types.js';
import type { ContentRow } from '../../types.js';

function toDbError(err: unknown): DbError {
  if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
    const e = err as { code: string; message: string };
    return { code: e.code, message: e.message, cause: err };
  }
  return { code: 'UNKNOWN', message: String(err), cause: err };
}

export class SupabaseContentRepository implements ContentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Result<Content | null, DbError>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error } = await this.client
        .from('contents')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) return Err(toDbError(error));
      if (!data) return Ok(null);
      return Ok(contentFromRow(data as ContentRow));
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async findAll(
    filters?: ContentFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<Content>, DbError>> {
    try {
      const limit = pagination?.limit ?? 50;
      const offset = pagination?.offset ?? 0;

      let query = this.client
        .from('contents')
        .select('*', { count: 'exact' });

      if (filters?.status !== undefined) {
        query = query.eq('status', filters.status);
      }
      if (filters?.channel !== undefined) {
        query = query.eq('channel', channelToDbEnum(filters.channel));
      }
      if (filters?.materialId !== undefined) {
        query = query.eq('material_id', filters.materialId);
      }

      query = query.order('created_at', { ascending: false });
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) return Err(toDbError(error));

      const contents = (data as ContentRow[]).map(contentFromRow);
      return Ok({ data: contents, total: count ?? 0, limit, offset });
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async create(
    content: Omit<Content, 'id' | 'createdAt'>,
  ): Promise<Result<Content, DbError>> {
    try {
      const row = contentToRow(content);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error } = await this.client
        .from('contents')
        .insert(row)
        .select('*')
        .single();

      if (error) return Err(toDbError(error));
      return Ok(contentFromRow(data as ContentRow));
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async update(
    id: string,
    data: Partial<Omit<Content, 'id' | 'createdAt'>>,
  ): Promise<Result<Content, DbError>> {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.materialId !== undefined) updateData['material_id'] = data.materialId;
      if (data.channel !== undefined) updateData['channel'] = channelToDbEnum(data.channel);
      if (data.format !== undefined) updateData['format'] = data.format;
      if (data.body !== undefined) updateData['body'] = data.body;
      if (data.metadata !== undefined) updateData['metadata'] = data.metadata;
      if (data.status !== undefined) updateData['status'] = data.status;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data: row, error } = await this.client
        .from('contents')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) return Err(toDbError(error));
      return Ok(contentFromRow(row as ContentRow));
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async updateStatus(
    id: string,
    status: ContentStatus,
  ): Promise<Result<Content, DbError>> {
    return this.update(id, { status });
  }
}
