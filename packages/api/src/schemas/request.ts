/**
 * Zod schemas for API request validation
 */

import { z } from 'zod';

export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

export const CollectMaterialsSchema = z.object({
  sources: z.array(z.string()).optional(),
});

export const ScoreMaterialsSchema = z.object({
  materialIds: z.array(z.string()).optional(),
});

export const AssignPipelineSchema = z.object({
  materialId: z.string().min(1),
  pipelineType: z.enum(['text', 'thread', 'longform', 'shortform', 'snackable', 'webtoon']),
});

export const TransformSchema = z.object({
  materialId: z.string().min(1),
  channels: z.array(z.enum([
    'medium', 'linkedin', 'x-thread', 'brunch', 'newsletter',
    'blog', 'threads', 'kakao', 'youtube', 'shorts',
    'reels', 'tiktok', 'ig-carousel', 'ig-single', 'ig-story', 'webtoon',
  ])).min(1),
});

export const PublishSchema = z.object({
  contentId: z.string().min(1),
  channels: z.array(z.enum([
    'medium', 'linkedin', 'x-thread', 'brunch', 'newsletter',
    'blog', 'threads', 'kakao', 'youtube', 'shorts',
    'reels', 'tiktok', 'ig-carousel', 'ig-single', 'ig-story', 'webtoon',
  ])).min(1),
});

export const UpdateContentStatusSchema = z.object({
  status: z.enum(['draft', 'review', 'approved', 'published']),
});

export const UpdateTaskStatusSchema = z.object({
  status: z.enum(['pending', 'running', 'completed', 'failed']),
});

export const CreateMaterialSchema = z.object({
  source: z.string().min(1),
  url: z.string().url(),
  title: z.string().min(1),
  content: z.string().min(1),
  score: z.number().int().min(1).max(10).default(5),
  tags: z.array(z.string()).default([]),
});

export const CreateContentSchema = z.object({
  materialId: z.string().min(1),
  channel: z.enum([
    'medium', 'linkedin', 'x-thread', 'brunch', 'newsletter',
    'blog', 'threads', 'kakao', 'youtube', 'shorts',
    'reels', 'tiktok', 'ig-carousel', 'ig-single', 'ig-story', 'webtoon',
  ]),
  format: z.string().min(1),
  body: z.string().min(1),
  metadata: z.record(z.unknown()).default({}),
});

// ---------------------------------------------------------------------------
// Video project schemas
// ---------------------------------------------------------------------------

export const CreateVideoProjectSchema = z.object({
  title: z.string().min(1).max(200),
  aspectRatio: z.enum(['16:9', '9:16']).default('16:9'),
  materialId: z.string().optional().default(''),
});

export const UpdateVideoProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  globalStyle: z.object({
    colorScheme: z.enum(['brand-dark', 'brand-light', 'custom']),
    fontFamily: z.string(),
    musicTrackUrl: z.string().optional(),
  }).optional(),
  status: z.enum(['scripting', 'editing', 'rendering', 'complete']).optional(),
});

export const AddSceneSchema = z.object({
  afterSceneId: z.string().optional(),
  scene: z.object({
    narration: z.object({
      text: z.string(),
      voiceId: z.string(),
      audioUrl: z.string().optional(),
      durationMs: z.number().positive().optional(),
      status: z.enum(['draft', 'generating', 'ready', 'error']).default('draft'),
    }),
    visual: z.object({
      source: z.any(),
      previewUrl: z.string().optional(),
      status: z.enum(['draft', 'generating', 'ready', 'error']).default('draft'),
      versions: z.array(z.any()).default([]),
    }),
    presenter: z.object({
      enabled: z.boolean().default(false),
      avatarProfileId: z.string().default(''),
      position: z.enum(['bottom-right', 'bottom-left', 'center-right']).default('bottom-right'),
      size: z.enum(['small', 'medium', 'large']).default('medium'),
      shape: z.enum(['circle', 'rounded', 'full-body']).default('circle'),
      background: z.enum(['transparent', 'blurred', 'gradient']).default('transparent'),
      gesture: z.enum(['talking', 'explaining', 'pointing', 'nodding']).default('talking'),
      lipSync: z.boolean().default(true),
      enterAnimation: z.enum(['fade-in', 'slide-in', 'pop']).default('fade-in'),
      videoUrl: z.string().optional(),
      status: z.enum(['draft', 'generating', 'ready', 'error']).default('draft'),
    }),
    overlay: z.object({
      subtitles: z.boolean().default(false),
      subtitleStyle: z.enum(['minimal', 'bold', 'karaoke']).optional(),
      lowerThird: z.string().optional(),
      watermark: z.boolean().default(false),
    }),
    timing: z.object({
      durationMs: z.number().positive().default(5000),
      transitionIn: z.enum(['cut', 'fade', 'slide', 'zoom']).default('cut'),
      transitionDurationMs: z.number().nonnegative().default(300),
    }),
  }),
});

export const UpdateSceneSchema = z.object({
  narration: z.any().optional(),
  visual: z.any().optional(),
  presenter: z.any().optional(),
  overlay: z.any().optional(),
  timing: z.any().optional(),
});

export const ReorderScenesSchema = z.object({
  sceneIds: z.array(z.string()).min(1),
});
