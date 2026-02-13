/**
 * Database row types and mapping utilities for ContentForge.
 *
 * Row types use snake_case matching the SQL schema.
 * Conversion functions translate between domain types (camelCase) and DB rows (snake_case).
 */

import type {
  Channel,
  Material,
  MaterialStatus,
  Content,
  ContentStatus,
  Task,
  TaskStatus,
  Publication,
  Metric,
  VideoProject,
  EditableScene,
  VideoProjectStyle,
} from '@content-forge/core';

// ---------------------------------------------------------------------------
// DB enum for channel_type (matches SQL ENUM exactly)
// ---------------------------------------------------------------------------

export type DbChannelType =
  | 'medium' | 'linkedin' | 'x' | 'threads' | 'brunch' | 'newsletter'
  | 'blog' | 'kakao' | 'youtube' | 'shorts'
  | 'reels' | 'tiktok' | 'ig_carousel' | 'ig_single' | 'ig_story' | 'webtoon';

/** Map canonical Channel → DB ENUM value */
const CHANNEL_TO_DB: Record<Channel, DbChannelType> = {
  'medium': 'medium',
  'linkedin': 'linkedin',
  'x-thread': 'x',
  'threads': 'threads',
  'brunch': 'brunch',
  'newsletter': 'newsletter',
  'blog': 'blog',
  'kakao': 'kakao',
  'youtube': 'youtube',
  'shorts': 'shorts',
  'reels': 'reels',
  'tiktok': 'tiktok',
  'ig-carousel': 'ig_carousel',
  'ig-single': 'ig_single',
  'ig-story': 'ig_story',
  'webtoon': 'webtoon',
};

/** Map DB ENUM value → canonical Channel */
const DB_TO_CHANNEL: Record<DbChannelType, Channel> = {
  'medium': 'medium',
  'linkedin': 'linkedin',
  'x': 'x-thread',
  'threads': 'threads',
  'brunch': 'brunch',
  'newsletter': 'newsletter',
  'blog': 'blog',
  'kakao': 'kakao',
  'youtube': 'youtube',
  'shorts': 'shorts',
  'reels': 'reels',
  'tiktok': 'tiktok',
  'ig_carousel': 'ig-carousel',
  'ig_single': 'ig-single',
  'ig_story': 'ig-story',
  'webtoon': 'webtoon',
};

export function channelToDbEnum(channel: Channel): DbChannelType {
  return CHANNEL_TO_DB[channel];
}

export function dbEnumToChannel(dbValue: DbChannelType): Channel {
  return DB_TO_CHANNEL[dbValue];
}

// ---------------------------------------------------------------------------
// Row types (snake_case, matching SQL columns)
// ---------------------------------------------------------------------------

export interface MaterialRow {
  id: string;
  source: string;
  url: string;
  title: string;
  content: string;
  score: number;
  tags: string[];
  status: MaterialStatus;
  collected_at: string;
  created_at: string;
  updated_at: string;
}

