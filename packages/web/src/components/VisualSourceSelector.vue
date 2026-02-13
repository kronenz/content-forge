<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  Palette,
  Video,
  Image,
  Layout,
  Search,
  Monitor,
  Upload,
  Sparkles,
  X,
} from 'lucide-vue-next';
import type {
  VisualSource,
  VisualSourceType,
  VideoProvider,
  ImageProvider,
  ImageAnimation,
  SceneType,
} from '@/types/video';

const props = defineProps<{
  source: VisualSource;
}>();

const emit = defineEmits<{
  update: [source: VisualSource];
}>();

const sourceTypes: { type: VisualSourceType; label: string; icon: typeof Palette }[] = [
  { type: 'claude-svg', label: 'Claude SVG', icon: Palette },
  { type: 'ai-video', label: 'AI Video', icon: Video },
  { type: 'ai-image', label: 'AI Image', icon: Image },
  { type: 'remotion-template', label: 'Template', icon: Layout },
  { type: 'stock', label: 'Stock', icon: Search },
  { type: 'screen-recording', label: 'Recording', icon: Monitor },
  { type: 'manual-upload', label: 'Upload', icon: Upload },
];

const videoProviders: VideoProvider[] = ['sora', 'runway', 'kling', 'pika'];
const imageProviders: ImageProvider[] = ['dalle', 'flux', 'comfyui', 'midjourney'];
const animations: ImageAnimation[] = ['ken-burns', 'zoom', 'pan', 'static'];
const sceneTypes: SceneType[] = [
  'title-card', 'text-reveal', 'diagram', 'chart',
  'comparison', 'timeline', 'code-highlight', 'quote',
  'list-reveal', 'infographic', 'transition', 'custom-svg',
];

function changeType(type: VisualSourceType) {
  const defaults: Record<VisualSourceType, VisualSource> = {
    'claude-svg': { type: 'claude-svg', prompt: '' },
    'ai-video': { type: 'ai-video', provider: 'runway', prompt: '' },
    'ai-image': { type: 'ai-image', provider: 'dalle', prompt: '', animation: 'ken-burns' },
    'remotion-template': { type: 'remotion-template', templateId: 'title-card', props: {} },
    'stock': { type: 'stock', query: '' },
    'screen-recording': { type: 'screen-recording', recordingUrl: '' },
    'manual-upload': { type: 'manual-upload', fileUrl: '' },
  };
  emit('update', defaults[type]);
}

function updateField(field: string, value: unknown) {
  emit('update', { ...props.source, [field]: value } as VisualSource);
}

// Manual upload functionality
const isDragging = ref(false);
const uploadedFileName = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);

const uploadedFileIsVideo = computed(() => {
  return uploadedFileName.value.match(/\.(mp4|webm)$/i) !== null;
});

const ACCEPTED_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm',
]);

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) processFile(file);
  input.value = ''; // Reset for re-upload of same file
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) processFile(file);
}

function processFile(file: File) {
  if (!ACCEPTED_TYPES.has(file.type)) {
    return; // Silently reject unsupported types
  }
  if (file.size > MAX_FILE_SIZE) {
    return; // Silently reject oversized files
  }

  const objectUrl = URL.createObjectURL(file);
  uploadedFileName.value = file.name;
  emit('update', { type: 'manual-upload', fileUrl: objectUrl });
}

function clearUpload() {
  uploadedFileName.value = '';
  emit('update', { type: 'manual-upload', fileUrl: '' });
}
</script>

