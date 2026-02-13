<script setup lang="ts">
// Style H: Minimal Blue — Buffer / Popcorn inspired
import {
  BarChart3,
  TrendingUp,
  Send,
  Eye,
  FileText,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Zap,
  Layers,
  Calendar,
  MoreHorizontal,
  ChevronRight
} from 'lucide-vue-next'

const stats = [
  { label: 'Total Views', value: '24,521', change: '+12.5%', positive: true },
  { label: 'Published', value: '48', change: '+8', positive: true },
  { label: 'In Pipeline', value: '12', change: '-3', positive: false },
  { label: 'Engagement', value: '4.2%', change: '+0.8%', positive: true },
]

const recentActivities = [
  { id: '1', action: 'Published "AI Trends 2026"', channel: 'Medium', status: 'published' as const, time: '2m ago' },
  { id: '2', action: 'Transformed for LinkedIn', channel: 'LinkedIn', status: 'published' as const, time: '5m ago' },
  { id: '3', action: 'Processing X Thread', channel: 'X', status: 'pending' as const, time: '8m ago' },
  { id: '4', action: 'Newsletter draft ready', channel: 'Newsletter', status: 'pending' as const, time: '15m ago' },
  { id: '5', action: 'Brunch publish failed', channel: 'Brunch', status: 'failed' as const, time: '22m ago' },
]

const pipelines = [
  { name: 'Text Pipeline', status: 'running', items: 142, channels: ['Medium', 'LinkedIn', 'Blog'] },
  { name: 'Thread Pipeline', status: 'idle', items: 87, channels: ['X', 'Threads'] },
  { name: 'Snackable Pipeline', status: 'completed', items: 56, channels: ['IG Carousel', 'IG Story'] },
  { name: 'Longform Video', status: 'error', items: 12, channels: ['YouTube'] },
]

const statusIcon = { published: CheckCircle2, pending: Clock, failed: XCircle }
const statusColor = {
  published: 'text-[#168EEA]',
  pending: 'text-amber-500',
  failed: 'text-red-500',
}

