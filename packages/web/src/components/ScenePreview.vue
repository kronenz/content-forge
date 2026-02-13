<script setup lang="ts">
import { computed } from 'vue';
import { Monitor, Smartphone, Play, Eye } from 'lucide-vue-next';
import type { EditableScene, AspectRatio, PreviewMode } from '@/types/video';

const props = defineProps<{
  scene: EditableScene | null;
  aspectRatio: AspectRatio;
  previewMode: PreviewMode;
}>();

const emit = defineEmits<{
  'update:previewMode': [mode: PreviewMode];
}>();

const aspectClass = computed(() => {
  return props.aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]';
});

const previewHtml = computed(() => {
  if (!props.scene) return '';

  const narration = props.scene.narration.text || 'No narration';
  const sourceType = props.scene.visual.source.type;
  let visualContent = '';

  if (props.scene.visual.source.type === 'claude-svg' && props.scene.visual.source.svgContent) {
    visualContent = props.scene.visual.source.svgContent;
  } else {
    visualContent = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;opacity:0.5;">
        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="m21 15-5-5L5 21"/>
        </svg>
        <span style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">${sourceType}</span>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0f172a;
      color: #e2e8f0;
      font-family: Inter, system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    .visual {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .narration {
      padding: 16px 24px;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(8px);
      font-size: 14px;
      line-height: 1.6;
      text-align: center;
      color: #f1f5f9;
    }
    .scene-number {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(37,99,235,0.3);
      color: #93c5fd;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="scene-number">Scene ${props.scene.order + 1}</div>
  <div class="visual">${visualContent}</div>
  <div class="narration">${narration}</div>
</body>
</html>`;
});
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Preview Controls -->
    <div class="flex items-center justify-between border-b border-slate-800/50 px-4 py-2">
      <div class="flex items-center gap-2">
        <button
          @click="emit('update:previewMode', 'scene')"
          :class="[
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors',
            previewMode === 'scene'
              ? 'bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/20'
              : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300',
          ]"
        >
          <Eye :size="12" />
          Scene
        </button>
        <button
          @click="emit('update:previewMode', 'full')"
          :class="[
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors',
            previewMode === 'full'
              ? 'bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/20'
              : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300',
          ]"
        >
          <Play :size="12" />
          Full
        </button>
      </div>
      <div class="flex items-center gap-1.5 text-xs text-slate-600">
        <component :is="aspectRatio === '16:9' ? Monitor : Smartphone" :size="12" />
        {{ aspectRatio }}
      </div>
    </div>

    <!-- Preview Area -->
    <div class="flex-1 flex items-center justify-center p-6 bg-slate-950/50">
      <div v-if="scene" :class="['relative w-full max-w-2xl overflow-hidden rounded-lg ring-1 ring-slate-800/50 bg-slate-900', aspectClass]">
        <iframe
          :srcdoc="previewHtml"
          class="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts"
        ></iframe>
      </div>
      <div v-else class="flex flex-col items-center gap-3 text-slate-600">
        <Monitor :size="48" class="opacity-50" />
        <span class="text-sm">Select a scene to preview</span>
      </div>
    </div>
  </div>
</template>
