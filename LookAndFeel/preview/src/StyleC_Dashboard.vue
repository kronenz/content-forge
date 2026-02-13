<script setup lang="ts">
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
  Sparkles,
  Layers,
  Inbox,
  ArrowLeft,
  Settings,
  Search,
  Command,
  Plus,
  ChevronRight
} from 'lucide-vue-next'

const stats = [
  { label: 'Total Views', value: '24,521', change: '+12.5%', positive: true, icon: Eye, accent: 'from-blue-500 to-indigo-500' },
  { label: 'Published', value: '48', change: '+8', positive: true, icon: Send, accent: 'from-emerald-500 to-teal-500' },
  { label: 'In Pipeline', value: '12', change: '-3', positive: false, icon: RefreshCw, accent: 'from-amber-500 to-orange-500' },
  { label: 'Engagement', value: '4.2%', change: '+0.8%', positive: true, icon: TrendingUp, accent: 'from-rose-500 to-pink-500' },
]

const recentActivities = [
  { id: '1', action: 'Published "AI Trends 2026"', channel: 'Medium', status: 'published' as const, time: '2m ago' },
  { id: '2', action: 'Transformed for LinkedIn', channel: 'LinkedIn', status: 'published' as const, time: '5m ago' },
  { id: '3', action: 'Processing X Thread', channel: 'X', status: 'pending' as const, time: '8m ago' },
  { id: '4', action: 'Newsletter draft ready', channel: 'Newsletter', status: 'pending' as const, time: '15m ago' },
  { id: '5', action: 'Brunch publish failed', channel: 'Brunch', status: 'failed' as const, time: '22m ago' },
]

const pipelines = [
  { name: 'Text Pipeline', status: 'running', items: 142, progress: 78 },
  { name: 'Thread Pipeline', status: 'idle', items: 87, progress: 100 },
  { name: 'Snackable Pipeline', status: 'completed', items: 56, progress: 100 },
  { name: 'Longform Video', status: 'error', items: 12, progress: 35 },
]

const statusIcon = { published: CheckCircle2, pending: Clock, failed: XCircle }
const statusColor = {
  published: 'text-emerald-500 bg-emerald-50',
  pending: 'text-amber-500 bg-amber-50',
  failed: 'text-red-500 bg-red-50',
}