const pipelineDot: Record<string, string> = {
  running: 'bg-[#168EEA]',
  idle: 'bg-slate-300',
  completed: 'bg-[#168EEA]',
  error: 'bg-red-400',
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Top nav — Buffer style minimal -->
    <header class="sticky top-0 z-50 border-b border-slate-100 bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-8 py-3.5">
        <div class="flex items-center gap-8">
          <div class="flex items-center gap-2">
            <Zap :size="20" class="text-[#168EEA]" />
            <span class="text-base font-bold text-slate-900">ContentForge</span>
          </div>
          <nav class="flex items-center gap-1">
            <a href="#" class="rounded-lg bg-[#168EEA]/8 px-3.5 py-1.5 text-sm font-medium text-[#168EEA]">Dashboard</a>
            <a href="#" class="rounded-lg px-3.5 py-1.5 text-sm text-slate-400 hover:bg-slate-50 hover:text-slate-600">Materials</a>
            <a href="#" class="rounded-lg px-3.5 py-1.5 text-sm text-slate-400 hover:bg-slate-50 hover:text-slate-600">Pipelines</a>
            <a href="#" class="rounded-lg px-3.5 py-1.5 text-sm text-slate-400 hover:bg-slate-50 hover:text-slate-600">Publications</a>
            <a href="#" class="rounded-lg px-3.5 py-1.5 text-sm text-slate-400 hover:bg-slate-50 hover:text-slate-600">Analytics</a>
          </nav>
        </div>
        <div class="flex items-center gap-3">
          <button class="rounded-lg bg-[#168EEA] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1280d4] transition-colors">
            New Material
          </button>
          <div class="h-8 w-8 rounded-full bg-[#168EEA]/10 flex items-center justify-center text-xs font-bold text-[#168EEA]">B</div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-8 py-8">
      <!-- Back -->
      <router-link to="/styles" class="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-[#168EEA]">
        <ArrowLeft :size="14" />
        Back to Style Selector
      </router-link>

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p class="text-sm text-slate-400">Overview of your content performance</p>
      </div>

      <!-- Stats — minimal cards -->
      <div class="mb-8 grid grid-cols-4 gap-6">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-xl bg-slate-50 p-5"
        >
          <div class="text-xs font-medium text-slate-400">{{ stat.label }}</div>
          <div class="mt-1.5 text-2xl font-bold tabular-nums text-slate-900">{{ stat.value }}</div>
          <div class="mt-2 flex items-center gap-1 text-sm">
            <component
              :is="stat.positive ? ArrowUpRight : ArrowDownRight"
              :size="14"
              :class="stat.positive ? 'text-[#168EEA]' : 'text-red-400'"
            />
            <span :class="stat.positive ? 'text-[#168EEA]' : 'text-red-400'" class="font-medium text-xs">
              {{ stat.change }}
            </span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-5 gap-8">
        <!-- Activity (3 cols) -->
        <div class="col-span-3">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-900">Recent Activity</h2>
            <button class="flex items-center gap-1 text-xs font-medium text-[#168EEA] hover:text-[#1280d4]">
              View all <ChevronRight :size="12" />
            </button>
          </div>
          <div class="rounded-xl bg-slate-50">
            <div
              v-for="(activity, i) in recentActivities"
              :key="activity.id"
              :class="i < recentActivities.length - 1 ? 'border-b border-white' : ''"
              class="flex items-center justify-between px-5 py-3.5"
            >
              <div class="flex items-center gap-3">
                <component
                  :is="statusIcon[activity.status]"
                  :size="16"
                  :class="statusColor[activity.status]"
                />
                <div>
                  <span class="text-sm text-slate-700">{{ activity.action }}</span>
                  <span class="ml-2 rounded bg-white px-2 py-0.5 text-xs text-slate-400">{{ activity.channel }}</span>
                </div>
              </div>
              <span class="text-xs text-slate-300">{{ activity.time }}</span>
            </div>
          </div>
        </div>

        <!-- Pipelines (2 cols) -->
        <div class="col-span-2">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-900">Pipelines</h2>
            <button class="text-xs font-medium text-[#168EEA] hover:text-[#1280d4]">Manage</button>
          </div>
          <div class="space-y-2">
            <div
              v-for="pipeline in pipelines"
              :key="pipeline.name"
              class="rounded-xl bg-slate-50 p-4"
            >
              <div class="mb-2 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span :class="pipelineDot[pipeline.status]" class="h-2 w-2 rounded-full"></span>
                  <span class="text-sm font-medium text-slate-700">{{ pipeline.name }}</span>
                </div>
                <button class="text-slate-300 hover:text-slate-500">
                  <MoreHorizontal :size="14" />
                </button>
              </div>
              <div class="flex items-center gap-1.5">
                <span
                  v-for="ch in pipeline.channels"
                  :key="ch"
                  class="rounded-md bg-white px-2 py-0.5 text-xs text-slate-400"
                >
                  {{ ch }}
                </span>
                <span class="ml-auto text-xs text-slate-300">{{ pipeline.items }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="mt-8 rounded-xl bg-slate-50 p-6">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-900">Performance</h2>
          <div class="flex gap-1">
            <button class="rounded-lg bg-[#168EEA] px-3 py-1 text-xs font-medium text-white">7D</button>
            <button class="rounded-lg px-3 py-1 text-xs text-slate-400 hover:text-slate-600">30D</button>
            <button class="rounded-lg px-3 py-1 text-xs text-slate-400 hover:text-slate-600">90D</button>
          </div>
        </div>
        <div class="flex items-end gap-4 h-32">
          <div v-for="(item, i) in [
            { h: 50, label: 'Mon' },
            { h: 70, label: 'Tue' },
            { h: 40, label: 'Wed' },
            { h: 85, label: 'Thu' },
            { h: 60, label: 'Fri' },
            { h: 90, label: 'Sat' },
            { h: 45, label: 'Sun' },
          ]" :key="i" class="flex flex-1 flex-col items-center gap-2">
            <div
              class="w-full rounded-lg bg-[#168EEA] opacity-70 transition-all hover:opacity-100"
              :style="{ height: item.h + '%' }"
            ></div>
            <span class="text-xs text-slate-300">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
