/**
 * Supabase TaskRepository implementation.
 */

import { Ok, Err, type Result } from '@content-forge/core';
import type { Task, TaskStatus } from '@content-forge/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  TaskRepository,
  TaskFilters,
  PaginationOptions,
  PaginatedResult,
  DbError,
} from '../interfaces.js';
import { taskFromRow, taskToRow } from '../../types.js';
import type { TaskRow } from '../../types.js';

function toDbError(err: unknown): DbError {
  if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
    const e = err as { code: string; message: string };
    return { code: e.code, message: e.message, cause: err };
  }
  return { code: 'UNKNOWN', message: String(err), cause: err };
}

export class SupabaseTaskRepository implements TaskRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Result<Task | null, DbError>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error } = await this.client
        .from('tasks')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) return Err(toDbError(error));
      if (!data) return Ok(null);
      return Ok(taskFromRow(data as TaskRow));
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async findAll(
    filters?: TaskFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<Task>, DbError>> {
    try {
      const limit = pagination?.limit ?? 50;
      const offset = pagination?.offset ?? 0;

      let query = this.client
        .from('tasks')
        .select('*', { count: 'exact' });

      if (filters?.status !== undefined) {
        query = query.eq('status', filters.status);
      }
      if (filters?.type !== undefined) {
        query = query.eq('type', filters.type);
      }
      if (filters?.agentId !== undefined) {
        query = query.eq('agent_id', filters.agentId);
      }

      query = query.order('created_at', { ascending: false });
      query = query.range(offset, offset + limit - 1);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error, count } = await query;

      if (error) return Err(toDbError(error));

      const tasks = (data as TaskRow[]).map(taskFromRow);
      return Ok({ data: tasks, total: count ?? 0, limit, offset });
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async create(
    task: Omit<Task, 'id' | 'createdAt'>,
  ): Promise<Result<Task, DbError>> {
    try {
      const row = taskToRow(task);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, error } = await this.client
        .from('tasks')
        .insert(row)
        .select('*')
        .single();

      if (error) return Err(toDbError(error));
      return Ok(taskFromRow(data as TaskRow));
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async update(
    id: string,
    data: Partial<Omit<Task, 'id' | 'createdAt'>>,
  ): Promise<Result<Task, DbError>> {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.type !== undefined) updateData['type'] = data.type;
      if (data.status !== undefined) updateData['status'] = data.status;
      if (data.agentId !== undefined) updateData['agent_id'] = data.agentId;
      if (data.input !== undefined) updateData['input'] = data.input;
      if (data.output !== undefined) updateData['output'] = data.output;
      if (data.error !== undefined) updateData['error'] = data.error;
      if (data.startedAt !== undefined) {
        updateData['started_at'] = data.startedAt ? data.startedAt.toISOString() : null;
      }
      if (data.completedAt !== undefined) {
        updateData['completed_at'] = data.completedAt ? data.completedAt.toISOString() : null;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data: row, error } = await this.client
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) return Err(toDbError(error));
      return Ok(taskFromRow(row as TaskRow));
    } catch (err) {
      return Err(toDbError(err));
    }
  }

  async updateStatus(
    id: string,
    status: TaskStatus,
  ): Promise<Result<Task, DbError>> {
    return this.update(id, { status });
  }
}
