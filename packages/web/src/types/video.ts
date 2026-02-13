/**
 * Local type definitions mirroring @content-forge/core video pipeline types.
 * Kept local to avoid build dependency complexity in the Vue frontend.
 */

export type SceneType =
  | 'title-card' | 'text-reveal' | 'diagram' | 'chart'
  | 'comparison' | 'timeline' | 'code-highlight' | 'quote'
  | 'list-reveal' | 'infographic' | 'transition' | 'custom-svg';

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

export type VisualSourceType =
  | 'claude-svg' | 'ai-video' | 'ai-image' | 'remotion-template'
  | 'stock' | 'screen-recording' | 'manual-upload';

export type VisualSource =
  | { type: 'claude-svg'; prompt: string; svgContent?: string }
  | { type: 'ai-video'; provider: VideoProvider; prompt: string; videoUrl?: string }
  | { type: 'ai-image'; provider: ImageProvider; prompt: string; imageUrl?: string; animation: ImageAnimation }
  | { type: 'remotion-template'; templateId: SceneType; props: Record<string, unknown> }
  | { type: 'stock'; query: string; selectedUrl?: string }
  | { type: 'screen-recording'; recordingUrl: string }
  | { type: 'manual-upload'; fileUrl: string };

export interface VisualVersion {
  id: string;
  source: VisualSource;
  previewUrl: string;
  createdAt: string;
}

export interface SceneNarration {
  text: string;
  voiceId: string;
  audioUrl?: string;
  durationMs?: number;
  status: SceneItemStatus;
}

export interface SceneVisual {
  source: VisualSource;
  previewUrl?: string;
  status: SceneItemStatus;
  versions: VisualVersion[];
}

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

export interface SceneOverlay {
  subtitles: boolean;
  subtitleStyle?: SubtitleStyle;
  lowerThird?: string;
  watermark: boolean;
}

export interface SceneTiming {
  durationMs: number;
  transitionIn: TransitionType;
  transitionDurationMs: number;
}

export interface EditableScene {
  id: string;
  order: number;
  narration: SceneNarration;
  visual: SceneVisual;
  presenter: ScenePresenter;
  overlay: SceneOverlay;
  timing: SceneTiming;
}

export interface VideoProjectStyle {
  colorScheme: 'brand-dark' | 'brand-light' | 'custom';
  fontFamily: string;
  musicTrackUrl?: string;
}

export type PreviewMode = 'scene' | 'full';

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
