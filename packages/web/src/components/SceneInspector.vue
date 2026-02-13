<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  Type,
  Eye,
  User,
  Layers,
  Clock,
  Sparkles,
  Volume2,
  History,
  RotateCcw,
} from 'lucide-vue-next';
import VisualSourceSelector from './VisualSourceSelector.vue';
import type {
  EditableScene,
  SceneNarration,
  SceneVisual,
  ScenePresenter,
  SceneOverlay,
  SceneTiming,
  VisualSource,
  PresenterPosition,
  PresenterSize,
  PresenterShape,
  PresenterBackground,
  PresenterGesture,
  SubtitleStyle,
  TransitionType,
} from '@/types/video';

const props = defineProps<{
  scene: EditableScene;
}>();

const emit = defineEmits<{
  update: [sceneId: string, patch: Partial<EditableScene>];
  restoreVersion: [sceneId: string, versionId: string];
}>();

type TabId = 'narration' | 'visual' | 'presenter' | 'overlay' | 'timing';

const activeTab = ref<TabId>('narration');

const tabs: { id: TabId; label: string; icon: typeof Type }[] = [
  { id: 'narration', label: 'Narration', icon: Type },
  { id: 'visual', label: 'Visual', icon: Eye },
  { id: 'presenter', label: 'Presenter', icon: User },
  { id: 'overlay', label: 'Overlay', icon: Layers },
  { id: 'timing', label: 'Timing', icon: Clock },
];

const voiceOptions = [
  { id: 'alloy', label: 'Alloy' },
  { id: 'echo', label: 'Echo' },
  { id: 'fable', label: 'Fable' },
  { id: 'onyx', label: 'Onyx' },
  { id: 'nova', label: 'Nova' },
  { id: 'shimmer', label: 'Shimmer' },
];

const positions: PresenterPosition[] = ['bottom-right', 'bottom-left', 'center-right'];
const sizes: PresenterSize[] = ['small', 'medium', 'large'];
const shapes: PresenterShape[] = ['circle', 'rounded', 'full-body'];
const backgrounds: PresenterBackground[] = ['transparent', 'blurred', 'gradient'];
const gestures: PresenterGesture[] = ['talking', 'explaining', 'pointing', 'nodding'];
const subtitleStyles: SubtitleStyle[] = ['minimal', 'bold', 'karaoke'];
const transitions: TransitionType[] = ['cut', 'fade', 'slide', 'zoom'];
const enterAnimations: Array<'fade-in' | 'slide-in' | 'pop'> = ['fade-in', 'slide-in', 'pop'];

function updateNarration(patch: Partial<SceneNarration>) {
  emit('update', props.scene.id, {
    narration: { ...props.scene.narration, ...patch },
  });
}

function updateVisualSource(source: VisualSource) {
  emit('update', props.scene.id, {
    visual: { ...props.scene.visual, source },
  });
}

function updatePresenter(patch: Partial<ScenePresenter>) {
  emit('update', props.scene.id, {
    presenter: { ...props.scene.presenter, ...patch },
  });
}

function updateOverlay(patch: Partial<SceneOverlay>) {
  emit('update', props.scene.id, {
    overlay: { ...props.scene.overlay, ...patch },
  });
}

function updateTiming(patch: Partial<SceneTiming>) {
  emit('update', props.scene.id, {
    timing: { ...props.scene.timing, ...patch },
  });
}

