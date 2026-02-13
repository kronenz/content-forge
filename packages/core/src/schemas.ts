/**
 * Zod schemas for validating Claude API outputs and video pipeline data
 */

import { z } from 'zod';

// Scene types
export const SceneTypeSchema = z.enum([
  'title-card', 'text-reveal', 'diagram', 'chart',
  'comparison', 'timeline', 'code-highlight', 'quote',
  'list-reveal', 'infographic', 'transition', 'custom-svg'
]);

// Provider schemas
export const AvatarProviderSchema = z.enum(['heygen', 'd-id', 'synthesia', 'sadtalker', 'liveportrait', 'musetalk']);
export const ImageProviderSchema = z.enum(['dalle', 'flux', 'comfyui', 'midjourney']);
export const VideoProviderSchema = z.enum(['sora', 'runway', 'kling', 'pika']);
export const ImageAnimationSchema = z.enum(['ken-burns', 'zoom', 'pan', 'static']);
export const TransitionTypeSchema = z.enum(['cut', 'fade', 'slide', 'zoom']);
export const PresenterGestureSchema = z.enum(['talking', 'explaining', 'pointing', 'nodding']);
export const AspectRatioSchema = z.enum(['16:9', '9:16']);
export const SceneItemStatusSchema = z.enum(['draft', 'generating', 'ready', 'error']);
export const ProjectStatusSchema = z.enum(['scripting', 'editing', 'rendering', 'complete']);

// Visual source (discriminated union)
export const VisualSourceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('claude-svg'), prompt: z.string(), svgContent: z.string().optional() }),
  z.object({ type: z.literal('ai-video'), provider: VideoProviderSchema, prompt: z.string(), videoUrl: z.string().optional() }),
  z.object({ type: z.literal('ai-image'), provider: ImageProviderSchema, prompt: z.string(), imageUrl: z.string().optional(), animation: ImageAnimationSchema }),
  z.object({ type: z.literal('remotion-template'), templateId: SceneTypeSchema, props: z.record(z.unknown()) }),
  z.object({ type: z.literal('stock'), query: z.string(), selectedUrl: z.string().optional() }),
  z.object({ type: z.literal('screen-recording'), recordingUrl: z.string() }),
  z.object({ type: z.literal('manual-upload'), fileUrl: z.string() }),
]);

// Animation directive
export const AnimationDirectiveSchema = z.object({
  target: z.string(),
  type: z.enum(['fade-in', 'slide-in', 'scale-up', 'draw-path', 'typewriter']),
  delayMs: z.number().nonnegative(),
  durationMs: z.number().positive(),
});

// VideoScriptScene — Claude 대본 생성 출력 검증용 (핵심!)
export const VideoScriptSceneSchema = z.object({
  id: z.string(),
  sceneType: SceneTypeSchema,
  narration: z.string().min(1),
  visualPrompt: z.string().min(1),
  presenterEnabled: z.boolean(),
  presenterGesture: PresenterGestureSchema.optional(),
  durationEstimateMs: z.number().positive().optional(),
});

// VideoScript — Claude 대본 전체 출력 검증용 (핵심!)
export const VideoScriptSchema = z.object({
  title: z.string().min(1),
  scenes: z.array(VideoScriptSceneSchema).min(1),
  totalEstimatedDurationMs: z.number().positive(),
  aspectRatio: AspectRatioSchema,
});

// SceneVisualOutput — Claude 비주얼 생성 출력 검증용
export const SceneVisualOutputSchema = z.object({
  sceneId: z.string(),
  sceneType: SceneTypeSchema,
  props: z.record(z.unknown()),
  svgContent: z.string().optional(),
  animationDirectives: z.array(AnimationDirectiveSchema).optional(),
});

// AudioSegment — TTS 출력 검증용
export const AudioSegmentSchema = z.object({
  sceneId: z.string(),
  audioFilePath: z.string(),
  durationMs: z.number().positive(),
  startOffsetMs: z.number().nonnegative(),
});

// EditableScene (full)
export const SceneNarrationSchema = z.object({
  text: z.string(),
  voiceId: z.string(),
  audioUrl: z.string().optional(),
  durationMs: z.number().positive().optional(),
  status: SceneItemStatusSchema,
});

export const VisualVersionSchema = z.object({
  id: z.string(),
  source: VisualSourceSchema,
  previewUrl: z.string(),
  createdAt: z.string(),
});

export const SceneVisualSchema = z.object({
  source: VisualSourceSchema,
  previewUrl: z.string().optional(),
  status: SceneItemStatusSchema,
  versions: z.array(VisualVersionSchema),
});

export const ScenePresenterSchema = z.object({
  enabled: z.boolean(),
  avatarProfileId: z.string(),
  position: z.enum(['bottom-right', 'bottom-left', 'center-right']),
  size: z.enum(['small', 'medium', 'large']),
  shape: z.enum(['circle', 'rounded', 'full-body']),
  background: z.enum(['transparent', 'blurred', 'gradient']),
  gesture: PresenterGestureSchema,
  lipSync: z.boolean(),
  enterAnimation: z.enum(['fade-in', 'slide-in', 'pop']),
  videoUrl: z.string().optional(),
  status: SceneItemStatusSchema,
});

export const SceneOverlaySchema = z.object({
  subtitles: z.boolean(),
  subtitleStyle: z.enum(['minimal', 'bold', 'karaoke']).optional(),
  lowerThird: z.string().optional(),
  watermark: z.boolean(),
});

export const SceneTimingSchema = z.object({
  durationMs: z.number().positive(),
  transitionIn: TransitionTypeSchema,
  transitionDurationMs: z.number().nonnegative(),
});

export const EditableSceneSchema = z.object({
  id: z.string(),
  order: z.number().nonnegative(),
  narration: SceneNarrationSchema,
  visual: SceneVisualSchema,
  presenter: ScenePresenterSchema,
  overlay: SceneOverlaySchema,
  timing: SceneTimingSchema,
});

// VideoProject
export const VideoProjectStyleSchema = z.object({
  colorScheme: z.enum(['brand-dark', 'brand-light', 'custom']),
  fontFamily: z.string(),
  musicTrackUrl: z.string().optional(),
});

export const VideoProjectSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  materialId: z.string(),
  aspectRatio: AspectRatioSchema,
  scenes: z.array(EditableSceneSchema),
  globalStyle: VideoProjectStyleSchema,
  status: ProjectStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

// AvatarProfile
export const AvatarProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  referencePhotos: z.array(z.string()).min(1),
  referenceVideo: z.string().optional(),
  provider: AvatarProviderSchema,
  providerAvatarId: z.string().optional(),
  linkedVoiceId: z.string().optional(),
  style: z.object({
    clothing: z.enum(['casual', 'business', 'custom']),
    background: z.enum(['transparent', 'studio']),
  }),
});
