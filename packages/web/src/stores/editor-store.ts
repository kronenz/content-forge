import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useProjectStore } from './project-store';
import type { EditableScene, VisualVersion } from '@/types/video';

export type PreviewMode = 'scene' | 'full';

export const useEditorStore = defineStore('editor', () => {
  const projectStore = useProjectStore();

  // State
  const selectedSceneId = ref<string | null>(null);
  const previewMode = ref<PreviewMode>('scene');
  const isRendering = ref(false);
  const renderProgress = ref(0);

  // Getters
  const selectedScene = computed<EditableScene | null>(() => {
    if (!selectedSceneId.value || !projectStore.currentProject) return null;
    return projectStore.currentProject.scenes.find(
      (s) => s.id === selectedSceneId.value,
    ) ?? null;
  });

  const sceneCount = computed(() => {
    return projectStore.currentProject?.scenes.length ?? 0;
  });

  // Actions
  function selectScene(id: string | null): void {
    selectedSceneId.value = id;
    previewMode.value = 'scene';
  }

  function updateScene(sceneId: string, patch: Partial<EditableScene>): void {
    const project = projectStore.currentProject;
    if (!project) return;

    const idx = project.scenes.findIndex((s) => s.id === sceneId);
    if (idx === -1) return;

    const currentScene = project.scenes[idx];

    // Auto-version: if visual source is changing, save current visual to versions
    if (patch.visual?.source && JSON.stringify(patch.visual.source) !== JSON.stringify(currentScene.visual.source)) {
      const currentVersion: VisualVersion = {
        id: `ver-${Date.now()}`,
        source: { ...currentScene.visual.source },
        previewUrl: currentScene.visual.previewUrl ?? '',
        createdAt: new Date().toISOString(),
      };

      const existingVersions = patch.visual?.versions ?? currentScene.visual.versions;
      patch = {
        ...patch,
        visual: {
          ...currentScene.visual,
          ...patch.visual,
          versions: [...existingVersions, currentVersion],
        },
      };
    }

    project.scenes[idx] = { ...currentScene, ...patch };
    project.updatedAt = new Date().toISOString();
  }

  function addScene(afterId?: string): void {
    const project = projectStore.currentProject;
    if (!project) return;

    const newOrder = afterId
      ? (project.scenes.find((s) => s.id === afterId)?.order ?? project.scenes.length - 1) + 1
      : project.scenes.length;

    const newScene: EditableScene = {
      id: `scene-${Date.now()}`,
      order: newOrder,
      narration: {
        text: '',
        voiceId: 'alloy',
        status: 'draft',
      },
      visual: {
        source: { type: 'claude-svg', prompt: '' },
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
      overlay: {
        subtitles: true,
        subtitleStyle: 'minimal',
        watermark: false,
      },
      timing: {
        durationMs: 5000,
        transitionIn: 'fade',
        transitionDurationMs: 500,
      },
    };

    // Shift orders for scenes after the insertion point
    project.scenes.forEach((s) => {
      if (s.order >= newOrder) {
        s.order++;
      }
    });

    project.scenes.push(newScene);
    project.updatedAt = new Date().toISOString();
    selectedSceneId.value = newScene.id;
  }

  function removeScene(id: string): void {
    const project = projectStore.currentProject;
    if (!project) return;

    const removedScene = project.scenes.find((s) => s.id === id);
    if (!removedScene) return;

    project.scenes = project.scenes.filter((s) => s.id !== id);

    // Reorder remaining scenes
    project.scenes
      .sort((a, b) => a.order - b.order)
      .forEach((s, i) => {
        s.order = i;
      });

    project.updatedAt = new Date().toISOString();

    if (selectedSceneId.value === id) {
      selectedSceneId.value = project.scenes[0]?.id ?? null;
    }
  }

  function reorderScenes(fromIndex: number, toIndex: number): void {
    const project = projectStore.currentProject;
    if (!project) return;

    const sorted = [...project.scenes].sort((a, b) => a.order - b.order);
    const [moved] = sorted.splice(fromIndex, 1);
    if (!moved) return;
    sorted.splice(toIndex, 0, moved);

    sorted.forEach((s, i) => {
      s.order = i;
    });

    project.scenes = sorted;
    project.updatedAt = new Date().toISOString();
  }

  function startRender(): Promise<void> {
    isRendering.value = true;
    renderProgress.value = 0;

    // Mock render progress
    return Promise.resolve().then(() => {
      const interval = setInterval(() => {
        renderProgress.value += Math.random() * 15;
        if (renderProgress.value >= 100) {
          renderProgress.value = 100;
          isRendering.value = false;
          clearInterval(interval);
          if (projectStore.currentProject) {
            projectStore.currentProject.status = 'complete';
          }
        }
      }, 800);
    });
  }

  function updateRenderProgress(progress: number): void {
    renderProgress.value = Math.min(100, Math.max(0, progress));
    if (progress >= 100) {
      isRendering.value = false;
    }
  }

  function restoreVersion(sceneId: string, versionId: string): void {
    const project = projectStore.currentProject;
    if (!project) return;

    const idx = project.scenes.findIndex((s) => s.id === sceneId);
    if (idx === -1) return;

    const scene = project.scenes[idx];
    const version = scene.visual.versions.find((v) => v.id === versionId);
    if (!version) return;

    // Save current state as a version before restoring
    const currentVersion: VisualVersion = {
      id: `ver-${Date.now()}`,
      source: { ...scene.visual.source },
      previewUrl: scene.visual.previewUrl ?? '',
      createdAt: new Date().toISOString(),
    };

    project.scenes[idx] = {
      ...scene,
      visual: {
        ...scene.visual,
        source: { ...version.source },
        previewUrl: version.previewUrl || scene.visual.previewUrl,
        versions: [...scene.visual.versions, currentVersion],
      },
    };
    project.updatedAt = new Date().toISOString();
  }

  return {
    selectedSceneId,
    previewMode,
    isRendering,
    renderProgress,
    selectedScene,
    sceneCount,
    selectScene,
    updateScene,
    addScene,
    removeScene,
    reorderScenes,
    startRender,
    updateRenderProgress,
    restoreVersion,
  };
});