export interface ContentRow {
  id: string;
  material_id: string;
  channel: DbChannelType;
  format: string;
  body: string;
  metadata: Record<string, unknown>;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface TaskRow {
  id: string;
  type: string;
  status: TaskStatus;
  agent_id: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicationRow {
  id: string;
  content_id: string;
  channel: DbChannelType;
  external_url: string;
  external_id: string;
  published_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface MetricRow {
  id: string;
  publication_id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  measured_at: string;
  created_at: string;
}

export interface VideoProjectRow {
  id: string;
  title: string;
  material_id: string;
  aspect_ratio: string;
  scenes: unknown;        // JSONB
  global_style: unknown;  // JSONB
  status: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Row → Domain converters
// ---------------------------------------------------------------------------

export function materialFromRow(row: MaterialRow): Material {
  return {
    id: row.id,
    source: row.source,
    url: row.url,
    title: row.title,
    content: row.content,
    score: row.score,
    tags: row.tags,
    status: row.status,
    collectedAt: new Date(row.collected_at),
    createdAt: new Date(row.created_at),
  };
}

export function contentFromRow(row: ContentRow): Content {
  return {
    id: row.id,
    materialId: row.material_id,
    channel: dbEnumToChannel(row.channel),
    format: row.format,
    body: row.body,
    metadata: row.metadata,
    status: row.status,
    createdAt: new Date(row.created_at),
  };
}

export function taskFromRow(row: TaskRow): Task {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    agentId: row.agent_id,
    input: row.input,
    output: row.output,
    error: row.error,
    startedAt: row.started_at ? new Date(row.started_at) : null,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    createdAt: new Date(row.created_at),
  };
}

export function publicationFromRow(row: PublicationRow): Publication {
  return {
    id: row.id,
    contentId: row.content_id,
    channel: dbEnumToChannel(row.channel),
    externalUrl: row.external_url,
    externalId: row.external_id,
    publishedAt: new Date(row.published_at),
    metadata: row.metadata,
  };
}

export function metricFromRow(row: MetricRow): Metric {
  return {
    id: row.id,
    publicationId: row.publication_id,
    views: row.views,
    likes: row.likes,
    comments: row.comments,
    shares: row.shares,
    clicks: row.clicks,
    measuredAt: new Date(row.measured_at),
  };
}

// ---------------------------------------------------------------------------
// Domain → Row converters (for INSERT — omit id, created_at, updated_at)
// ---------------------------------------------------------------------------

export function materialToRow(
  m: Omit<Material, 'id' | 'createdAt'>
): Omit<MaterialRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    source: m.source,
    url: m.url,
    title: m.title,
    content: m.content,
    score: m.score,
    tags: m.tags,
    status: m.status,
    collected_at: m.collectedAt.toISOString(),
  };
}

export function contentToRow(
  c: Omit<Content, 'id' | 'createdAt'>
): Omit<ContentRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    material_id: c.materialId,
    channel: channelToDbEnum(c.channel),
    format: c.format,
    body: c.body,
    metadata: c.metadata,
    status: c.status,
  };
}

export function taskToRow(
  t: Omit<Task, 'id' | 'createdAt'>
): Omit<TaskRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    type: t.type,
    status: t.status,
    agent_id: t.agentId,
    input: t.input,
    output: t.output,
    error: t.error,
    started_at: t.startedAt ? t.startedAt.toISOString() : null,
    completed_at: t.completedAt ? t.completedAt.toISOString() : null,
  };
}

export function publicationToRow(
  p: Omit<Publication, 'id'>
): Omit<PublicationRow, 'id' | 'created_at'> {
  return {
    content_id: p.contentId,
    channel: channelToDbEnum(p.channel),
    external_url: p.externalUrl,
    external_id: p.externalId,
    published_at: p.publishedAt.toISOString(),
    metadata: p.metadata,
  };
}

export function metricToRow(
  m: Omit<Metric, 'id'>
): Omit<MetricRow, 'id' | 'created_at'> {
  return {
    publication_id: m.publicationId,
    views: m.views,
    likes: m.likes,
    comments: m.comments,
    shares: m.shares,
    clicks: m.clicks,
    measured_at: m.measuredAt.toISOString(),
  };
}

export function videoProjectFromRow(row: VideoProjectRow): VideoProject {
  return {
    id: row.id,
    title: row.title,
    materialId: row.material_id,
    aspectRatio: row.aspect_ratio as VideoProject['aspectRatio'],
    scenes: (row.scenes ?? []) as EditableScene[],
    globalStyle: (row.global_style ?? { colorScheme: 'brand-dark', fontFamily: 'Inter' }) as VideoProjectStyle,
    status: row.status as VideoProject['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function videoProjectToRow(
  p: Omit<VideoProject, 'id' | 'createdAt' | 'updatedAt'>
): Omit<VideoProjectRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    title: p.title,
    material_id: p.materialId,
    aspect_ratio: p.aspectRatio,
    scenes: p.scenes as unknown,
    global_style: p.globalStyle as unknown,
    status: p.status,
  };
}
