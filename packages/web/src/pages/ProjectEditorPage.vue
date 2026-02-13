<script setup lang="ts">
import { onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  Play,
  Loader2,
  Clock,
  Layers,
  CheckCircle2,
  Users,
} from 'lucide-vue-next';
import { useProjectStore } from '@/stores/project-store';
import { useEditorStore } from '@/stores/editor-store';
import { useCollaborationStore } from '@/stores/collaboration-store';
import SceneTimeline from '@/components/SceneTimeline.vue';
import ScenePreview from '@/components/ScenePreview.vue';
import SceneInspector from '@/components/SceneInspector.vue';
import CollaborationPanel from '@/components/CollaborationPanel.vue';
import ApprovalWorkflow from '@/components/ApprovalWorkflow.vue';
import type { EditableScene, ProjectStatus } from '@/types/video';
import type { ApprovalStatus } from '@/stores/collaboration-store';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const editorStore = useEditorStore();
const collabStore = useCollaborationStore();

const projectId = computed(() => route.params.id as string);

onMounted(async () => {
  await projectStore.fetchProject(projectId.value);
  if (projectStore.currentProject && projectStore.currentProject.scenes.length > 0) {
    editorStore.selectScene(projectStore.sortedScenes[0].id);
  }
});

watch(projectId, async (newId) => {
  await projectStore.fetchProject(newId);
  if (projectStore.currentProject && projectStore.currentProject.scenes.length > 0) {
    editorStore.selectScene(projectStore.sortedScenes[0].id);
  }
});

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

const statusConfig: Record<ProjectStatus, { bg: string; text: string; ring: string; label: string }> = {
  scripting: { bg: 'bg-amber-500/10', text: 'text-amber-400', ring: 'ring-amber-500/20', label: 'Scripting' },
  editing: { bg: 'bg-blue-500/10', text: 'text-blue-400', ring: 'ring-blue-500/20', label: 'Editing' },
  rendering: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', ring: 'ring-cyan-500/20', label: 'Rendering' },
  complete: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20', label: 'Complete' },
};

function handleUpdateScene(sceneId: string, patch: Partial<EditableScene>) {
  editorStore.updateScene(sceneId, patch);
}

function handleRestoreVersion(sceneId: string, versionId: string) {
  editorStore.restoreVersion(sceneId, versionId);
}

function handleReorder(fromIndex: number, toIndex: number) {
  editorStore.reorderScenes(fromIndex, toIndex);
}

function handleApprovalUpdate(status: ApprovalStatus) {
  collabStore.updateApprovalStatus(status);
}
</script>

