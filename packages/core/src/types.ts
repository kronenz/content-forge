/**
 * Shared types for ContentForge
 */

// Material status
export type MaterialStatus = 'new' | 'scored' | 'assigned' | 'processed';

// Content status
export type ContentStatus = 'draft' | 'review' | 'approved' | 'published';

// Task status
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

// Channel types (16 channels)
export type Channel =
  | 'medium' | 'linkedin' | 'x-thread' | 'brunch' | 'newsletter'
  | 'blog' | 'threads' | 'kakao' | 'youtube' | 'shorts'
  | 'reels' | 'tiktok' | 'ig-carousel' | 'ig-single' | 'ig-story' | 'webtoon';

// Pipeline types (6 pipelines)
export type PipelineType = 'text' | 'thread' | 'longform' | 'shortform' | 'snackable' | 'webtoon';

// Material - collected source material
export interface Material {
  id: string;
  source: string;
  url: string;
  title: string;
  content: string;
  score: number; // 1-10
  tags: string[];
  status: MaterialStatus;
  collectedAt: Date;
  createdAt: Date;
}

// Content - transformed content for a channel
export interface Content {
  id: string;
  materialId: string;
  channel: Channel;
  format: string;
  body: string;
  metadata: Record<string, unknown>;
  status: ContentStatus;
  createdAt: Date;
}

