import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { VideoProject, AspectRatio, EditableScene } from '@/types/video';
import { mockProjects } from '@/data/mock-projects';

export const useProjectStore = defineStore('project', () => {
  // State
  const projects = ref<VideoProject[]>([]);
  const currentProject = ref<VideoProject | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const sortedScenes = computed<EditableScene[]>(() => {
    if (!currentProject.value) return [];
    return [...currentProject.value.scenes].sort((a, b) => a.order - b.order);
  });

  const totalDurationMs = computed(() => {
    if (!currentProject.value) return 0;
    return currentProject.value.scenes.reduce(
      (sum, scene) => sum + scene.timing.durationMs,
      0,
    );
  });

  // Actions
  async function fetchProjects(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      // Mock: simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      projects.value = [...mockProjects];
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch projects';
    } finally {
      loading.value = false;
    }
  }

  async function fetchProject(id: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const found = mockProjects.find((p) => p.id === id);
      if (!found) {
        throw new Error(`Project not found: ${id}`);
      }
      currentProject.value = structuredClone(found);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch project';
    } finally {
      loading.value = false;
    }
  }

  function createProject(title: string, aspectRatio: AspectRatio): Promise<VideoProject> {
    const now = new Date().toISOString();
    const project: VideoProject = {
      id: `proj-${Date.now()}`,
      title,
      materialId: '',
      aspectRatio,
      scenes: [],
      globalStyle: {
        colorScheme: 'brand-dark',
        fontFamily: 'Inter',
      },
      status: 'scripting',
      createdAt: now,
      updatedAt: now,
    };
    projects.value.push(project);
    return Promise.resolve(project);
  }

  function updateProject(patch: Partial<VideoProject>): Promise<void> {
    if (!currentProject.value) return Promise.resolve();
    Object.assign(currentProject.value, patch, {
      updatedAt: new Date().toISOString(),
    });
    const idx = projects.value.findIndex((p) => p.id === currentProject.value?.id);
    if (idx !== -1 && currentProject.value) {
      projects.value[idx] = structuredClone(currentProject.value);
    }
    return Promise.resolve();
  }

  function deleteProject(id: string): Promise<void> {
    projects.value = projects.value.filter((p) => p.id !== id);
    if (currentProject.value?.id === id) {
      currentProject.value = null;
    }
    return Promise.resolve();
  }

  return {
    projects,
    currentProject,
    loading,
    error,
    sortedScenes,
    totalDurationMs,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
  };
});
