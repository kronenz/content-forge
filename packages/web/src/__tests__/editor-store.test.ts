/**
 * Editor Store — Version History Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useEditorStore } from '../stores/editor-store';
import { useProjectStore } from '../stores/project-store';
import type { EditableScene, VideoProject } from '../types/video';

function createMockScene(id: string, sourceType: string = 'claude-svg'): EditableScene {
  return {
    id,
    order: 0,
    narration: { text: 'Test', voiceId: 'alloy', status: 'draft' },
    visual: {
      source: sourceType === 'claude-svg'
        ? { type: 'claude-svg', prompt: 'test prompt' }
        : { type: 'stock', query: 'nature' },
      status: 'draft',
      versions: [],
    },
    presenter: {
      enabled: false,
      avatarProfileId: '',
      position: 'bottom-right',
      size: 'small',
      shape: 'circle',
      background: 'transparent',
      gesture: 'talking',
      lipSync: true,
      enterAnimation: 'fade-in',
      status: 'draft',
    },
    overlay: { subtitles: true, watermark: false },
    timing: { durationMs: 5000, transitionIn: 'fade', transitionDurationMs: 500 },
  };
}

function createMockProject(scenes: EditableScene[]): VideoProject {
  return {
    id: 'proj-1',
    title: 'Test Project',
    materialId: 'mat-1',
    aspectRatio: '16:9',
    scenes,
    globalStyle: { colorScheme: 'brand-dark', fontFamily: 'Inter' },
    status: 'editing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('Editor Store - Version History', () => {
  let editorStore: ReturnType<typeof useEditorStore>;
  let projectStore: ReturnType<typeof useProjectStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    editorStore = useEditorStore();
    projectStore = useProjectStore();
  });

  it('should save visual version when source type changes', () => {
    const scene = createMockScene('s1', 'claude-svg');
    projectStore.currentProject = createMockProject([scene]);

    // Change from claude-svg to stock
    editorStore.updateScene('s1', {
      visual: {
        ...scene.visual,
        source: { type: 'stock', query: 'landscape' },
      },
    });

    const updated = projectStore.currentProject!.scenes[0]!;
    expect(updated.visual.versions.length).toBe(1);
    expect(updated.visual.versions[0]!.source.type).toBe('claude-svg');
    expect(updated.visual.source.type).toBe('stock');
  });

  it('should not save version when non-visual properties change', () => {
    const scene = createMockScene('s1');
    projectStore.currentProject = createMockProject([scene]);

    // Change narration only
    editorStore.updateScene('s1', {
      narration: { ...scene.narration, text: 'Updated' },
    });

    const updated = projectStore.currentProject!.scenes[0]!;
    expect(updated.visual.versions.length).toBe(0);
  });

  it('should not save version when only visual status changes', () => {
    const scene = createMockScene('s1');
    projectStore.currentProject = createMockProject([scene]);

    // Change visual status (no source change)
    editorStore.updateScene('s1', {
      visual: { ...scene.visual, status: 'generating' },
    });

    const updated = projectStore.currentProject!.scenes[0]!;
    expect(updated.visual.versions.length).toBe(0);
  });

  it('should restore version and save current state', () => {
    const scene = createMockScene('s1', 'claude-svg');
    scene.visual.versions = [
      {
        id: 'ver-old',
        source: { type: 'stock', query: 'mountains' },
        previewUrl: 'https://example.com/old.jpg',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    projectStore.currentProject = createMockProject([scene]);

    editorStore.restoreVersion('s1', 'ver-old');

    const updated = projectStore.currentProject!.scenes[0]!;
    expect(updated.visual.source.type).toBe('stock');
    // Current claude-svg should be saved as a new version
    expect(updated.visual.versions.length).toBe(2);
    expect(updated.visual.versions[1]!.source.type).toBe('claude-svg');
  });

  it('should handle restoring non-existent version gracefully', () => {
    const scene = createMockScene('s1');
    projectStore.currentProject = createMockProject([scene]);

    editorStore.restoreVersion('s1', 'non-existent');

    const updated = projectStore.currentProject!.scenes[0]!;
    expect(updated.visual.source.type).toBe('claude-svg');
    expect(updated.visual.versions.length).toBe(0);
  });

  it('should accumulate multiple versions', () => {
    const scene = createMockScene('s1', 'claude-svg');
    projectStore.currentProject = createMockProject([scene]);

    // First change
    editorStore.updateScene('s1', {
      visual: {
        ...projectStore.currentProject!.scenes[0]!.visual,
        source: { type: 'stock', query: 'nature' },
      },
    });

    // Second change
    const current = projectStore.currentProject!.scenes[0]!;
    editorStore.updateScene('s1', {
      visual: {
        ...current.visual,
        source: { type: 'ai-image', provider: 'dalle', prompt: 'test', animation: 'ken-burns' },
      },
    });

    const updated = projectStore.currentProject!.scenes[0]!;
    expect(updated.visual.versions.length).toBe(2);
    expect(updated.visual.versions[0]!.source.type).toBe('claude-svg');
    expect(updated.visual.versions[1]!.source.type).toBe('stock');
    expect(updated.visual.source.type).toBe('ai-image');
  });
});
