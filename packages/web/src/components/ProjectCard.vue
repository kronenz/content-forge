<script setup lang="ts">
import {
  Film,
  MoreVertical,
  Trash2,
  Clock,
  Layers,
} from 'lucide-vue-next';
import { ref } from 'vue';
import type { VideoProject, ProjectStatus } from '@/types/video';

const props = defineProps<{
  project: VideoProject;
}>();

const emit = defineEmits<{
  open: [id: string];
  delete: [id: string];
}>();

const showMenu = ref(false);

const statusConfig: Record<ProjectStatus, { bg: string; text: string; ring: string; label: string }> = {
  scripting: { bg: 'bg-amber-500/10', text: 'text-amber-400', ring: 'ring-amber-500/20', label: 'Scripting' },
  editing: { bg: 'bg-blue-500/10', text: 'text-blue-400', ring: 'ring-blue-500/20', label: 'Editing' },
  rendering: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', ring: 'ring-cyan-500/20', label: 'Rendering' },
  complete: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20', label: 'Complete' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('ko-KR');
}
</script>

<template>
  <div
    class="group relative overflow-hidden rounded-xl bg-slate-900/50 ring-1 ring-slate-800/50 transition-all hover:bg-slate-800/50 hover:ring-slate-700/50 cursor-pointer"
    @click="emit('open', project.id)"
  >
    <!-- Aspect ratio badge -->
    <div class="flex h-32 items-center justify-center bg-slate-800/30">
      <div class="flex flex-col items-center gap-2 text-slate-600">
        <Film :size="32" />
        <span class="text-xs font-medium">{{ project.aspectRatio }}</span>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4 space-y-3">
      <div class="flex items-start justify-between">
        <h3 class="text-sm font-semibold text-white line-clamp-1 flex-1">
          {{ project.title }}
        </h3>
        <div class="relative">
          <button
            @click.stop="showMenu = !showMenu"
            class="rounded-lg p-1 text-slate-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-700/50 hover:text-slate-300"
          >
            <MoreVertical :size="14" />
          </button>
          <div
            v-if="showMenu"
            class="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-lg bg-slate-800 ring-1 ring-slate-700/50 shadow-xl"
          >
            <button
              @click.stop="emit('delete', project.id); showMenu = false"
              class="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-slate-700/50"
            >
              <Trash2 :size="12" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- Status badge -->
        <div
          :class="[
            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 ring-1 text-xs',
            statusConfig[project.status]?.bg,
            statusConfig[project.status]?.text,
            statusConfig[project.status]?.ring,
          ]"
        >
          <span class="h-1 w-1 rounded-full bg-current"></span>
          {{ statusConfig[project.status]?.label }}
        </div>
      </div>

      <div class="flex items-center justify-between text-xs text-slate-500">
        <div class="flex items-center gap-1">
          <Layers :size="12" />
          <span>{{ project.scenes.length }} scenes</span>
        </div>
        <div class="flex items-center gap-1">
          <Clock :size="12" />
          <span>{{ formatDate(project.updatedAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
