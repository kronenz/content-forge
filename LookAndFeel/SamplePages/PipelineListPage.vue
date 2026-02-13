<script setup lang="ts">
// Style L: Production Ready - Pipeline List Sample Page
// Reference implementation for ContentForge dark design system
import {
  Home,
  FileText,
  Layers,
  BarChart3,
  Settings,
  RefreshCw,
  Search,
  Filter,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  Zap
} from 'lucide-vue-next'
import { ref } from 'vue'

const sidebarExpanded = ref(false)

interface Pipeline {
  id: string
  name: string
  type: 'text' | 'thread' | 'snackable' | 'longform' | 'shortform' | 'webtoon'
  status: 'running' | 'idle' | 'error' | 'completed'
  channels: string[]
  lastRun: string
  itemsProcessed: number
}

const pipelines: Pipeline[] = [
  {
    id: '1',
    name: 'Text Pipeline',
    type: 'text',
    status: 'running',
    channels: ['Medium', 'LinkedIn', 'Brunch', 'Newsletter', 'Blog'],
    lastRun: '2 min ago',
    itemsProcessed: 142,
  },
  {
    id: '2',
    name: 'Thread Pipeline',
    type: 'thread',
    status: 'idle',
    channels: ['X', 'Threads', 'Kakao'],
    lastRun: '15 min ago',
    itemsProcessed: 87,
  },
  {
    id: '3',
    name: 'Snackable Pipeline',
    type: 'snackable',
    status: 'completed',
    channels: ['IG Carousel', 'IG Single', 'IG Story'],
    lastRun: '1 hour ago',
    itemsProcessed: 56,
  },
  {
    id: '4',
    name: 'Longform Video',
    type: 'longform',
    status: 'error',
    channels: ['YouTube'],
    lastRun: '3 hours ago',
    itemsProcessed: 12,
  },
  {
    id: '5',
    name: 'Shortform Video',
    type: 'shortform',
    status: 'idle',
    channels: ['Shorts', 'Reels', 'TikTok'],
    lastRun: '5 hours ago',
    itemsProcessed: 34,
  },
  {
    id: '6',
    name: 'Webtoon Pipeline',
    type: 'webtoon',
    status: 'idle',
    channels: ['Webtoon Strip', 'Infographic'],
    lastRun: 'Never',
    itemsProcessed: 0,
  },
]