<template>
  <div v-if="projectStore.loading" class="flex h-full items-center justify-center">
    <div class="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
  </div>

  <div v-else-if="projectStore.error" class="flex h-full flex-col items-center justify-center gap-3 text-rose-400">
    <span class="text-sm">{{ projectStore.error }}</span>
    <button
      @click="router.push('/')"
      class="text-xs text-blue-400 hover:text-blue-300"
    >
      Back to Projects
    </button>
  </div>

  <div v-else-if="projectStore.currentProject" class="flex h-full flex-col">
    <!-- Top Bar -->
    <div class="flex h-12 items-center justify-between border-b border-slate-800/50 bg-slate-900/30 px-4">
      <div class="flex items-center gap-3">
        <button
          @click="router.push('/')"
          class="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800/50 hover:text-slate-300"
        >
          <ArrowLeft :size="16" />
        </button>
        <h2 class="text-sm font-semibold text-white truncate max-w-[120px] sm:max-w-none">
          {{ projectStore.currentProject.title }}
        </h2>
        <div
          :class="[
            'hidden sm:inline-flex items-center gap-1 rounded-md px-2 py-0.5 ring-1 text-xs',
            statusConfig[projectStore.currentProject.status]?.bg,
            statusConfig[projectStore.currentProject.status]?.text,
            statusConfig[projectStore.currentProject.status]?.ring,
          ]"
        >
          <span class="h-1 w-1 rounded-full bg-current"></span>
          {{ statusConfig[projectStore.currentProject.status]?.label }}
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Collaboration toggle -->
        <button
          @click="collabStore.togglePanel()"
          :class="[
            'rounded-lg p-2 transition-colors',
            collabStore.panelOpen
              ? 'bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/20'
              : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300',
          ]"
          title="Collaboration"
        >
          <Users :size="16" />
        </button>
      </div>
    </div>

    <!-- Approval Workflow Bar -->
    <div class="border-b border-slate-800/50 bg-slate-900/20 px-4 py-2">
      <ApprovalWorkflow
        :status="collabStore.approvalStatus"
        @update:status="handleApprovalUpdate"
      />
    </div>

    <!-- Editor Layout -->
    <div class="flex flex-1 flex-col overflow-hidden lg:flex-row">
      <!-- Left Sidebar: Scene Timeline -->
      <div class="w-full shrink-0 border-b border-slate-800/50 bg-slate-900/30 lg:w-60 lg:border-b-0 lg:border-r">
        <SceneTimeline
          :scenes="projectStore.sortedScenes"
          :selectedSceneId="editorStore.selectedSceneId"
          @select="editorStore.selectScene"
          @add="editorStore.addScene()"
          @remove="editorStore.removeScene"
          @reorder="handleReorder"
        />
      </div>

      <!-- Center: Preview -->
      <div class="flex-1 bg-slate-950">
        <ScenePreview
          :scene="editorStore.selectedScene"
          :aspectRatio="projectStore.currentProject.aspectRatio"
          :previewMode="editorStore.previewMode"
          @update:previewMode="editorStore.previewMode = $event"
        />
      </div>

      <!-- Right Sidebar: Inspector -->
      <div class="w-full shrink-0 border-t border-slate-800/50 bg-slate-900/30 lg:w-80 lg:border-t-0 lg:border-l">
        <SceneInspector
          v-if="editorStore.selectedScene"
          :scene="editorStore.selectedScene"
          @update="handleUpdateScene"
          @restoreVersion="handleRestoreVersion"
        />
        <div v-else class="flex h-full items-center justify-center text-sm text-slate-600">
          Select a scene to inspect
        </div>
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="flex h-12 items-center justify-between border-t border-slate-800/50 bg-slate-900/50 px-4">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <Clock :size="12" />
          <span class="tabular-nums">{{ formatDuration(projectStore.totalDurationMs) }}</span>
        </div>
        <div class="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <Layers :size="12" />
          <span>{{ editorStore.sceneCount }} scenes</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- Render Progress -->
        <div v-if="editorStore.isRendering" class="flex items-center gap-3">
          <div class="h-1.5 w-24 sm:w-40 overflow-hidden rounded-full bg-slate-800/50">
            <div
              class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
              :style="{ width: `${Math.min(editorStore.renderProgress, 100)}%` }"
            ></div>
          </div>
          <span class="text-xs tabular-nums text-slate-500">
            {{ Math.floor(editorStore.renderProgress) }}%
          </span>
        </div>

        <!-- Complete Badge -->
        <div
          v-if="projectStore.currentProject.status === 'complete'"
          class="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400"
        >
          <CheckCircle2 :size="14" />
          Rendered
        </div>

        <!-- Render Button -->
        <button
          @click="editorStore.startRender()"
          :disabled="editorStore.isRendering || editorStore.sceneCount === 0"
          :class="[
            'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all sm:px-4',
            editorStore.isRendering || editorStore.sceneCount === 0
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500',
          ]"
        >
          <Loader2 v-if="editorStore.isRendering" :size="14" class="animate-spin" />
          <Play v-else :size="14" />
          <span class="hidden sm:inline">{{ editorStore.isRendering ? 'Rendering...' : 'Render Video' }}</span>
        </button>
      </div>
    </div>

    <!-- Collaboration Panel -->
    <CollaborationPanel
      :open="collabStore.panelOpen"
      @close="collabStore.panelOpen = false"
    />
  </div>
</template>
