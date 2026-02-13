<script setup lang="ts">
import { ref } from 'vue';
import { X, Monitor, Smartphone } from 'lucide-vue-next';
import type { AspectRatio } from '@/types/video';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  create: [title: string, aspectRatio: AspectRatio];
}>();

const title = ref('');
const aspectRatio = ref<AspectRatio>('16:9');

function handleCreate() {
  if (!title.value.trim()) return;
  emit('create', title.value.trim(), aspectRatio.value);
  title.value = '';
  aspectRatio.value = '16:9';
}

function handleClose() {
  title.value = '';
  aspectRatio.value = '16:9';
  emit('close');
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm"
        @click="handleClose"
      ></div>

      <!-- Dialog -->
      <div class="relative w-full max-w-md rounded-xl bg-slate-900 ring-1 ring-slate-800/50 shadow-2xl">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-800/50 px-6 py-4">
          <h2 class="text-sm font-semibold text-white">New Project</h2>
          <button
            @click="handleClose"
            class="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-800/50 hover:text-slate-300"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Body -->
        <div class="space-y-5 px-6 py-5">
          <!-- Title -->
          <div class="space-y-2">
            <label class="text-xs font-medium text-slate-400">Project Title</label>
            <input
              v-model="title"
              type="text"
              placeholder="Enter project title..."
              class="w-full rounded-lg bg-slate-800/50 px-3 py-2.5 text-sm text-white ring-1 ring-slate-700/50 placeholder:text-slate-600 focus:outline-none focus:ring-blue-500/50 transition-colors"
              @keydown.enter="handleCreate"
            />
          </div>

          <!-- Aspect Ratio -->
          <div class="space-y-2">
            <label class="text-xs font-medium text-slate-400">Aspect Ratio</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                @click="aspectRatio = '16:9'"
                :class="[
                  'flex items-center gap-3 rounded-lg px-4 py-3 ring-1 transition-all',
                  aspectRatio === '16:9'
                    ? 'bg-blue-600/10 text-blue-400 ring-blue-500/30'
                    : 'bg-slate-800/30 text-slate-400 ring-slate-700/50 hover:bg-slate-800/50',
                ]"
              >
                <Monitor :size="18" />
                <div class="text-left">
                  <div class="text-xs font-medium">16:9</div>
                  <div class="text-[10px] text-slate-500">Landscape</div>
                </div>
              </button>
              <button
                @click="aspectRatio = '9:16'"
                :class="[
                  'flex items-center gap-3 rounded-lg px-4 py-3 ring-1 transition-all',
                  aspectRatio === '9:16'
                    ? 'bg-blue-600/10 text-blue-400 ring-blue-500/30'
                    : 'bg-slate-800/30 text-slate-400 ring-slate-700/50 hover:bg-slate-800/50',
                ]"
              >
                <Smartphone :size="18" />
                <div class="text-left">
                  <div class="text-xs font-medium">9:16</div>
                  <div class="text-[10px] text-slate-500">Portrait</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 border-t border-slate-800/50 px-6 py-4">
          <button
            @click="handleClose"
            class="rounded-lg px-4 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-300"
          >
            Cancel
          </button>
          <button
            @click="handleCreate"
            :disabled="!title.trim()"
            :class="[
              'rounded-lg px-4 py-2 text-sm font-medium transition-all',
              title.trim()
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed',
            ]"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
