/**
 * Metrics service — thin bridge between routes and analytics.
 * In future, this will orchestrate analytics collectors.
 */

import { Ok } from '@content-forge/core';
import type { Result } from '@content-forge/core';
import type { Repositories, DbError } from '@content-forge/db';

export interface DashboardSummary {
  materials: Record<string, number>;
  contents: { total: number };
  tasks: { total: number };
  publications: { total: number };
}

export class MetricsService {
  constructor(private readonly repos: Repositories) {}

  async getDashboardSummary(): Promise<Result<DashboardSummary, DbError>> {
    const materialsResult = await this.repos.materials.countByStatus();
    if (!materialsResult.ok) return materialsResult;

    const contentsResult = await this.repos.contents.findAll(undefined, { limit: 0, offset: 0 });
    if (!contentsResult.ok) return contentsResult;

    const tasksResult = await this.repos.tasks.findAll(undefined, { limit: 0, offset: 0 });
    if (!tasksResult.ok) return tasksResult;

    const pubsResult = await this.repos.publications.findAll(undefined, { limit: 0, offset: 0 });
    if (!pubsResult.ok) return pubsResult;

    return Ok({
      materials: materialsResult.value,
      contents: { total: contentsResult.value.total },
      tasks: { total: tasksResult.value.total },
      publications: { total: pubsResult.value.total },
    });
  }
}