// Reset tab to narration when scene changes
watch(() => props.scene.id, () => {
  activeTab.value = 'narration';
});
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="border-b border-slate-800/50 px-4 py-3">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Inspector
      </h3>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-slate-800/50">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[10px] font-medium uppercase tracking-wider transition-colors',
          activeTab === tab.id
            ? 'border-b-2 border-blue-500 text-blue-400'
            : 'text-slate-500 hover:text-slate-300',
        ]"
      >
        <component :is="tab.icon" :size="12" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- Narration Tab -->
      <template v-if="activeTab === 'narration'">
        <div class="space-y-2">
          <label class="text-xs font-medium text-slate-400">Narration Text</label>
          <textarea
            :value="scene.narration.text"
            @input="updateNarration({ text: ($event.target as HTMLTextAreaElement).value })"
            rows="5"
            placeholder="Enter narration text..."
            class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 placeholder:text-slate-600 focus:outline-none focus:ring-blue-500/50 resize-none leading-relaxed"
          ></textarea>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-medium text-slate-400">Voice</label>
          <select
            :value="scene.narration.voiceId"
            @change="updateNarration({ voiceId: ($event.target as HTMLSelectElement).value })"
            class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 focus:outline-none focus:ring-blue-500/50"
          >
            <option v-for="v in voiceOptions" :key="v.id" :value="v.id" class="bg-slate-800">
              {{ v.label }}
            </option>
          </select>
        </div>

        <button
          class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600/10 px-3 py-2.5 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20 transition-colors hover:bg-blue-600/20"
        >
          <Volume2 :size="14" />
          Generate TTS
        </button>

        <!-- Audio Status -->
        <div class="flex items-center gap-2 rounded-lg bg-slate-800/30 px-3 py-2 ring-1 ring-slate-700/30">
          <div
            :class="[
              'h-1.5 w-1.5 rounded-full',
              scene.narration.status === 'ready' ? 'bg-emerald-400' :
              scene.narration.status === 'generating' ? 'bg-cyan-400 animate-pulse' :
              scene.narration.status === 'error' ? 'bg-rose-400' : 'bg-slate-500',
            ]"
          ></div>
          <span class="text-xs text-slate-500">Audio: {{ scene.narration.status }}</span>
          <span v-if="scene.narration.durationMs" class="ml-auto text-xs tabular-nums text-slate-600">
            {{ (scene.narration.durationMs / 1000).toFixed(1) }}s
          </span>
        </div>
      </template>

      <!-- Visual Tab -->
      <template v-if="activeTab === 'visual'">
        <VisualSourceSelector
          :source="scene.visual.source"
          @update="updateVisualSource"
        />

        <!-- Visual Status -->
        <div class="flex items-center gap-2 rounded-lg bg-slate-800/30 px-3 py-2 ring-1 ring-slate-700/30">
          <div
            :class="[
              'h-1.5 w-1.5 rounded-full',
              scene.visual.status === 'ready' ? 'bg-emerald-400' :
              scene.visual.status === 'generating' ? 'bg-cyan-400 animate-pulse' :
              scene.visual.status === 'error' ? 'bg-rose-400' : 'bg-slate-500',
            ]"
          ></div>
          <span class="text-xs text-slate-500">Visual: {{ scene.visual.status }}</span>
          <span class="ml-auto text-xs text-slate-600">
            {{ scene.visual.versions.length }} versions
          </span>
        </div>

        <!-- Version History -->
        <div v-if="scene.visual.versions.length > 0" class="space-y-2">
          <div class="flex items-center gap-1.5">
            <History :size="12" class="text-slate-500" />
            <label class="text-xs font-medium text-slate-400">Version History</label>
          </div>
          <div class="space-y-1.5 max-h-48 overflow-y-auto">
            <button
              v-for="version in [...scene.visual.versions].reverse()"
              :key="version.id"
              @click="emit('restoreVersion', scene.id, version.id)"
              class="flex w-full items-center gap-2 rounded-lg bg-slate-800/30 px-3 py-2 text-left ring-1 ring-slate-700/30 transition-colors hover:bg-slate-800/50 hover:ring-slate-600/30"
            >
              <RotateCcw :size="12" class="shrink-0 text-slate-500" />
              <div class="min-w-0 flex-1">
                <div class="truncate text-xs text-slate-300">
                  {{ version.source.type }}
                </div>
                <div class="text-[10px] text-slate-600">
                  {{ new Date(version.createdAt).toLocaleTimeString() }}
                </div>
              </div>
              <div
                v-if="version.previewUrl"
                class="h-8 w-8 shrink-0 overflow-hidden rounded bg-slate-900"
              >
                <img :src="version.previewUrl" class="h-full w-full object-cover" alt="" />
              </div>
            </button>
          </div>
        </div>
      </template>

      <!-- Presenter Tab -->
      <template v-if="activeTab === 'presenter'">
        <!-- Enable Toggle -->
        <div class="flex items-center justify-between">
          <label class="text-xs font-medium text-slate-400">Avatar Enabled</label>
          <button
            @click="updatePresenter({ enabled: !scene.presenter.enabled })"
            :class="[
              'relative h-5 w-9 rounded-full transition-colors',
              scene.presenter.enabled ? 'bg-blue-600' : 'bg-slate-700',
            ]"
          >
            <span
              :class="[
                'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                scene.presenter.enabled ? 'left-[18px]' : 'left-0.5',
              ]"
            ></span>
          </button>
        </div>

        <template v-if="scene.presenter.enabled">
          <div class="space-y-2">
            <label class="text-xs font-medium text-slate-400">Avatar Profile ID</label>
            <input
              :value="scene.presenter.avatarProfileId"
              @input="updatePresenter({ avatarProfileId: ($event.target as HTMLInputElement).value })"
              type="text"
              placeholder="avatar-001"
              class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 placeholder:text-slate-600 focus:outline-none focus:ring-blue-500/50"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <label class="text-xs font-medium text-slate-400">Position</label>
              <select
                :value="scene.presenter.position"
                @change="updatePresenter({ position: ($event.target as HTMLSelectElement).value as PresenterPosition })"
                class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-xs text-white ring-1 ring-slate-700/50 focus:outline-none focus:ring-blue-500/50"
              >
                <option v-for="p in positions" :key="p" :value="p" class="bg-slate-800">{{ p }}</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-medium text-slate-400">Size</label>
              <select
                :value="scene.presenter.size"
                @change="updatePresenter({ size: ($event.target as HTMLSelectElement).value as PresenterSize })"
                class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-xs text-white ring-1 ring-slate-700/50 focus:outline-none focus:ring-blue-500/50"
              >
                <option v-for="s in sizes" :key="s" :value="s" class="bg-slate-800">{{ s }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <label class="text-xs font-medium text-slate-400">Shape</label>
              <select
                :value="scene.presenter.shape"
                @change="updatePresenter({ shape: ($event.target as HTMLSelectElement).value as PresenterShape })"
                class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-xs text-white ring-1 ring-slate-700/50 focus:outline-none focus:ring-blue-500/50"
              >
                <option v-for="s in shapes" :key="s" :value="s" class="bg-slate-800">{{ s }}</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-medium text-slate-400">Background</label>
              <select
                :value="scene.presenter.background"
                @change="updatePresenter({ background: ($event.target as HTMLSelectElement).value as PresenterBackground })"
                class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-xs text-white ring-1 ring-slate-700/50 focus:outline-none focus:ring-blue-500/50"
              >
                <option v-for="b in backgrounds" :key="b" :value="b" class="bg-slate-800">{{ b }}</option>
              </select>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-medium text-slate-400">Gesture</label>
            <select
              :value="scene.presenter.gesture"
              @change="updatePresenter({ gesture: ($event.target as HTMLSelectElement).value as PresenterGesture })"
              class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 focus:outline-none focus:ring-blue-500/50"
            >
              <option v-for="g in gestures" :key="g" :value="g" class="bg-slate-800">{{ g }}</option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-medium text-slate-400">Enter Animation</label>
            <select
              :value="scene.presenter.enterAnimation"
              @change="updatePresenter({ enterAnimation: ($event.target as HTMLSelectElement).value as 'fade-in' | 'slide-in' | 'pop' })"
              class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 focus:outline-none focus:ring-blue-500/50"
            >
              <option v-for="a in enterAnimations" :key="a" :value="a" class="bg-slate-800">{{ a }}</option>
            </select>
          </div>

          <!-- Lip Sync Toggle -->
          <div class="flex items-center justify-between">
            <label class="text-xs font-medium text-slate-400">Lip Sync</label>
            <button
              @click="updatePresenter({ lipSync: !scene.presenter.lipSync })"
              :class="[
                'relative h-5 w-9 rounded-full transition-colors',
                scene.presenter.lipSync ? 'bg-blue-600' : 'bg-slate-700',
              ]"
            >
              <span
                :class="[
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                  scene.presenter.lipSync ? 'left-[18px]' : 'left-0.5',
                ]"
              ></span>
            </button>
          </div>
        </template>
      </template>

      <!-- Overlay Tab -->
      <template v-if="activeTab === 'overlay'">
        <!-- Subtitles Toggle -->
        <div class="flex items-center justify-between">
          <label class="text-xs font-medium text-slate-400">Subtitles</label>
          <button
            @click="updateOverlay({ subtitles: !scene.overlay.subtitles })"
            :class="[
              'relative h-5 w-9 rounded-full transition-colors',
              scene.overlay.subtitles ? 'bg-blue-600' : 'bg-slate-700',
            ]"
          >
            <span
              :class="[
                'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                scene.overlay.subtitles ? 'left-[18px]' : 'left-0.5',
              ]"
            ></span>
          </button>
        </div>

        <div v-if="scene.overlay.subtitles" class="space-y-2">
          <label class="text-xs font-medium text-slate-400">Subtitle Style</label>
          <select
            :value="scene.overlay.subtitleStyle || 'minimal'"
            @change="updateOverlay({ subtitleStyle: ($event.target as HTMLSelectElement).value as SubtitleStyle })"
            class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 focus:outline-none focus:ring-blue-500/50"
          >
            <option v-for="s in subtitleStyles" :key="s" :value="s" class="bg-slate-800">{{ s }}</option>
          </select>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-medium text-slate-400">Lower Third</label>
          <input
            :value="scene.overlay.lowerThird || ''"
            @input="updateOverlay({ lowerThird: ($event.target as HTMLInputElement).value || undefined })"
            type="text"
            placeholder="Optional lower third text..."
            class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 placeholder:text-slate-600 focus:outline-none focus:ring-blue-500/50"
          />
        </div>

        <!-- Watermark Toggle -->
        <div class="flex items-center justify-between">
          <label class="text-xs font-medium text-slate-400">Watermark</label>
          <button
            @click="updateOverlay({ watermark: !scene.overlay.watermark })"
            :class="[
              'relative h-5 w-9 rounded-full transition-colors',
              scene.overlay.watermark ? 'bg-blue-600' : 'bg-slate-700',
            ]"
          >
            <span
              :class="[
                'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                scene.overlay.watermark ? 'left-[18px]' : 'left-0.5',
              ]"
            ></span>
          </button>
        </div>
      </template>

      <!-- Timing Tab -->
      <template v-if="activeTab === 'timing'">
        <div class="space-y-2">
          <label class="text-xs font-medium text-slate-400">Duration (ms)</label>
          <input
            :value="scene.timing.durationMs"
            @input="updateTiming({ durationMs: Number(($event.target as HTMLInputElement).value) || 0 })"
            type="number"
            min="0"
            step="100"
            class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm tabular-nums text-white ring-1 ring-slate-700/50 focus:outline-none focus:ring-blue-500/50"
          />
          <div class="text-[10px] text-slate-600">
            {{ (scene.timing.durationMs / 1000).toFixed(1) }} seconds
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-medium text-slate-400">Transition In</label>
          <select
            :value="scene.timing.transitionIn"
            @change="updateTiming({ transitionIn: ($event.target as HTMLSelectElement).value as TransitionType })"
            class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white ring-1 ring-slate-700/50 focus:outline-none focus:ring-blue-500/50"
          >
            <option v-for="t in transitions" :key="t" :value="t" class="bg-slate-800">{{ t }}</option>
          </select>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-medium text-slate-400">Transition Duration (ms)</label>
          <input
            :value="scene.timing.transitionDurationMs"
            @input="updateTiming({ transitionDurationMs: Number(($event.target as HTMLInputElement).value) || 0 })"
            type="number"
            min="0"
            step="100"
            class="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm tabular-nums text-white ring-1 ring-slate-700/50 focus:outline-none focus:ring-blue-500/50"
          />
        </div>
      </template>
    </div>
  </div>
</template>
