<script setup lang="ts">
// Style G: Growth Green — Sprout Social / Seeds inspired
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
  Sprout,
  Layers,
  Settings,
  Bell,
  Search,
  Plus,
  Leaf,
  User
} from 'lucide-vue-next'

const stats = [
  { label: 'Total Views', value: '24,521', change: '+12.5%', positive: true, icon: Eye },
  { label: 'Published', value: '48', change: '+8', positive: true, icon: Send },
  { label: 'In Pipeline', value: '12', change: '-3', positive: false, icon: RefreshCw },
  { label: 'Engagement', value: '4.2%', change: '+0.8%', positive: true, icon: TrendingUp },
]

const recentActivities = [
  { id: '1', action: 'Published "AI Trends 2026"', channel: 'Medium', status: 'published' as const, time: '2m ago' },
  { id: '2', action: 'Transformed for LinkedIn', channel: 'LinkedIn', status: 'published' as const, time: '5m ago' },
  { id: '3', action: 'Processing X Thread', channel: 'X', status: 'pending' as const, time: '8m ago' },
  { id: '4', action: 'Newsletter draft ready', channel: 'Newsletter', status: 'pending' as const, time: '15m ago' },
  { id: '5', action: 'Brunch publish failed', channel: 'Brunch', status: 'failed' as const, time: '22m ago' },
]

const pipelines = [
  { name: 'Text Pipeline', status: 'running', items: 142, channels: ['Medium', 'LinkedIn', 'Blog'], progress: 78 },
  { name: 'Thread Pipeline', status: 'idle', items: 87, channels: ['X', 'Threads'], progress: 100 },
  { name: 'Snackable Pipeline', status: 'completed', items: 56, channels: ['IG Carousel', 'IG Story'], progress: 100 },
  { name: 'Longform Video', status: 'error', items: 12, channels: ['YouTube'], progress: 35 },
]

const statusIcon = { published: CheckCircle2, pending: Clock, failed: XCircle }
const statusStyles = {
  published: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  pending: 'text-teal-700 bg-teal-50 border-teal-200',
  failed: 'text-red-600 bg-red-50 border-red-200',
}

const pipelineStatus: Record<string, { color: string; bg: string }> = {
  running: { color: 'text-emerald-600', bg: 'bg-emerald-500' },
  idle: { color: 'text-slate-500', bg: 'bg-slate-300' },
  completed: { color: 'text-teal-600', bg: 'bg-teal-500' },
  error: { color: 'text-red-500', bg: 'bg-red-500' },
}
</script>

