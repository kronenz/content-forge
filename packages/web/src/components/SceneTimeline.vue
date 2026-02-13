<script setup lang="ts">
import { ref } from 'vue';
import {
  GripVertical,
  Plus,
  Palette,
  Video,
  Image,
  Layout,
  Search,
  Monitor,
  Upload,
  Trash2,
} from 'lucide-vue-next';
import type { EditableScene, VisualSourceType } from '@/types/video';

const props = defineProps<{
  scenes: EditableScene[];
  selectedSceneId: string | null;
}>();

const emit = defineEmits<{
  select: [id: string];
  add: [];
  remove: [id: string];
  reorder: [fromIndex: number, toIndex: number];
}>();

const dragIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

const sourceIcons: Record<VisualSourceType, typeof Palette> = {
  'claude-svg': Palette,
  'ai-video': Video,
  'ai-image': Image,
  'remotion-template': Layout,
  'stock': Search,
  'screen-recording': Monitor,
  'manual-upload': Upload,
};

function getSourceIcon(type: VisualSourceType) {
  return sourceIcons[type] || Palette;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function handleDragStart(index: number) {
  dragIndex.value = index;
}

function handleDragOver(e: DragEvent, index: number) {
  e.preventDefault();
  dragOverIndex.value = index;
}

function handleDrop(index: number) {
  if (dragIndex.value !== null && dragIndex.value !== index) {
    emit('reorder', dragIndex.value, index);
  }
  dragIndex.value = null;
  dragOverIndex.value = null;
}

function handleDragEnd() {
  dragIndex.value = null;
  dragOverIndex.value = null;
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-slate-800/50 px-4 py-3">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Scenes
      </h3>
      <span class="text-xs tabular-nums text-slate-600">{{ scenes.length }}</span>
    </div>

    <!-- Scene List -->
    <div class="flex-1 overflow-y-auto p-2 space-y-1">
      <div
        v-for="(scene, index) in scenes"
        :key="scene.id"
        :draggable="true"
        @dragstart="handleDragStart(index)"
        @dragover="(e) => handleDragOver(e, index)"
        @drop="handleDrop(index)"
        @dragend="handleDragEnd"
        @click="emit('select', scene.id)"
        :class="[
          'group relative flex items-start gap-2 rounded-lg p-2.5 cursor-pointer transition-all',
          scene.id === selectedSceneId
            ? 'bg-blue-600/10 ring-1 ring-blue-500/30'
            : 'hover:bg-slate-800/50',
          dragOverIndex === index && dragIndex !== index ? 'ring-1 ring-cyan-500/40' : '',
          dragIndex === index ? 'opacity-50' : '',
        ]"
      >
        <!-- Drag Handle -->
        <div class="mt-0.5 cursor-grab text-slate-600 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
          <GripVertical :size="14" />
        </div>

        <!-- Scene Info -->
        <div class="flex-1 min-w-0 space-y-1.5">
          <div class="flex items-center gap-2">
            <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-800/50 text-[10px] font-semibold tabular-nums text-slate-400">
              {{ index + 1 }}
            </span>
            <component
              :is="getSourceIcon(scene.visual.source.type as VisualSourceType)"
              :size="12"
              class="shrink-0 text-slate-500"
            />
            <span class="text-[10px] font-medium text-slate-500 uppercase">
              {{ scene.visual.source.type }}
            </span>
          </div>
          <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {{ scene.narration.text || 'Empty narration' }}
          </p>
          <div class="flex items-center gap-2 text-[10px] text-slate-600">
            <span class="tabular-nums">{{ formatDuration(scene.timing.durationMs) }}</span>
            <span v-if="scene.presenter.enabled" class="rounded bg-violet-500/10 px-1.5 py-0.5 text-violet-400">
              Avatar
            </span>
          </div>
        </div>

        <!-- Delete -->
        <button
          @click.stop="emit('remove', scene.id)"
          class="mt-0.5 rounded p-1 text-slate-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-400"
        >
          <Trash2 :size="12" />
        </button>
      </div>
    </div>

    <!-- Add Scene Button -->
    <div class="border-t border-slate-800/50 p-2">
      <button
        @click="emit('add')"
        class="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700/50 py-2.5 text-xs text-slate-500 transition-colors hover:border-blue-500/30 hover:bg-blue-600/5 hover:text-blue-400"
      >
        <Plus :size="14" />
        Add Scene
      </button>
    </div>
  </div>
</template>
