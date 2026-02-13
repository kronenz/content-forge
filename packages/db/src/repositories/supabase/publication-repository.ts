/**
 * Supabase PublicationRepository implementation.
 */

import { Ok, Err, type Result } from '@content-forge/core';
import type { Publication } from '@content-forge/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PublicationRepository,
  PublicationFilters,
  PaginationOptions,
  PaginatedResult,
  DbError,
} from '../interfaces.js';
import { publicationFromRow, publicationToRow, channelToDbEnum } from '../../types.js';
import type { PublicationRow } from '../../types.js';

function toDbError(err: unknown): DbError {
  if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
    const e = err as { code: string; message: string };
    return { code: e.code, message: e.message, cause: err };
  }
  return { code: 'UNKNOWN', message: String(err), cause: err };
}

export class SupabasePublicationRepository implements PublicationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Result<Publication | null, DbError>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error } = await this.client
        .from('publications')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) return Err(toDbError(error));
      if (!data) return Ok(null);
      return Ok(publicationFromRow(data as PublicationRow));
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async findAll(
    filters?: PublicationFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<Publication>, DbError>> {
    try {
      const limit = pagination?.limit ?? 50;
      const offset = pagination?.offset ?? 0;

      let query = this.client
        .from('publications')
        .select('*', { count: 'exact' });

      if (filters?.channel !== undefined) {
        query = query.eq('channel', channelToDbEnum(filters.channel));
      }
      if (filters?.contentId !== undefined) {
        query = query.eq('content_id', filters.contentId);
      }

      query = query.order('published_at', { ascending: false });
      query = query.range(offset, offset + limit - 1);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error, count } = await query;

      if (error) return Err(toDbError(error));

      const publications = (data as PublicationRow[]).map(publicationFromRow);
      return Ok({ data: publications, total: count ?? 0, limit, offset });
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async create(
    publication: Omit<Publication, 'id'>,
  ): Promise<Result<Publication, DbError>> {
    try {
      const row = publicationToRow(publication);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error } = await this.client
        .from('publications')
        .insert(row)
        .select('*')
        .single();

      if (error) return Err(toDbError(error));
      return Ok(publicationFromRow(data as PublicationRow));
    } catch (err) {
      return Err(toDbError(err));
    }
  }
}