const statusConfig: Record<string, { icon: typeof CheckCircle2, bg: string, text: string, ring: string, label: string }> = {
  running: { icon: Loader2, bg: 'bg-cyan-500/10', text: 'text-cyan-400', ring: 'ring-cyan-500/20', label: 'Running' },
  idle: { icon: Pause, bg: 'bg-slate-500/10', text: 'text-slate-400', ring: 'ring-slate-500/20', label: 'Idle' },
  error: { icon: AlertCircle, bg: 'bg-rose-500/10', text: 'text-rose-400', ring: 'ring-rose-500/20', label: 'Error' },
  completed: { icon: CheckCircle2, bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20', label: 'Completed' },
}
</script>

<template>
  <div class="flex h-screen flex-col bg-slate-950 text-slate-100 overflow-hidden">
    <!-- Main Layout: Sidebar + Content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Compact Icon Sidebar -->
      <aside
        :class="[
          'flex flex-col border-r border-slate-800/50 bg-slate-900/50 backdrop-blur-xl transition-all duration-300',
          sidebarExpanded ? 'w-56' : 'w-16'
        ]"
      >
        <!-- Logo -->
        <div class="flex h-16 items-center border-b border-slate-800/50 px-4">
          <div class="flex items-center gap-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600">
              <Zap :size="16" class="text-white" />
            </div>
            <span
              v-if="sidebarExpanded"
              class="text-sm font-semibold tracking-tight text-white"
            >
              ContentForge
            </span>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 space-y-1 p-2">
          <button
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200"
            :title="!sidebarExpanded ? 'Dashboard' : ''"
          >
            <Home :size="18" class="shrink-0" />
            <span v-if="sidebarExpanded" class="text-sm font-medium">Dashboard</span>
          </button>
          <button
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200"
            :title="!sidebarExpanded ? 'Materials' : ''"
          >
            <FileText :size="18" class="shrink-0" />
            <span v-if="sidebarExpanded" class="text-sm font-medium">Materials</span>
          </button>
          <button
            class="flex w-full items-center gap-3 rounded-lg bg-blue-600/10 px-3 py-2.5 text-blue-400 ring-1 ring-blue-500/20"
            :title="!sidebarExpanded ? 'Pipelines' : ''"
          >
            <Layers :size="18" class="shrink-0" />
            <span v-if="sidebarExpanded" class="text-sm font-medium">Pipelines</span>
          </button>
          <button
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200"
            :title="!sidebarExpanded ? 'Analytics' : ''"
          >
            <BarChart3 :size="18" class="shrink-0" />
            <span v-if="sidebarExpanded" class="text-sm font-medium">Analytics</span>
          </button>
        </nav>

        <!-- Bottom Actions -->
        <div class="space-y-1 border-t border-slate-800/50 p-2">
          <button
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-500 transition-colors hover:bg-slate-800/50 hover:text-slate-300"
            :title="!sidebarExpanded ? 'Settings' : ''"
          >
            <Settings :size="18" class="shrink-0" />
            <span v-if="sidebarExpanded" class="text-sm font-medium">Settings</span>
          </button>
          <button
            @click="sidebarExpanded = !sidebarExpanded"
            class="flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-slate-500 transition-colors hover:bg-slate-800/50 hover:text-slate-300"
            :title="sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'"
          >
            <ChevronRight
              :size="18"
              class="shrink-0 transition-transform duration-300"
              :class="{ 'rotate-180': sidebarExpanded }"
            />
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 overflow-y-auto">
        <!-- Top Bar -->
        <div class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/50 bg-slate-950/80 px-6 backdrop-blur-xl">
          <div class="flex items-center gap-4">
            <h1 class="text-sm font-semibold text-white">Pipelines</h1>
          </div>

          <div class="flex items-center gap-3">
            <button class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/30">
              <Play :size="16" />
              <span>Run All</span>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Filter Bar -->
          <div class="flex items-center gap-4">
            <div class="relative flex-1">
              <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search pipelines..."
                class="w-full rounded-lg bg-slate-900/50 py-2 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 ring-1 ring-slate-800/50 focus:outline-none focus:ring-blue-500/50 transition-all"
              />
            </div>
            <button class="inline-flex items-center gap-2 rounded-lg bg-slate-900/50 px-4 py-2 text-sm text-slate-400 ring-1 ring-slate-800/50 hover:bg-slate-800/50">
              <Filter :size="16" />
              <span>Filter</span>
            </button>
          </div>

          <!-- Pipeline Cards -->
          <div class="space-y-3">
            <div
              v-for="pipeline in pipelines"
              :key="pipeline.id"
              class="group relative overflow-hidden rounded-xl bg-slate-900/50 ring-1 ring-slate-800/50 transition-all hover:bg-slate-800/50 hover:ring-slate-700/50"
            >
              <div class="flex items-center justify-between p-4">
                <div class="flex items-center gap-6 flex-1">
                  <!-- Status Badge -->
                  <div
                    :class="[
                      'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 ring-1',
                      statusConfig[pipeline.status].bg,
                      statusConfig[pipeline.status].text,
                      statusConfig[pipeline.status].ring
                    ]"
                  >
                    <component
                      :is="statusConfig[pipeline.status].icon"
                      :size="14"
                      :class="pipeline.status === 'running' ? 'animate-spin' : ''"
                    />
                    <span class="text-xs font-medium">{{ statusConfig[pipeline.status].label }}</span>
                  </div>

                  <!-- Pipeline Info -->
                  <div class="flex-1">
                    <h3 class="text-sm font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                      {{ pipeline.name }}
                    </h3>
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span
                        v-for="channel in pipeline.channels"
                        :key="channel"
                        class="rounded bg-slate-800/50 px-2 py-0.5 text-[10px] text-slate-400"
                      >
                        {{ channel }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-8">
                  <!-- Stats -->
                  <div class="text-right">
                    <div class="text-sm font-semibold text-white tabular-nums">{{ pipeline.itemsProcessed }}</div>
                    <div class="text-xs text-slate-500">items processed</div>
                  </div>
                  <div class="text-right min-w-[80px]">
                    <div class="text-sm text-slate-400">{{ pipeline.lastRun }}</div>
                    <div class="text-xs text-slate-600">last run</div>
                  </div>

                  <!-- Action -->
                  <button class="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-700/50 hover:text-slate-400">
                    <ChevronRight :size="20" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Bottom Status Bar -->
    <div class="flex h-14 items-center justify-between border-t border-slate-800/50 bg-slate-900/80 px-4 backdrop-blur-xl">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600">
          <RefreshCw :size="14" class="animate-spin text-white" />
        </div>
        <div class="min-w-0">
          <div class="text-xs font-medium text-white line-clamp-1">Text Pipeline processing</div>
          <div class="text-[10px] text-slate-500">Transforming content (2/5)</div>
        </div>
      </div>

      <div class="flex flex-1 items-center gap-3 px-8">
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800/50">
          <div
            class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style="width: 40%"
          ></div>
        </div>
        <span class="text-xs font-semibold tabular-nums text-slate-500">40%</span>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-1.5">
          <Layers :size="12" class="text-slate-500" />
          <span class="text-xs text-slate-400">2/5</span>
        </div>
      </div>
    </div>
  </div>
</template>
