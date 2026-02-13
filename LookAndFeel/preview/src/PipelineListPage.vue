<script setup lang="ts">
import {
  FileText,
  BarChart3,
  RefreshCw,
  Send,
  TrendingUp,
  Play,
  Pause,
  Search,
  Filter,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-vue-next'

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

const statusConfig = {
  running: { icon: Loader2, color: 'text-blue-600 bg-blue-50', label: 'Running' },
  idle: { icon: Pause, color: 'text-slate-500 bg-slate-100', label: 'Idle' },
  error: { icon: AlertCircle, color: 'text-red-600 bg-red-50', label: 'Error' },
  completed: { icon: CheckCircle2, color: 'text-green-600 bg-green-50', label: 'Completed' },
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Sidebar (same as Dashboard) -->
    <aside class="fixed left-0 top-0 h-full w-60 border-r border-slate-200 bg-slate-50 p-4">
      <div class="mb-8 flex items-center gap-2 px-3">
        <FileText :size="24" class="text-blue-600" />
        <span class="text-lg font-semibold text-slate-900">ContentForge</span>
      </div>
      <nav class="space-y-1">
        <router-link to="/" class="flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
          <BarChart3 :size="20" />
          Dashboard
        </router-link>
        <router-link to="/materials/mat-001" class="flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
          <FileText :size="20" />
          Materials
        </router-link>
        <router-link to="/pipelines" class="flex items-center gap-3 rounded-lg border-l-2 border-blue-600 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600">
          <RefreshCw :size="20" />
          Pipelines
        </router-link>
        <a href="#" class="flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
          <Send :size="20" />
          Publications
        </a>
        <a href="#" class="flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
          <TrendingUp :size="20" />
          Analytics
        </a>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="ml-60 p-8">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Pipelines</h1>
          <p class="text-sm text-slate-500">Manage content transformation pipelines</p>
        </div>
        <button class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Play :size="16" />
          Run All
        </button>
      </div>

      <!-- Filter Bar -->
      <div class="mb-6 flex items-center gap-4">
        <div class="relative flex-1">
          <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search pipelines..."
            class="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
          <Filter :size="16" />
          Filter
        </button>
      </div>

      <!-- Pipeline Cards -->
      <div class="grid grid-cols-1 gap-4">
        <div
          v-for="pipeline in pipelines"
          :key="pipeline.id"
          class="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div class="flex items-center gap-6">
            <!-- Status -->
            <span
              :class="statusConfig[pipeline.status].color"
              class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            >
              <component
                :is="statusConfig[pipeline.status].icon"
                :size="14"
                :class="pipeline.status === 'running' ? 'animate-spin' : ''"
              />
              {{ statusConfig[pipeline.status].label }}
            </span>

            <!-- Info -->
            <div>
              <h3 class="text-sm font-semibold text-slate-900">{{ pipeline.name }}</h3>
              <div class="mt-1 flex items-center gap-2">
                <span
                  v-for="channel in pipeline.channels"
                  :key="channel"
                  class="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                >
                  {{ channel }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-8">
            <!-- Stats -->
            <div class="text-right">
              <div class="text-sm font-medium text-slate-900">{{ pipeline.itemsProcessed }}</div>
              <div class="text-xs text-slate-400">items processed</div>
            </div>
            <div class="text-right">
              <div class="text-sm text-slate-600">{{ pipeline.lastRun }}</div>
              <div class="text-xs text-slate-400">last run</div>
            </div>

            <!-- Action -->
            <button class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <ChevronRight :size="20" />
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
