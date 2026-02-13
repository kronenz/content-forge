<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Film, Plus, FolderOpen } from 'lucide-vue-next';
import { useProjectStore } from '@/stores/project-store';
import ProjectCard from '@/components/ProjectCard.vue';
import CreateProjectDialog from '@/components/CreateProjectDialog.vue';
import type { AspectRatio } from '@/types/video';

const router = useRouter();
const projectStore = useProjectStore();
const showCreateDialog = ref(false);

onMounted(() => {
  projectStore.fetchProjects();
});

function openProject(id: string) {
  router.push(`/projects/${id}`);
}

async function handleCreate(title: string, aspectRatio: AspectRatio) {
  const project = await projectStore.createProject(title, aspectRatio);
  showCreateDialog.value = false;
  router.push(`/projects/${project.id}`);
}

async function handleDelete(id: string) {
  await projectStore.deleteProject(id);
}
</script>

<template>
  <div class="h-full">
    <!-- Top Bar -->
    <div class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/50 bg-slate-950/80 px-6 backdrop-blur-xl">
      <div class="flex items-center gap-4">
        <h1 class="text-sm font-semibold text-white">Video Projects</h1>
      </div>
      <button
        @click="showCreateDialog = true"
        class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/30"
      >
        <Plus :size="16" />
        New Project
      </button>
    </div>

    <!-- Content -->
    <div class="p-6">
      <!-- Loading -->
      <div v-if="projectStore.loading" class="flex items-center justify-center py-20">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
      </div>

      <!-- Error -->
      <div v-else-if="projectStore.error" class="flex flex-col items-center gap-3 py-20 text-rose-400">
        <span class="text-sm">{{ projectStore.error }}</span>
        <button
          @click="projectStore.fetchProjects()"
          class="text-xs text-blue-400 hover:text-blue-300"
        >
          Retry
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="projectStore.projects.length === 0" class="flex flex-col items-center gap-4 py-20">
        <div class="rounded-xl bg-slate-900/50 p-6 ring-1 ring-slate-800/50">
          <FolderOpen :size="48" class="text-slate-700" />
        </div>
        <div class="text-center space-y-1">
          <h3 class="text-sm font-semibold text-slate-300">No projects yet</h3>
          <p class="text-xs text-slate-500">Create your first video project to get started.</p>
        </div>
        <button
          @click="showCreateDialog = true"
          class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500"
        >
          <Plus :size="16" />
          New Project
        </button>
      </div>

      <!-- Project Grid -->
      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ProjectCard
          v-for="project in projectStore.projects"
          :key="project.id"
          :project="project"
          @open="openProject"
          @delete="handleDelete"
        />
      </div>
    </div>

    <!-- Create Dialog -->
    <CreateProjectDialog
      :open="showCreateDialog"
      @close="showCreateDialog = false"
      @create="handleCreate"
    />
  </div>
</template>
