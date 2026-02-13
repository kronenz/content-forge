import { describe, it, expect } from 'vitest';
import { renderScenePreview } from '../utils/preview-renderer.js';
import type { EditableScene } from '@content-forge/core';

function createMockScene(overrides: Partial<EditableScene> = {}): EditableScene {
  return {
    id: 'scene_1',
    order: 0,
    narration: {
      text: '테스트 나레이션입니다.',
      voiceId: 'voice_1',
      status: 'ready',
      durationMs: 5000,
    },
    visual: {
      source: { type: 'remotion-template', templateId: 'title-card', props: { title: '테스트 제목', subtitle: '서브타이틀' } },
      status: 'ready',
      versions: [],
    },
    presenter: {
      enabled: true,
      avatarProfileId: 'avatar_1',
      position: 'bottom-right',
      size: 'medium',
      shape: 'circle',
      background: 'transparent',
      gesture: 'talking',
      lipSync: true,
      enterAnimation: 'fade-in',
      status: 'ready',
    },
    overlay: {
      subtitles: true,
      watermark: false,
    },
    timing: {
      durationMs: 5000,
      transitionIn: 'fade',
      transitionDurationMs: 500,
    },
    ...overrides,
  };
}

describe('Preview Renderer', () => {
  it('should generate valid HTML for title-card scene', () => {
    const scene = createMockScene();
    const html = renderScenePreview(scene);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('테스트 제목');
    expect(html).toContain('서브타이틀');
    expect(html).toContain('테스트 나레이션입니다.');
  });

  it('should show presenter when enabled', () => {
    const scene = createMockScene({ presenter: { ...createMockScene().presenter, enabled: true } });
    const html = renderScenePreview(scene);
    expect(html).toContain('presenter-pip');
    expect(html).not.toContain('presenter-pip hidden');
  });

  it('should hide presenter when disabled', () => {
    const scene = createMockScene({
      presenter: { ...createMockScene().presenter, enabled: false },
    });
    const html = renderScenePreview(scene);
    expect(html).toContain('presenter-pip hidden');
  });

  it('should render Claude SVG content', () => {
    const scene = createMockScene({
      visual: {
        source: { type: 'claude-svg', prompt: 'chart', svgContent: '<svg viewBox="0 0 100 100"><circle r="50"/></svg>' },
        status: 'ready',
        versions: [],
      },
    });
    const html = renderScenePreview(scene);
    expect(html).toContain('<circle');
  });

  it('should show placeholder for pending Claude SVG', () => {
    const scene = createMockScene({
      visual: {
        source: { type: 'claude-svg', prompt: '차트를 그려줘' },
        status: 'draft',
        versions: [],
      },
    });
    const html = renderScenePreview(scene);
    expect(html).toContain('SVG 생성 대기');
    expect(html).toContain('차트를 그려줘');
  });

  it('should render text-reveal scene', () => {
    const scene = createMockScene({
      visual: {
        source: { type: 'remotion-template', templateId: 'text-reveal', props: {} },
        status: 'ready',
        versions: [],
      },
    });
    const html = renderScenePreview(scene);
    expect(html).toContain('class="text-reveal"');
    expect(html).toContain('테스트 나레이션입니다.');
  });

  it('should render list-reveal with items', () => {
    const scene = createMockScene({
      visual: {
        source: { type: 'remotion-template', templateId: 'list-reveal', props: { title: '핵심 포인트', items: ['첫째', '둘째', '셋째'] } },
        status: 'ready',
        versions: [],
      },
    });
    const html = renderScenePreview(scene);
    expect(html).toContain('핵심 포인트');
    expect(html).toContain('첫째');
    expect(html).toContain('둘째');
    expect(html).toContain('셋째');
  });

  it('should show placeholder for AI image not yet generated', () => {
    const scene = createMockScene({
      visual: {
        source: { type: 'ai-image', provider: 'dalle', prompt: '미래 도시', animation: 'ken-burns' },
        status: 'draft',
        versions: [],
      },
    });
    const html = renderScenePreview(scene);
    expect(html).toContain('AI 이미지 생성 대기');
  });

  it('should escape HTML in narration text', () => {
    const scene = createMockScene({
      narration: { ...createMockScene().narration, text: '<script>alert("xss")</script>' },
    });
    const html = renderScenePreview(scene);
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should use dark theme colors by default', () => {
    const scene = createMockScene();
    const html = renderScenePreview(scene);
    expect(html).toContain('#030712'); // Slate 950
    expect(html).toContain('#2563EB'); // Blue 600
  });
});