<template>
  <div class="space-y-4">
    <!-- Source Type Selector -->
    <div class="space-y-2">
      <label class="text-xs font-medium text-slate-400">Visual Source</label>
      <select
        :value="source.type"
        @change="changeType(($event.target as HTMLSelectElement).value as VisualSourceType)"
        class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 focus:outline-none focus:ring-blue-500/50"
      >
        <option
          v-for="st in sourceTypes"
          :key="st.type"
          :value="st.type"
          class="bg-slate-800"
        >
          {{ st.label }}
        </option>
      </select>
    </div>

    <!-- Claude SVG Fields -->
    <template v-if="source.type === 'claude-svg'">
      <div class="space-y-2">
        <label class="text-xs font-medium text-slate-400">Prompt</label>
        <textarea
          :value="source.prompt"
          @input="updateField('prompt', ($event.target as HTMLTextAreaElement).value)"
          rows="3"
          placeholder="Describe the visual..."
          class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 placeholder:text-slate-600 focus:outline-none focus:ring-blue-500/50 resize-none"
        ></textarea>
      </div>
      <button
        class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600/10 px-3 py-2 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20 transition-colors hover:bg-blue-600/20"
      >
        <Sparkles :size="12" />
        Generate SVG
      </button>
    </template>

    <!-- AI Video Fields -->
    <template v-if="source.type === 'ai-video'">
      <div class="space-y-2">
        <label class="text-xs font-medium text-slate-400">Provider</label>
        <select
          :value="source.provider"
          @change="updateField('provider', ($event.target as HTMLSelectElement).value)"
          class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 focus:outline-none focus:ring-blue-500/50"
        >
          <option v-for="p in videoProviders" :key="p" :value="p" class="bg-slate-800">{{ p }}</option>
        </select>
      </div>
      <div class="space-y-2">
        <label class="text-xs font-medium text-slate-400">Prompt</label>
        <textarea
          :value="source.prompt"
          @input="updateField('prompt', ($event.target as HTMLTextAreaElement).value)"
          rows="3"
          placeholder="Describe the video..."
          class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 placeholder:text-slate-600 focus:outline-none focus:ring-blue-500/50 resize-none"
        ></textarea>
      </div>
    </template>

    <!-- AI Image Fields -->
    <template v-if="source.type === 'ai-image'">
      <div class="space-y-2">
        <label class="text-xs font-medium text-slate-400">Provider</label>
        <select
          :value="source.provider"
          @change="updateField('provider', ($event.target as HTMLSelectElement).value)"
          class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 focus:outline-none focus:ring-blue-500/50"
        >
          <option v-for="p in imageProviders" :key="p" :value="p" class="bg-slate-800">{{ p }}</option>
        </select>
      </div>
      <div class="space-y-2">
        <label class="text-xs font-medium text-slate-400">Prompt</label>
        <textarea
          :value="source.prompt"
          @input="updateField('prompt', ($event.target as HTMLTextAreaElement).value)"
          rows="3"
          placeholder="Describe the image..."
          class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 placeholder:text-slate-600 focus:outline-none focus:ring-blue-500/50 resize-none"
        ></textarea>
      </div>
      <div class="space-y-2">
        <label class="text-xs font-medium text-slate-400">Animation</label>
        <select
          :value="source.animation"
          @change="updateField('animation', ($event.target as HTMLSelectElement).value)"
          class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 focus:outline-none focus:ring-blue-500/50"
        >
          <option v-for="a in animations" :key="a" :value="a" class="bg-slate-800">{{ a }}</option>
        </select>
      </div>
    </template>

    <!-- Remotion Template Fields -->
    <template v-if="source.type === 'remotion-template'">
      <div class="space-y-2">
        <label class="text-xs font-medium text-slate-400">Template</label>
        <select
          :value="source.templateId"
          @change="updateField('templateId', ($event.target as HTMLSelectElement).value)"
          class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 focus:outline-none focus:ring-blue-500/50"
        >
          <option v-for="t in sceneTypes" :key="t" :value="t" class="bg-slate-800">{{ t }}</option>
        </select>
      </div>
      <div class="space-y-2">
        <label class="text-xs font-medium text-slate-400">Props (JSON)</label>
        <textarea
          :value="JSON.stringify(source.props, null, 2)"
          @input="(() => { try { updateField('props', JSON.parse(($event.target as HTMLTextAreaElement).value)) } catch {} })()"
          rows="4"
          placeholder="{}"
          class="w-full rounded-lg bg-slate-800/50 px-3 py-2 font-mono text-xs text-white ring-1 ring-slate-700/50 placeholder:text-slate-600 focus:outline-none focus:ring-blue-500/50 resize-none"
        ></textarea>
      </div>
    </template>

    <!-- Stock Fields -->
    <template v-if="source.type === 'stock'">
      <div class="space-y-2">
        <label class="text-xs font-medium text-slate-400">Search Query</label>
        <input
          :value="source.query"
          @input="updateField('query', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="Search stock footage..."
          class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 placeholder:text-slate-600 focus:outline-none focus:ring-blue-500/50"
        />
      </div>
    </template>

    <!-- Screen Recording Fields -->
    <template v-if="source.type === 'screen-recording'">
      <div class="space-y-2">
        <label class="text-xs font-medium text-slate-400">Recording URL</label>
        <input
          :value="source.recordingUrl"
          @input="updateField('recordingUrl', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="https://..."
          class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 placeholder:text-slate-600 focus:outline-none focus:ring-blue-500/50"
        />
      </div>
    </template>

    <!-- Manual Upload Fields -->
    <template v-if="source.type === 'manual-upload'">
      <!-- URL Input (for remote URLs) -->
      <div class="space-y-2">
        <label class="text-xs font-medium text-slate-400">File URL</label>
        <input
          :value="source.fileUrl"
          @input="updateField('fileUrl', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="https://... or drop a file below"
          class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 placeholder:text-slate-600 focus:outline-none focus:ring-blue-500/50"
        />
      </div>

      <!-- Upload Zone -->
      <div
        @click="triggerFileInput"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        :class="[
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl py-8 transition-colors',
          isDragging
            ? 'bg-blue-600/10 ring-2 ring-blue-500/40'
            : 'bg-slate-800/30 ring-1 ring-dashed ring-slate-700/50 hover:bg-slate-800/50 hover:ring-slate-600/50',
        ]"
      >
        <Upload :size="24" :class="isDragging ? 'text-blue-400' : 'text-slate-600'" />
        <span :class="['text-xs', isDragging ? 'text-blue-400' : 'text-slate-500']">
          {{ isDragging ? 'Drop file here' : 'Click or drag file to upload' }}
        </span>
        <span class="text-[10px] text-slate-600">
          Images (PNG, JPG, WebP, GIF) or Videos (MP4, WebM)
        </span>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
        class="hidden"
        @change="handleFileSelect"
      />

      <!-- Upload Status / Preview -->
      <div v-if="uploadedFileName" class="flex items-center gap-2 rounded-lg bg-slate-800/30 px-3 py-2 ring-1 ring-slate-700/30">
        <component :is="uploadedFileIsVideo ? Video : Image" :size="14" class="shrink-0 text-emerald-400" />
        <span class="min-w-0 flex-1 truncate text-xs text-slate-300">{{ uploadedFileName }}</span>
        <button
          @click="clearUpload"
          class="text-slate-600 transition-colors hover:text-rose-400"
        >
          <X :size="14" />
        </button>
      </div>
    </template>
  </div>
</template>
