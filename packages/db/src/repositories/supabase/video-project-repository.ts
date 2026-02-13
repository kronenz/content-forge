/**
 * Supabase VideoProjectRepository implementation.
 */

import { Ok, Err, type Result } from '@content-forge/core';
import type { VideoProject } from '@content-forge/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  VideoProjectRepository,
  VideoProjectFilters,
  PaginationOptions,
  PaginatedResult,
  DbError,
} from '../interfaces.js';
import { videoProjectFromRow, videoProjectToRow } from '../../types.js';
import type { VideoProjectRow } from '../../types.js';

function toDbError(err: unknown): DbError {
  if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
    const e = err as { code: string; message: string };
    return { code: e.code, message: e.message, cause: err };
  }
  return { code: 'UNKNOWN', message: String(err), cause: err };
}

export class SupabaseVideoProjectRepository implements VideoProjectRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Result<VideoProject | null, DbError>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error } = await this.client
        .from('video_projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) return Err(toDbError(error));
      if (!data) return Ok(null);
      return Ok(videoProjectFromRow(data as VideoProjectRow));
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async findAll(
    filters?: VideoProjectFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<VideoProject>, DbError>> {
    try {
      const limit = pagination?.limit ?? 50;
      const offset = pagination?.offset ?? 0;

      let query = this.client
        .from('video_projects')
        .select('*', { count: 'exact' });

      if (filters?.status !== undefined) {
        query = query.eq('status', filters.status);
      }
      if (filters?.aspectRatio !== undefined) {
        query = query.eq('aspect_ratio', filters.aspectRatio);
      }

      query = query.order('created_at', { ascending: false });
      query = query.range(offset, offset + limit - 1);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error, count } = await query;

      if (error) return Err(toDbError(error));

      const projects = (data as VideoProjectRow[]).map(videoProjectFromRow);
      return Ok({ data: projects, total: count ?? 0, limit, offset });
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async create(
    project: Omit<VideoProject, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Result<VideoProject, DbError>> {
    try {
      const row = videoProjectToRow(project);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error } = await this.client
        .from('video_projects')
        .insert(row)
        .select('*')
        .single();

      if (error) return Err(toDbError(error));
      return Ok(videoProjectFromRow(data as VideoProjectRow));
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async update(
    id: string,
    data: Partial<Omit<VideoProject, 'id' | 'createdAt'>>,
  ): Promise<Result<VideoProject, DbError>> {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData['title'] = data.title;
      if (data.materialId !== undefined) updateData['material_id'] = data.materialId;
      if (data.aspectRatio !== undefined) updateData['aspect_ratio'] = data.aspectRatio;
      if (data.scenes !== undefined) updateData['scenes'] = data.scenes;
      if (data.globalStyle !== undefined) updateData['global_style'] = data.globalStyle;
      if (data.status !== undefined) updateData['status'] = data.status;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data: row, error } = await this.client
        .from('video_projects')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) return Err(toDbError(error));
      return Ok(videoProjectFromRow(row as VideoProjectRow));
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async delete(id: string): Promise<Result<void, DbError>> {
    try {
      const { error } = await this.client
        .from('video_projects')
        .delete()
        .eq('id', id);

      if (error) return Err(toDbError(error));
      return Ok(undefined);
    } catch (err) {
      return Err(toDbError(err));
    }
  }
}
