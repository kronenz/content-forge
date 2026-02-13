/**
 * @content-forge/db
 * Database repository layer for ContentForge.
 */

// Row types and mapping utilities
export type {
  DbChannelType,
  MaterialRow,
  ContentRow,
  TaskRow,
  PublicationRow,
  MetricRow,
  VideoProjectRow,
} from './types.js';
export {
  channelToDbEnum,
  dbEnumToChannel,
  materialFromRow,
  materialToRow,
  contentFromRow,
  contentToRow,
  taskFromRow,
  taskToRow,
  publicationFromRow,
  publicationToRow,
  metricFromRow,
  metricToRow,
  videoProjectFromRow,
  videoProjectToRow,
} from './types.js';

// Repository interfaces
export type {
  DbError,
  PaginationOptions,
  PaginatedResult,
  MaterialFilters,
  ContentFilters,
  TaskFilters,
  PublicationFilters,
  MetricFilters,
  VideoProjectFilters,
  MaterialRepository,
  ContentRepository,
  TaskRepository,
  PublicationRepository,
  MetricRepository,
  VideoProjectRepository,
  Repositories,
} from './repositories/interfaces.js';

// Supabase client
export { initDbClient, getDbClient, resetDbClient } from './client.js';

// Supabase implementations
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Repositories } from './repositories/interfaces.js';
import { SupabaseMaterialRepository } from './repositories/supabase/material-repository.js';
import { SupabaseContentRepository } from './repositories/supabase/content-repository.js';
import { SupabaseTaskRepository } from './repositories/supabase/task-repository.js';
import { SupabasePublicationRepository } from './repositories/supabase/publication-repository.js';
import { SupabaseMetricRepository } from './repositories/supabase/metric-repository.js';
import { SupabaseVideoProjectRepository } from './repositories/supabase/video-project-repository.js';

export function createSupabaseRepositories(client: SupabaseClient): Repositories {
  return {
    materials: new SupabaseMaterialRepository(client),
    contents: new SupabaseContentRepository(client),
    tasks: new SupabaseTaskRepository(client),
    publications: new SupabasePublicationRepository(client),
    metrics: new SupabaseMetricRepository(client),
    videoProjects: new SupabaseVideoProjectRepository(client),
  };
}

export {
  SupabaseMaterialRepository,
  SupabaseContentRepository,
  SupabaseTaskRepository,
  SupabasePublicationRepository,
  SupabaseMetricRepository,
  SupabaseVideoProjectRepository,
};
