/**
 * Repository interfaces for ContentForge database access.
 */

import type { Result } from '@content-forge/core';
import type {
  Material,
  MaterialStatus,
  Content,
  ContentStatus,
  Channel,
  Task,
  TaskStatus,
  Publication,
  Metric,
  VideoProject,
  ProjectStatus,
  AspectRatio,
} from '@content-forge/core';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface DbError {
  code: string;
  message: string;
  cause?: unknown;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

export interface MaterialFilters {
  status?: MaterialStatus;
  source?: string;
  minScore?: number;
}

export interface ContentFilters {
  status?: ContentStatus;
  channel?: Channel;
  materialId?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  type?: string;
  agentId?: string;
}

export interface PublicationFilters {
  channel?: Channel;
  contentId?: string;
}

export interface MetricFilters {
  publicationId?: string;
}

export interface VideoProjectFilters {
  status?: ProjectStatus;
  aspectRatio?: AspectRatio;
}

// ---------------------------------------------------------------------------
// Repository interfaces
// ---------------------------------------------------------------------------

export interface MaterialRepository {
  findById(id: string): Promise<Result<Material | null, DbError>>;
  findAll(
    filters?: MaterialFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<Material>, DbError>>;
  create(material: Omit<Material, 'id' | 'createdAt'>): Promise<Result<Material, DbError>>;
  update(
    id: string,
    data: Partial<Omit<Material, 'id' | 'createdAt'>>,
  ): Promise<Result<Material, DbError>>;
  updateStatus(id: string, status: MaterialStatus): Promise<Result<Material, DbError>>;
  countByStatus(): Promise<Result<Record<MaterialStatus, number>, DbError>>;
}

export interface ContentRepository {
  findById(id: string): Promise<Result<Content | null, DbError>>;
  findAll(
    filters?: ContentFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<Content>, DbError>>;
  create(content: Omit<Content, 'id' | 'createdAt'>): Promise<Result<Content, DbError>>;
  update(
    id: string,
    data: Partial<Omit<Content, 'id' | 'createdAt'>>,
  ): Promise<Result<Content, DbError>>;
  updateStatus(id: string, status: ContentStatus): Promise<Result<Content, DbError>>;
}

export interface TaskRepository {
  findById(id: string): Promise<Result<Task | null, DbError>>;
  findAll(
    filters?: TaskFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<Task>, DbError>>;
  create(task: Omit<Task, 'id' | 'createdAt'>): Promise<Result<Task, DbError>>;
  update(
    id: string,
    data: Partial<Omit<Task, 'id' | 'createdAt'>>,
  ): Promise<Result<Task, DbError>>;
  updateStatus(id: string, status: TaskStatus): Promise<Result<Task, DbError>>;
}

export interface PublicationRepository {
  findById(id: string): Promise<Result<Publication | null, DbError>>;
  findAll(
    filters?: PublicationFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<Publication>, DbError>>;
  create(publication: Omit<Publication, 'id'>): Promise<Result<Publication, DbError>>;
}

export interface MetricRepository {
  findById(id: string): Promise<Result<Metric | null, DbError>>;
  findAll(
    filters?: MetricFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<Metric>, DbError>>;
  create(metric: Omit<Metric, 'id'>): Promise<Result<Metric, DbError>>;
  getSummary(publicationId: string): Promise<
    Result<
      { totalViews: number; totalLikes: number; totalComments: number; totalShares: number; totalClicks: number; count: number } | null,
      DbError
    >
  >;
}

export interface VideoProjectRepository {
  findById(id: string): Promise<Result<VideoProject | null, DbError>>;
  findAll(
    filters?: VideoProjectFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<VideoProject>, DbError>>;
  create(project: Omit<VideoProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<VideoProject, DbError>>;
  update(
    id: string,
    data: Partial<Omit<VideoProject, 'id' | 'createdAt'>>,
  ): Promise<Result<VideoProject, DbError>>;
  delete(id: string): Promise<Result<void, DbError>>;
}

// ---------------------------------------------------------------------------
// Aggregate repository container
// ---------------------------------------------------------------------------

export interface Repositories {
  materials: MaterialRepository;
  contents: ContentRepository;
  tasks: TaskRepository;
  publications: PublicationRepository;
  metrics: MetricRepository;
  videoProjects: VideoProjectRepository;
}
