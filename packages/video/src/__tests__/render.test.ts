/**
 * Tests for render.ts — Remotion server-side rendering
 * Mocks @remotion/bundler and @remotion/renderer to avoid actual rendering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VideoProject } from '@content-forge/core';

// Mock @remotion/bundler
vi.mock('@remotion/bundler', () => ({
  bundle: vi.fn(),
}));

// Mock @remotion/renderer
vi.mock('@remotion/renderer', () => ({
  renderMedia: vi.fn(),
  selectComposition: vi.fn(),
}));

// Mock fs/promises for file size
vi.mock('node:fs/promises', () => ({
  stat: vi.fn().mockResolvedValue({ size: 1024000 }),
}));

const mockProject: VideoProject = {
  id: 'proj-1',
  title: 'Test Video',
  materialId: 'mat-1',
  aspectRatio: '16:9',
  scenes: [
    {
      id: 'scene-1',
      order: 0,
      narration: {
        text: 'Hello world',
        voiceId: 'voice-1',
        durationMs: 3000,
        status: 'ready',
      },
      visual: {
        source: { type: 'remotion-template', templateId: 'title-card', props: { title: 'Test' } },
        status: 'ready',
        versions: [],
      },
      presenter: {
        enabled: false,
        avatarProfileId: '',
        position: 'bottom-right',
        size: 'medium',
        shape: 'circle',
        background: 'transparent',
        gesture: 'talking',
        lipSync: false,
        enterAnimation: 'fade-in',
        status: 'draft',
      },
      overlay: { subtitles: false, watermark: false },
      timing: { durationMs: 5000, transitionIn: 'cut', transitionDurationMs: 0 },
    },
    {
      id: 'scene-2',
      order: 1,
      narration: {
        text: 'Second scene',
        voiceId: 'voice-1',
        durationMs: 4000,
        status: 'ready',
      },
      visual: {
        source: { type: 'claude-svg', prompt: 'diagram', svgContent: '<svg></svg>' },
        status: 'ready',
        versions: [],
      },
      presenter: {
        enabled: true,
        avatarProfileId: 'avatar-1',
        position: 'bottom-right',
        size: 'small',
        shape: 'circle',
        background: 'transparent',
        gesture: 'explaining',
        lipSync: true,
        enterAnimation: 'slide-in',
        videoUrl: 'https://example.com/avatar.mp4',
        status: 'ready',
      },
      overlay: { subtitles: true, subtitleStyle: 'bold', watermark: true },
      timing: { durationMs: 7000, transitionIn: 'fade', transitionDurationMs: 500 },
    },
  ],
  globalStyle: {
    colorScheme: 'brand-dark',
    fontFamily: 'Inter',
  },
  status: 'rendering',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('renderVideo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render a 16:9 video successfully', async () => {
    const { bundle } = await import('@remotion/bundler');
    const { renderMedia, selectComposition } = await import('@remotion/renderer');

    vi.mocked(bundle).mockResolvedValue('/tmp/bundle');
    vi.mocked(selectComposition).mockResolvedValue({
      id: 'LongformVideo',
      width: 1920,
      height: 1080,
      fps: 30,
      durationInFrames: 360,
      defaultProps: {},
      props: {},
      defaultCodec: 'h264',
    } as any);
    vi.mocked(renderMedia).mockResolvedValue({} as any);

    const { renderVideo } = await import('../render.js');
    const result = await renderVideo(mockProject, '/tmp/output.mp4');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outputPath).toBe('/tmp/output.mp4');
      expect(result.value.durationMs).toBe(12000); // 5000 + 7000
      expect(result.value.fileSize).toBe(1024000);
    }

    expect(bundle).toHaveBeenCalled();
    expect(selectComposition).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'LongformVideo' })
    );
    expect(renderMedia).toHaveBeenCalled();
  });

  it('should use ShortformVideo for 9:16 aspect ratio', async () => {
    const { bundle } = await import('@remotion/bundler');
    const { renderMedia, selectComposition } = await import('@remotion/renderer');

    vi.mocked(bundle).mockResolvedValue('/tmp/bundle');
    vi.mocked(selectComposition).mockResolvedValue({
      id: 'ShortformVideo',
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 360,
      defaultProps: {},
      props: {},
      defaultCodec: 'h264',
    } as any);
    vi.mocked(renderMedia).mockResolvedValue({} as any);

    const shortformProject = { ...mockProject, aspectRatio: '9:16' as const };

    const { renderVideo } = await import('../render.js');
    const result = await renderVideo(shortformProject, '/tmp/short.mp4');

    expect(result.ok).toBe(true);
    expect(selectComposition).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ShortformVideo' })
    );
  });

  it('should return error when bundle fails', async () => {
    const { bundle } = await import('@remotion/bundler');

    vi.mocked(bundle).mockRejectedValue(new Error('Bundle failed'));

    const { renderVideo } = await import('../render.js');
    const result = await renderVideo(mockProject, '/tmp/output.mp4');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.phase).toBe('bundle');
      expect(result.error.message).toContain('Bundle failed');
    }
  });

  it('should return error when selectComposition fails', async () => {
    const { bundle } = await import('@remotion/bundler');
    const { selectComposition } = await import('@remotion/renderer');

    vi.mocked(bundle).mockResolvedValue('/tmp/bundle');
    vi.mocked(selectComposition).mockRejectedValue(new Error('Composition not found'));

    const { renderVideo } = await import('../render.js');
    const result = await renderVideo(mockProject, '/tmp/output.mp4');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.phase).toBe('bundle');
      expect(result.error.message).toContain('Composition not found');
    }
  });

  it('should return error when renderMedia fails', async () => {
    const { bundle } = await import('@remotion/bundler');
    const { renderMedia, selectComposition } = await import('@remotion/renderer');

    vi.mocked(bundle).mockResolvedValue('/tmp/bundle');
    vi.mocked(selectComposition).mockResolvedValue({
      id: 'LongformVideo',
      width: 1920,
      height: 1080,
      fps: 30,
      durationInFrames: 360,
      defaultProps: {},
      props: {},
      defaultCodec: 'h264',
    } as any);
    vi.mocked(renderMedia).mockRejectedValue(new Error('ffmpeg not found'));

    const { renderVideo } = await import('../render.js');
    const result = await renderVideo(mockProject, '/tmp/output.mp4');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.phase).toBe('render');
      expect(result.error.message).toContain('ffmpeg not found');
    }
  });

  it('should pass custom render options', async () => {
    const { bundle } = await import('@remotion/bundler');
    const { renderMedia, selectComposition } = await import('@remotion/renderer');

    vi.mocked(bundle).mockResolvedValue('/tmp/bundle');
    vi.mocked(selectComposition).mockResolvedValue({
      id: 'LongformVideo',
      width: 1920,
      height: 1080,
      fps: 30,
      durationInFrames: 360,
      defaultProps: {},
      props: {},
      defaultCodec: 'h264',
    } as any);
    vi.mocked(renderMedia).mockResolvedValue({} as any);

    const { renderVideo } = await import('../render.js');
    await renderVideo(mockProject, '/tmp/output.mp4', {
      codec: 'h265',
      crf: 18,
      concurrency: 4,
    });

    expect(renderMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        codec: 'h265',
        crf: 18,
        concurrency: 4,
      })
    );
  });
});
