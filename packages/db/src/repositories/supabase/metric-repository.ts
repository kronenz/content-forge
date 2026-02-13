/**
 * Supabase MetricRepository implementation.
 */

import { Ok, Err, type Result } from '@content-forge/core';
import type { Metric } from '@content-forge/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  MetricRepository,
  MetricFilters,
  PaginationOptions,
  PaginatedResult,
  DbError,
} from '../interfaces.js';
import { metricFromRow, metricToRow } from '../../types.js';
import type { MetricRow } from '../../types.js';

function toDbError(err: unknown): DbError {
  if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
    const e = err as { code: string; message: string };
    return { code: e.code, message: e.message, cause: err };
  }
  return { code: 'UNKNOWN', message: String(err), cause: err };
}

export class SupabaseMetricRepository implements MetricRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Result<Metric | null, DbError>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error } = await this.client
        .from('metrics')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) return Err(toDbError(error));
      if (!data) return Ok(null);
      return Ok(metricFromRow(data as MetricRow));
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async findAll(
    filters?: MetricFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<Metric>, DbError>> {
    try {
      const limit = pagination?.limit ?? 50;
      const offset = pagination?.offset ?? 0;

      let query = this.client
        .from('metrics')
        .select('*', { count: 'exact' });

      if (filters?.publicationId !== undefined) {
        query = query.eq('publication_id', filters.publicationId);
      }

      query = query.order('measured_at', { ascending: false });
      query = query.range(offset, offset + limit - 1);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error, count } = await query;

      if (error) return Err(toDbError(error));

      const metrics = (data as MetricRow[]).map(metricFromRow);
      return Ok({ data: metrics, total: count ?? 0, limit, offset });
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async create(
    metric: Omit<Metric, 'id'>,
  ): Promise<Result<Metric, DbError>> {
    try {
      const row = metricToRow(metric);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error } = await this.client
        .from('metrics')
        .insert(row)
        .select('*')
        .single();

      if (error) return Err(toDbError(error));
      return Ok(metricFromRow(data as MetricRow));
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async getSummary(
    publicationId: string,
  ): Promise<
    Result<
      { totalViews: number; totalLikes: number; totalComments: number; totalShares: number; totalClicks: number; count: number } | null,
      DbError
    >
  > {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error } = await this.client
        .from('metrics')
        .select('views, likes, comments, shares, clicks')
        .eq('publication_id', publicationId);

      if (error) return Err(toDbError(error));
      if (!data || data.length === 0) return Ok(null);

      const summary = {
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalClicks: 0,
        count: data.length,
      };

      for (const row of data) {
        summary.totalViews += (row as { views: number }).views;
        summary.totalLikes += (row as { likes: number }).likes;
        summary.totalComments += (row as { comments: number }).comments;
        summary.totalShares += (row as { shares: number }).shares;
        summary.totalClicks += (row as { clicks: number }).clicks;
      }

      return Ok(summary);
    } catch (err) {
      return Err(toDbError(err));
    }
  }
}
