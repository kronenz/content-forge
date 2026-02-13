/**
 * Pipeline service — thin bridge between routes and pipeline execution.
 * In future, this will orchestrate strategist + pipeline agents.
 */

import type { PipelineType, Channel } from '@content-forge/core';
import { Ok } from '@content-forge/core';
import type { Result } from '@content-forge/core';
import type { Repositories, DbError } from '@content-forge/db';

export interface AssignResult {
  materialId: string;
  pipelineType: PipelineType;
  assigned: boolean;
}

export interface TransformResult {
  materialId: string;
  channels: Channel[];
  contentIds: string[];
}

export class PipelineService {
  constructor(private readonly repos: Repositories) {}

  async assignPipeline(materialId: string, pipelineType: PipelineType): Promise<Result<AssignResult, DbError>> {
    // Stub: real implementation will call strategist agent
    const result = await this.repos.materials.findById(materialId);
    if (!result.ok) return result;
    if (result.value === null) {
      return { ok: false, error: { code: 'NOT_FOUND', message: `Material ${materialId} not found` } };
    }
    return Ok({ materialId, pipelineType, assigned: true });
  }

  transform(materialId: string, _channels: readonly Channel[]): Promise<Result<TransformResult, DbError>> {
    // Stub: real implementation will run pipeline transformation
    return Promise.resolve(Ok({ materialId, channels: [..._channels], contentIds: [] }));
  }
}
