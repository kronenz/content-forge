/**
 * Upload feature tests
 */
import { describe, it, expect } from 'vitest';
import { renderScenePreview } from '../utils/preview-renderer.js';
import type { EditableScene } from '@content-forge/core';

function createMockScene(overrides: Partial<EditableScene> = {}): EditableScene {
  return {
    id: 'scene_1',
    order: 0,
    narration: { text: 'Test', voiceId: 'voice_1', status: 'ready', durationMs: 5000 },
    visual: {
      source: { type: 'manual-upload', fileUrl: '' },
      status: 'draft',
      versions: [],
    },
    presenter: {
      enabled: false, avatarProfileId: '', position: 'bottom-right',
      size: 'small', shape: 'circle', background: 'transparent',
      gesture: 'talking', lipSync: true, enterAnimation: 'fade-in', status: 'draft',
    },
    overlay: { subtitles: true, watermark: false },
    timing: { durationMs: 5000, transitionIn: 'fade', transitionDurationMs: 500 },
    ...overrides,
  };
}

describe('Manual Upload Preview', () => {
  it('should show placeholder when fileUrl is empty', () => {
    const scene = createMockScene();
    const html = renderScenePreview(scene);
    expect(html).toContain('파일 업로드 대기');
  });

  it('should render image when fileUrl is provided', () => {
    const scene = createMockScene({
      visual: {
        source: { type: 'manual-upload', fileUrl: 'https://example.com/photo.jpg' },
        status: 'ready',
        versions: [],
      },
    });
    const html = renderScenePreview(scene);
    expect(html).toContain('<img');
    expect(html).toContain('https://example.com/photo.jpg');
    expect(html).toContain('object-fit:contain');
  });

  it('should escape HTML in fileUrl to prevent XSS', () => {
    const scene = createMockScene({
      visual: {
        source: { type: 'manual-upload', fileUrl: '"><script>alert(1)</script>' },
        status: 'ready',
        versions: [],
      },
    });
    const html = renderScenePreview(scene);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should render blob URL for local uploads', () => {
    const scene = createMockScene({
      visual: {
        source: { type: 'manual-upload', fileUrl: 'blob:http://localhost:5173/abc-123' },
        status: 'ready',
        versions: [],
      },
    });
    const html = renderScenePreview(scene);
    expect(html).toContain('blob:http://localhost:5173/abc-123');
  });
});