<template>
  <div class="min-h-screen bg-[#f5f7f5]">
    <!-- Sidebar -->
    <aside class="fixed left-0 top-0 h-full w-56 border-r border-emerald-100 bg-white p-4">
      <div class="mb-6 flex items-center gap-2.5 px-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 shadow-sm shadow-emerald-200">
          <Sprout :size="16" class="text-white" />
        </div>
        <span class="text-base font-bold text-slate-800">ContentForge</span>
      </div>

      <div class="mb-4">
        <div class="flex items-center gap-2 rounded-lg bg-emerald-50/60 px-3 py-2 text-xs text-slate-400">
          <Search :size="14" />
          Quick search...
        </div>
      </div>

      <nav class="space-y-0.5">
        <a href="#" class="flex items-center gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          <BarChart3 :size="18" />
          Dashboard
        </a>
        <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-emerald-50/50 hover:text-emerald-700">
          <FileText :size="18" />
          Materials
        </a>
        <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-emerald-50/50 hover:text-emerald-700">
          <Layers :size="18" />
          Pipelines
        </a>
        <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-emerald-50/50 hover:text-emerald-700">
          <Send :size="18" />
          Publications
        </a>
        <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-emerald-50/50 hover:text-emerald-700">
          <TrendingUp :size="18" />
          Analytics
        </a>
      </nav>

      <div class="absolute bottom-4 left-4 right-4">
        <div class="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-3.5">
          <div class="mb-1 flex items-center gap-1.5">
            <Leaf :size="14" class="text-emerald-500" />
            <span class="text-xs font-semibold text-emerald-800">Growing Fast</span>
          </div>
          <p class="text-[11px] text-emerald-600/70">48 pieces published this week. +8 from last week.</p>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <main class="ml-56 p-8">
      <!-- Top bar -->
      <div class="mb-6 flex items-center justify-between">
        <router-link to="/styles" class="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-emerald-600">
          <ArrowLeft :size="14" />
          Back to Style Selector
        </router-link>
        <div class="flex items-center gap-2">
          <button class="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-600">
            <Bell :size="18" />
          </button>
          <button class="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-600">
            <Settings :size="18" />
          </button>
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
            CF
          </div>
        </div>
      </div>

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p class="text-sm text-slate-400">Your content growth at a glance</p>
      </div>

      <!-- Stats -->
      <div class="mb-8 grid grid-cols-4 gap-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"
        >
          <div class="mb-3 flex items-center justify-between">
            <span class="text-sm text-slate-400">{{ stat.label }}</span>
            <div class="rounded-lg bg-emerald-50 p-2">
              <component :is="stat.icon" :size="16" class="text-emerald-500" />
            </div>
          </div>
          <div class="text-2xl font-bold tabular-nums text-slate-800">{{ stat.value }}</div>
          <div class="mt-1.5 flex items-center gap-1.5 text-sm">
            <span
              :class="stat.positive ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'"
              class="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium"
            >
              <component :is="stat.positive ? ArrowUpRight : ArrowDownRight" :size="12" />
              {{ stat.change }}
            </span>
            <span class="text-xs text-slate-300">vs last week</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-6">
        <!-- Activity (2 cols) -->
        <div class="col-span-2 rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-emerald-50 px-6 py-4">
            <h2 class="font-semibold text-slate-800">Recent Activity</h2>
            <button class="text-sm font-medium text-emerald-600 hover:text-emerald-700">View All</button>
          </div>
          <div class="divide-y divide-emerald-50/60">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-emerald-50/30"
            >
              <div class="flex items-center gap-3">
                <span
                  :class="statusStyles[activity.status]"
                  class="flex h-7 w-7 items-center justify-center rounded-full border"
                >
                  <component :is="statusIcon[activity.status]" :size="14" />
                </span>
                <div>
                  <div class="text-sm font-medium text-slate-700">{{ activity.action }}</div>
                  <div class="text-xs text-slate-400">{{ activity.channel }}</div>
                </div>
              </div>
              <span class="text-xs text-slate-300">{{ activity.time }}</span>
            </div>
          </div>
        </div>

        <!-- Pipelines (1 col) -->
        <div class="rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-emerald-50 px-5 py-4">
            <h2 class="font-semibold text-slate-800">Pipelines</h2>
            <button class="text-sm font-medium text-emerald-600 hover:text-emerald-700">Manage</button>
          </div>
          <div class="divide-y divide-emerald-50/60">
            <div
              v-for="pipeline in pipelines"
              :key="pipeline.name"
              class="px-5 py-3.5"
            >
              <div class="mb-1.5 flex items-center justify-between">
                <span class="text-sm font-medium text-slate-700">{{ pipeline.name }}</span>
                <span :class="pipelineStatus[pipeline.status].color" class="text-xs capitalize">{{ pipeline.status }}</span>
              </div>
              <div class="h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
                <div
                  :class="pipelineStatus[pipeline.status].bg"
                  class="h-full rounded-full transition-all"
                  :style="{ width: pipeline.progress + '%' }"
                ></div>
              </div>
              <div class="mt-1 text-[11px] text-slate-300">{{ pipeline.items }} items</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="mt-6 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-semibold text-slate-800">Content Growth</h2>
          <div class="flex rounded-xl border border-emerald-200 p-0.5">
            <button class="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-white">Week</button>
            <button class="px-3 py-1 text-xs text-slate-400 hover:text-slate-600">Month</button>
            <button class="px-3 py-1 text-xs text-slate-400 hover:text-slate-600">Quarter</button>
          </div>
        </div>
        <div class="flex items-end gap-3 h-36">
          <div v-for="(item, i) in [
            { h: 45, label: 'Mon' },
            { h: 65, label: 'Tue' },
            { h: 38, label: 'Wed' },
            { h: 80, label: 'Thu' },
            { h: 55, label: 'Fri' },
            { h: 92, label: 'Sat' },
            { h: 42, label: 'Sun' },
          ]" :key="i" class="flex flex-1 flex-col items-center gap-2">
            <div
              class="w-full rounded-lg bg-gradient-to-t from-emerald-500 to-teal-400 transition-all hover:from-emerald-400 hover:to-teal-300"
              :style="{ height: item.h + '%' }"
            ></div>
            <span class="text-xs text-slate-400">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