// Task - agent task
export interface Task {
  id: string;
  type: string;
  status: TaskStatus;
  agentId: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

// Publication - publish record
export interface Publication {
  id: string;
  contentId: string;
  channel: Channel;
  externalUrl: string;
  externalId: string;
  publishedAt: Date;
  metadata: Record<string, unknown>;
}

// Metric - performance data
export interface Metric {
  id: string;
  publicationId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  measuredAt: Date;
}

// Agent interface
export interface AgentConfig {
  id: string;
  name: string;
  type: string;
}

// Pipeline interface
export interface PipelineConfig {
  type: PipelineType;
  channels: Channel[];
}

// Raw content input to pipeline
export interface RawContent {
  material: Material;
  pipelineType: PipelineType;
  targetChannels: Channel[];
}

// Channel content output from pipeline
export interface ChannelContent {
  channel: Channel;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
}

// Publish result
export interface PublishResult {
  channel: Channel;
  externalUrl: string;
  externalId: string;
  publishedAt: Date;
}

// ============================================================
// Video Pipeline Types (Phase 3)
// ============================================================

// Scene visual types
export type SceneType =
  | 'title-card' | 'text-reveal' | 'diagram' | 'chart'
  | 'comparison' | 'timeline' | 'code-highlight' | 'quote'
  | 'list-reveal' | 'infographic' | 'transition' | 'custom-svg';

// Visual source providers
export type AvatarProvider = 'heygen' | 'd-id' | 'synthesia' | 'sadtalker' | 'liveportrait' | 'musetalk';
export type ImageProvider = 'dalle' | 'flux' | 'comfyui' | 'midjourney';
export type VideoProvider = 'sora' | 'runway' | 'kling' | 'pika';
export type ImageAnimation = 'ken-burns' | 'zoom' | 'pan' | 'static';
export type TransitionType = 'cut' | 'fade' | 'slide' | 'zoom';
export type SubtitleStyle = 'minimal' | 'bold' | 'karaoke';
export type PresenterPosition = 'bottom-right' | 'bottom-left' | 'center-right';
export type PresenterSize = 'small' | 'medium' | 'large';
export type PresenterShape = 'circle' | 'rounded' | 'full-body';
export type PresenterBackground = 'transparent' | 'blurred' | 'gradient';
export type PresenterGesture = 'talking' | 'explaining' | 'pointing' | 'nodding';
export type ProjectStatus = 'scripting' | 'editing' | 'rendering' | 'complete';
export type SceneItemStatus = 'draft' | 'generating' | 'ready' | 'error';
export type AspectRatio = '16:9' | '9:16';

// Pluggable visual source (discriminated union)
export type VisualSource =
  | { type: 'claude-svg'; prompt: string; svgContent?: string }
  | { type: 'ai-video'; provider: VideoProvider; prompt: string; videoUrl?: string }
  | { type: 'ai-image'; provider: ImageProvider; prompt: string; imageUrl?: string; animation: ImageAnimation }
  | { type: 'remotion-template'; templateId: SceneType; props: Record<string, unknown> }
  | { type: 'stock'; query: string; selectedUrl?: string }
  | { type: 'screen-recording'; recordingUrl: string }
  | { type: 'manual-upload'; fileUrl: string };

// Animation directive for SVG scenes
export interface AnimationDirective {
  target: string;
  type: 'fade-in' | 'slide-in' | 'scale-up' | 'draw-path' | 'typewriter';
  delayMs: number;
  durationMs: number;
}

// Visual version history (for undo/redo per scene)
export interface VisualVersion {
  id: string;
  source: VisualSource;
  previewUrl: string;
  createdAt: string;
}

// Narration block per scene
export interface SceneNarration {
  text: string;
  voiceId: string;
  audioUrl?: string;
  durationMs?: number;
  status: SceneItemStatus;
}

// Visual block per scene
export interface SceneVisual {
  source: VisualSource;
  previewUrl?: string;
  status: SceneItemStatus;
  versions: VisualVersion[];
}

// Presenter avatar overlay per scene
export interface ScenePresenter {
  enabled: boolean;
  avatarProfileId: string;
  position: PresenterPosition;
  size: PresenterSize;
  shape: PresenterShape;
  background: PresenterBackground;
  gesture: PresenterGesture;
  lipSync: boolean;
  enterAnimation: 'fade-in' | 'slide-in' | 'pop';
  videoUrl?: string;
  status: SceneItemStatus;
}

// Scene overlay (subtitles, lower third, watermark)
export interface SceneOverlay {
  subtitles: boolean;
  subtitleStyle?: SubtitleStyle;
  lowerThird?: string;
  watermark: boolean;
}

// Scene timing and transitions
export interface SceneTiming {
  durationMs: number;
  transitionIn: TransitionType;
  transitionDurationMs: number;
}

// Editable scene (the core unit of the video editor)
export interface EditableScene {
  id: string;
  order: number;
  narration: SceneNarration;
  visual: SceneVisual;
  presenter: ScenePresenter;
  overlay: SceneOverlay;
  timing: SceneTiming;
}

// Global style for a video project
export interface VideoProjectStyle {
  colorScheme: 'brand-dark' | 'brand-light' | 'custom';
  fontFamily: string;
  musicTrackUrl?: string;
}

// Video project (top-level container)
export interface VideoProject {
  id: string;
  title: string;
  materialId: string;
  aspectRatio: AspectRatio;
  scenes: EditableScene[];
  globalStyle: VideoProjectStyle;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

// Avatar profile (reusable across projects)
export interface AvatarProfile {
  id: string;
  name: string;
  referencePhotos: string[];
  referenceVideo?: string;
  provider: AvatarProvider;
  providerAvatarId?: string;
  linkedVoiceId?: string;
  style: {
    clothing: 'casual' | 'business' | 'custom';
    background: 'transparent' | 'studio';
  };
}

// Video script (intermediate: output of script generation stage)
export interface VideoScript {
  title: string;
  scenes: VideoScriptScene[];
  totalEstimatedDurationMs: number;
  aspectRatio: AspectRatio;
}

// Script-level scene (before TTS/visual generation)
export interface VideoScriptScene {
  id: string;
  sceneType: SceneType;
  narration: string;
  visualPrompt: string;
  presenterEnabled: boolean;
  presenterGesture?: PresenterGesture;
  durationEstimateMs?: number;
}

// Audio segment (output of TTS stage)
export interface AudioSegment {
  sceneId: string;
  audioFilePath: string;
  durationMs: number;
  startOffsetMs: number;
}

// Scene visual output (output of visual generation stage)
export interface SceneVisualOutput {
  sceneId: string;
  sceneType: SceneType;
  props: Record<string, unknown>;
  svgContent?: string;
  animationDirectives?: AnimationDirective[];
}