const pipelineProgressColor: Record<string, string> = {
  running: 'bg-blue-500',
  idle: 'bg-slate-300',
  completed: 'bg-emerald-500',
  error: 'bg-red-500',
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
    <!-- Sidebar -->
    <aside class="fixed left-0 top-0 h-full w-56 border-r border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl">
      <div class="mb-6 flex items-center gap-2.5 px-3">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">
          <Sparkles :size="16" class="text-white" />
        </div>
        <span class="text-base font-bold text-slate-900">ContentForge</span>
      </div>

      <!-- Search -->
      <div class="mb-4 px-1">
        <div class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-400">
          <Search :size="14" />
          <span>Search...</span>
          <div class="ml-auto flex items-center gap-0.5 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs">
            <Command :size="10" />K
          </div>
        </div>
      </div>

      <nav class="space-y-0.5">
        <a href="#" class="flex items-center gap-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 text-sm font-medium text-blue-700 shadow-sm">
          <BarChart3 :size="18" />
          Dashboard
        </a>
        <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-white/80 hover:text-slate-700 hover:shadow-sm">
          <FileText :size="18" />
          Materials
        </a>
        <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-white/80 hover:text-slate-700 hover:shadow-sm">
          <Layers :size="18" />
          Pipelines
        </a>
        <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-white/80 hover:text-slate-700 hover:shadow-sm">
          <Send :size="18" />
          Publications
        </a>
        <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-white/80 hover:text-slate-700 hover:shadow-sm">
          <TrendingUp :size="18" />
          Analytics
        </a>
      </nav>

      <div class="absolute bottom-4 left-4 right-4">
        <div class="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
          <p class="text-xs font-medium text-blue-800">Pro Tip</p>
          <p class="mt-1 text-xs text-blue-600/70">Use keyboard shortcuts for faster navigation.</p>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <main class="ml-56 p-8">
      <!-- Back link -->
      <router-link to="/styles" class="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-600">
        <ArrowLeft :size="14" />
        Back to Style Selector
      </router-link>

      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p class="text-sm text-slate-500">Overview of your content performance</p>
        </div>
        <button class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow">
          <Plus :size="16" />
          New Material
        </button>
      </div>

      <!-- Stat Cards -->
      <div class="mb-8 grid grid-cols-4 gap-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:bg-white/90"
        >
          <!-- Gradient accent top -->
          <div :class="`bg-gradient-to-r ${stat.accent}`" class="absolute left-0 top-0 h-1 w-full opacity-60"></div>
          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500">{{ stat.label }}</span>
            <div class="rounded-lg bg-slate-50 p-1.5 group-hover:bg-slate-100 transition-colors">
              <component :is="stat.icon" :size="16" class="text-slate-400" />
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-900 tabular-nums">{{ stat.value }}</div>
          <div class="mt-1.5 flex items-center gap-1.5 text-xs">
            <component
              :is="stat.positive ? ArrowUpRight : ArrowDownRight"
              :size="12"
              :class="stat.positive ? 'text-emerald-500' : 'text-red-500'"
            />
            <span :class="stat.positive ? 'text-emerald-600' : 'text-red-500'" class="font-semibold">
              {{ stat.change }}
            </span>
            <span class="text-slate-400">vs last week</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-6">
        <!-- Activity Feed (2 cols) -->
        <div class="col-span-2 overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-sm">
          <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 class="text-sm font-semibold text-slate-900">Recent Activity</h2>
            <button class="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
              View All <ChevronRight :size="12" />
            </button>
          </div>
          <div class="divide-y divide-slate-50">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-blue-50/30"
            >
              <div class="flex items-center gap-3">
                <span :class="statusColor[activity.status]" class="flex h-7 w-7 items-center justify-center rounded-full">
                  <component :is="statusIcon[activity.status]" :size="14" />
                </span>
                <div>
                  <div class="text-sm font-medium text-slate-700">{{ activity.action }}</div>
                  <div class="text-xs text-slate-400">{{ activity.channel }}</div>
                </div>
              </div>
              <span class="text-xs text-slate-400">{{ activity.time }}</span>
            </div>
          </div>
        </div>

        <!-- Pipeline Status (1 col) -->
        <div class="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-sm">
          <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 class="text-sm font-semibold text-slate-900">Pipelines</h2>
            <button class="text-xs font-medium text-blue-600 hover:text-blue-700">Manage</button>
          </div>
          <div class="divide-y divide-slate-50">
            <div
              v-for="pipeline in pipelines"
              :key="pipeline.name"
              class="px-6 py-4 transition-colors hover:bg-blue-50/30"
            >
              <div class="mb-1.5 flex items-center justify-between">
                <span class="text-sm font-medium text-slate-700">{{ pipeline.name }}</span>
                <span class="text-xs tabular-nums text-slate-400">{{ pipeline.items }}</span>
              </div>
              <!-- Progress bar -->
              <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  :class="pipelineProgressColor[pipeline.status]"
                  class="h-full rounded-full transition-all"
                  :style="{ width: pipeline.progress + '%' }"
                ></div>
              </div>
              <div class="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                <span class="capitalize">{{ pipeline.status }}</span>
                <span>{{ pipeline.progress }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Chart -->
      <div class="mt-6 overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-900">Content Performance</h2>
          <div class="flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button class="rounded-md bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">7D</button>
            <button class="px-3 py-1 text-xs text-slate-400 hover:text-slate-600">30D</button>
            <button class="px-3 py-1 text-xs text-slate-400 hover:text-slate-600">90D</button>
          </div>
        </div>
        <!-- Gradient bars -->
        <div class="flex items-end gap-3 h-40">
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
              class="w-full rounded-lg bg-gradient-to-t from-blue-500 to-indigo-400 opacity-70 transition-all hover:opacity-100 shadow-sm"
              :style="{ height: item.h + '%' }"
            ></div>
            <span class="text-xs text-slate-400">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
