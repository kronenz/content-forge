import { describe, it, expect } from 'vitest';
import {
  VideoScriptSchema,
  VideoScriptSceneSchema,
  SceneVisualOutputSchema,
  VisualSourceSchema,
  AudioSegmentSchema,
  EditableSceneSchema,
  VideoProjectSchema,
  AvatarProfileSchema,
} from '../schemas.js';

describe('Video Pipeline Schemas', () => {
  describe('VideoScriptSceneSchema', () => {
    it('should validate a valid script scene', () => {
      const scene = {
        id: 'scene_1',
        sceneType: 'title-card',
        narration: '오늘은 AI 트렌드에 대해 알아보겠습니다.',
        visualPrompt: '타이틀 카드: "AI 트렌드 2025" 그라디언트 배경',
        presenterEnabled: true,
        presenterGesture: 'talking',
        durationEstimateMs: 5000,
      };
      expect(VideoScriptSceneSchema.safeParse(scene).success).toBe(true);
    });

    it('should reject scene with empty narration', () => {
      const scene = {
        id: 'scene_1',
        sceneType: 'title-card',
        narration: '',
        visualPrompt: 'some prompt',
        presenterEnabled: false,
      };
      expect(VideoScriptSceneSchema.safeParse(scene).success).toBe(false);
    });

    it('should reject invalid scene type', () => {
      const scene = {
        id: 'scene_1',
        sceneType: 'invalid-type',
        narration: 'text',
        visualPrompt: 'prompt',
        presenterEnabled: false,
      };
      expect(VideoScriptSceneSchema.safeParse(scene).success).toBe(false);
    });

    it('should allow optional presenterGesture', () => {
      const scene = {
        id: 'scene_1',
        sceneType: 'diagram',
        narration: 'some narration',
        visualPrompt: 'some prompt',
        presenterEnabled: false,
      };
      const result = VideoScriptSceneSchema.safeParse(scene);
      expect(result.success).toBe(true);
    });
  });

  describe('VideoScriptSchema', () => {
    const validScene = {
      id: 'scene_1',
      sceneType: 'title-card' as const,
      narration: '인트로 나레이션',
      visualPrompt: '타이틀 카드',
      presenterEnabled: true,
    };

    it('should validate a valid video script', () => {
      const script = {
        title: 'AI 트렌드 분석 2025',
        scenes: [validScene],
        totalEstimatedDurationMs: 300000,
        aspectRatio: '16:9',
      };
      expect(VideoScriptSchema.safeParse(script).success).toBe(true);
    });

    it('should reject empty title', () => {
      const script = {
        title: '',
        scenes: [validScene],
        totalEstimatedDurationMs: 300000,
        aspectRatio: '16:9',
      };
      expect(VideoScriptSchema.safeParse(script).success).toBe(false);
    });

    it('should reject empty scenes array', () => {
      const script = {
        title: 'Title',
        scenes: [],
        totalEstimatedDurationMs: 300000,
        aspectRatio: '16:9',
      };
      expect(VideoScriptSchema.safeParse(script).success).toBe(false);
    });

    it('should reject invalid aspect ratio', () => {
      const script = {
        title: 'Title',
        scenes: [validScene],
        totalEstimatedDurationMs: 300000,
        aspectRatio: '4:3',
      };
      expect(VideoScriptSchema.safeParse(script).success).toBe(false);
    });
  });

  describe('VisualSourceSchema', () => {
    it('should validate claude-svg source', () => {
      const source = { type: 'claude-svg', prompt: '차트 생성' };
      expect(VisualSourceSchema.safeParse(source).success).toBe(true);
    });

    it('should validate claude-svg with svgContent', () => {
      const source = { type: 'claude-svg', prompt: '차트', svgContent: '<svg></svg>' };
      expect(VisualSourceSchema.safeParse(source).success).toBe(true);
    });

    it('should validate ai-video source', () => {
      const source = { type: 'ai-video', provider: 'sora', prompt: '데이터센터 영상' };
      expect(VisualSourceSchema.safeParse(source).success).toBe(true);
    });

    it('should validate ai-image source with animation', () => {
      const source = { type: 'ai-image', provider: 'dalle', prompt: '미래 도시', animation: 'ken-burns' };
      expect(VisualSourceSchema.safeParse(source).success).toBe(true);
    });

    it('should validate remotion-template source', () => {
      const source = { type: 'remotion-template', templateId: 'title-card', props: { title: 'Hello' } };
      expect(VisualSourceSchema.safeParse(source).success).toBe(true);
    });

    it('should validate stock source', () => {
      const source = { type: 'stock', query: 'technology office' };
      expect(VisualSourceSchema.safeParse(source).success).toBe(true);
    });

    it('should validate screen-recording source', () => {
      const source = { type: 'screen-recording', recordingUrl: '/recordings/demo.mp4' };
      expect(VisualSourceSchema.safeParse(source).success).toBe(true);
    });

    it('should validate manual-upload source', () => {
      const source = { type: 'manual-upload', fileUrl: '/uploads/custom.png' };
      expect(VisualSourceSchema.safeParse(source).success).toBe(true);
    });

    it('should reject invalid source type', () => {
      const source = { type: 'invalid', prompt: 'test' };
      expect(VisualSourceSchema.safeParse(source).success).toBe(false);
    });

    it('should reject ai-image without animation', () => {
      const source = { type: 'ai-image', provider: 'dalle', prompt: 'test' };
      expect(VisualSourceSchema.safeParse(source).success).toBe(false);
    });

    it('should reject ai-video with invalid provider', () => {
      const source = { type: 'ai-video', provider: 'invalid', prompt: 'test' };
      expect(VisualSourceSchema.safeParse(source).success).toBe(false);
    });
  });

  describe('SceneVisualOutputSchema', () => {
    it('should validate visual output with SVG', () => {
      const output = {
        sceneId: 'scene_1',
        sceneType: 'diagram',
        props: { data: [1, 2, 3] },
        svgContent: '<svg viewBox="0 0 1920 1080"><rect/></svg>',
        animationDirectives: [
          { target: '.bar', type: 'fade-in', delayMs: 0, durationMs: 500 }
        ],
      };
      expect(SceneVisualOutputSchema.safeParse(output).success).toBe(true);
    });

    it('should validate visual output without SVG', () => {
      const output = {
        sceneId: 'scene_1',
        sceneType: 'title-card',
        props: { title: 'Hello', subtitle: 'World' },
      };
      expect(SceneVisualOutputSchema.safeParse(output).success).toBe(true);
    });

    it('should reject negative animation delay', () => {
      const output = {
        sceneId: 'scene_1',
        sceneType: 'diagram',
        props: {},
        animationDirectives: [
          { target: '.item', type: 'fade-in', delayMs: -100, durationMs: 500 }
        ],
      };
      expect(SceneVisualOutputSchema.safeParse(output).success).toBe(false);
    });
  });

  describe('AudioSegmentSchema', () => {
    it('should validate a valid audio segment', () => {
      const segment = {
        sceneId: 'scene_1',
        audioFilePath: '/tmp/audio/scene_1.mp3',
        durationMs: 8200,
        startOffsetMs: 0,
      };
      expect(AudioSegmentSchema.safeParse(segment).success).toBe(true);
    });

    it('should reject zero duration', () => {
      const segment = {
        sceneId: 'scene_1',
        audioFilePath: '/tmp/audio/scene_1.mp3',
        durationMs: 0,
        startOffsetMs: 0,
      };
      expect(AudioSegmentSchema.safeParse(segment).success).toBe(false);
    });
  });

  describe('AvatarProfileSchema', () => {
    it('should validate a valid avatar profile', () => {
      const profile = {
        id: 'avatar_1',
        name: '내 아바타',
        referencePhotos: ['/photos/face1.jpg', '/photos/face2.jpg'],
        provider: 'heygen',
        providerAvatarId: 'hg_abc123',
        linkedVoiceId: 'el_voice_kr',
        style: { clothing: 'business', background: 'transparent' },
      };
      expect(AvatarProfileSchema.safeParse(profile).success).toBe(true);
    });

    it('should reject empty reference photos', () => {
      const profile = {
        id: 'avatar_1',
        name: '내 아바타',
        referencePhotos: [],
        provider: 'heygen',
        style: { clothing: 'casual', background: 'studio' },
      };
      expect(AvatarProfileSchema.safeParse(profile).success).toBe(false);
    });

    it('should reject invalid provider', () => {
      const profile = {
        id: 'avatar_1',
        name: '내 아바타',
        referencePhotos: ['/photos/face1.jpg'],
        provider: 'invalid',
        style: { clothing: 'casual', background: 'studio' },
      };
      expect(AvatarProfileSchema.safeParse(profile).success).toBe(false);
    });
  });
});
