<script setup lang="ts">
// Style F: Soft Professional — Linear/Figma inspired
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
  Sparkles,
  Layers,
  Settings,
  Plus,
  Search,
  ChevronDown,
  Hash,
  CircleDot
} from 'lucide-vue-next'

const stats = [
  { label: 'Total Views', value: '24,521', change: '+12.5%', positive: true, icon: Eye, accent: 'bg-violet-100 text-violet-600' },
  { label: 'Published', value: '48', change: '+8', positive: true, icon: Send, accent: 'bg-sky-100 text-sky-600' },
  { label: 'In Pipeline', value: '12', change: '-3', positive: false, icon: RefreshCw, accent: 'bg-amber-100 text-amber-600' },
  { label: 'Engagement', value: '4.2%', change: '+0.8%', positive: true, icon: TrendingUp, accent: 'bg-emerald-100 text-emerald-600' },
]

const recentActivities = [
  { id: '1', action: 'Published "AI Trends 2026"', channel: 'Medium', status: 'published' as const, time: '2m ago', assignee: 'CF' },
  { id: '2', action: 'Transformed for LinkedIn', channel: 'LinkedIn', status: 'published' as const, time: '5m ago', assignee: 'CF' },
  { id: '3', action: 'Processing X Thread', channel: 'X', status: 'pending' as const, time: '8m ago', assignee: 'AI' },
  { id: '4', action: 'Newsletter draft ready', channel: 'Newsletter', status: 'pending' as const, time: '15m ago', assignee: 'AI' },
  { id: '5', action: 'Brunch publish failed', channel: 'Brunch', status: 'failed' as const, time: '22m ago', assignee: 'CF' },
]

const pipelines = [
  { name: 'Text Pipeline', status: 'running', items: 142, priority: 'high' },
  { name: 'Thread Pipeline', status: 'idle', items: 87, priority: 'medium' },
  { name: 'Snackable Pipeline', status: 'completed', items: 56, priority: 'medium' },
  { name: 'Longform Video', status: 'error', items: 12, priority: 'high' },
]

const statusConfig = {
  published: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  pending: { icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
  failed: { icon: XCircle, bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-500' },
}

const pipelineConfig: Record<string, { dot: string; label: string }> = {
  running: { dot: 'bg-violet-500', label: 'Running' },
  idle: { dot: 'bg-slate-300', label: 'Idle' },
  completed: { dot: 'bg-emerald-500', label: 'Done' },
  error: { dot: 'bg-red-500', label: 'Error' },
}

const priorityStyle: Record<string, string> = {
  high: 'border-orange-200 bg-orange-50 text-orange-600',
  medium: 'border-blue-200 bg-blue-50 text-blue-600',
  low: 'border-slate-200 bg-slate-50 text-slate-500',
}
</script>

<template>
  <div class="min-h-screen bg-[#f8f9fc]">
    <!-- Sidebar -->
    <aside class="fixed left-0 top-0 h-full w-52 border-r border-slate-200/80 bg-white p-3">
      <div class="mb-5 flex items-center justify-between px-2">
        <div class="flex items-center gap-2">
          <div class="flex h-6 w-6 items-center justify-center rounded-md bg-violet-600">
            <Sparkles :size="12" class="text-white" />
          </div>
          <span class="text-sm font-semibold text-slate-900">ContentForge</span>
        </div>
        <button class="rounded-md p-1 hover:bg-slate-100">
          <ChevronDown :size="14" class="text-slate-400" />
        </button>
      </div>

      <!-- Quick search -->
      <div class="mb-4 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-400">
        <Search :size="12" />
        Search...
      </div>

      <div class="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Workspace</div>
      <nav class="space-y-0.5">
        <a href="#" class="flex items-center gap-2.5 rounded-md bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700">
          <BarChart3 :size="14" />
          Dashboard
        </a>
        <a href="#" class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
          <FileText :size="14" />
          Materials
        </a>
        <a href="#" class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
          <Layers :size="14" />
          Pipelines
        </a>
        <a href="#" class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
          <Send :size="14" />
          Publications
        </a>
        <a href="#" class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
          <TrendingUp :size="14" />
          Analytics
        </a>
      </nav>

      <div class="mt-6 mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Channels</div>
      <nav class="space-y-0.5">
        <a href="#" class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
          <Hash :size="14" class="text-slate-300" />
          medium
        </a>
        <a href="#" class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
          <Hash :size="14" class="text-slate-300" />
          linkedin
        </a>
        <a href="#" class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
          <Hash :size="14" class="text-slate-300" />
          x-threads
        </a>
      </nav>

      <div class="absolute bottom-3 left-3 right-3">
        <button class="flex w-full items-center gap-2 rounded-md border border-dashed border-slate-300 px-2.5 py-1.5 text-xs text-slate-400 hover:border-violet-300 hover:text-violet-500">
          <Plus :size="12" />
          Add Channel
        </button>
      </div>
    </aside>

    <!-- Main -->
    <main class="ml-52 p-6">
      <!-- Back -->
      <router-link to="/styles" class="mb-5 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-600">
        <ArrowLeft :size="12" />
        Back to Style Selector
      </router-link>

      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p class="text-xs text-slate-400">Content performance overview</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm hover:bg-slate-50">
            This Week
            <ChevronDown :size="12" class="ml-1 inline" />
          </button>
          <button class="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-violet-200 hover:bg-violet-700">
            <Plus :size="12" class="mr-1 inline" />
            New Material
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="mb-6 grid grid-cols-4 gap-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
        >
          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs text-slate-400">{{ stat.label }}</span>
            <span :class="stat.accent" class="rounded-md p-1.5">
              <component :is="stat.icon" :size="14" />
            </span>
          </div>
          <div class="text-xl font-bold tabular-nums text-slate-900">{{ stat.value }}</div>
          <div class="mt-1 flex items-center gap-1 text-xs">
            <span
              :class="stat.positive ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'"
              class="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium"
            >
              <component :is="stat.positive ? ArrowUpRight : ArrowDownRight" :size="10" />
              {{ stat.change }}
            </span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-5 gap-4">
        <!-- Activity (3 cols) -->
        <div class="col-span-3 rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 class="text-xs font-semibold text-slate-700">Activity</h2>
            <button class="text-xs text-violet-600 hover:text-violet-700">View all</button>
          </div>
          <div class="divide-y divide-slate-50">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50"
            >
              <div class="flex items-center gap-3">
                <span :class="statusConfig[activity.status].dot" class="h-1.5 w-1.5 rounded-full"></span>
                <div>
                  <div class="text-xs font-medium text-slate-700">{{ activity.action }}</div>
                  <div class="text-[10px] text-slate-400">{{ activity.channel }}</div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-[9px] font-bold text-violet-600">
                  {{ activity.assignee }}
                </span>
                <span class="text-[10px] tabular-nums text-slate-300">{{ activity.time }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pipelines (2 cols) -->
        <div class="col-span-2 rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 class="text-xs font-semibold text-slate-700">Pipelines</h2>
            <button class="text-xs text-violet-600 hover:text-violet-700">Manage</button>
          </div>
          <div class="divide-y divide-slate-50">
            <div
              v-for="pipeline in pipelines"
              :key="pipeline.name"
              class="px-5 py-3 hover:bg-slate-50/50"
            >
              <div class="mb-1.5 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span :class="pipelineConfig[pipeline.status].dot" class="h-1.5 w-1.5 rounded-full"></span>
                  <span class="text-xs font-medium text-slate-700">{{ pipeline.name }}</span>
                </div>
                <span :class="priorityStyle[pipeline.priority]" class="rounded border px-1.5 py-0.5 text-[10px] font-medium">
                  {{ pipeline.priority }}
                </span>
              </div>
              <div class="flex items-center justify-between text-[10px]">
                <span class="text-slate-400">{{ pipelineConfig[pipeline.status].label }}</span>
                <span class="tabular-nums text-slate-300">{{ pipeline.items }} items</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="mt-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xs font-semibold text-slate-700">Content Output</h2>
          <div class="flex rounded-lg border border-slate-200 p-0.5">
            <button class="rounded-md bg-violet-50 px-2.5 py-1 text-[10px] font-medium text-violet-600">Week</button>
            <button class="px-2.5 py-1 text-[10px] text-slate-400 hover:text-slate-600">Month</button>
            <button class="px-2.5 py-1 text-[10px] text-slate-400 hover:text-slate-600">Quarter</button>
          </div>
        </div>
        <div class="flex items-end gap-2 h-32">
          <div v-for="(item, i) in [
            { h: 50, label: 'Mon' },
            { h: 70, label: 'Tue' },
            { h: 40, label: 'Wed' },
            { h: 85, label: 'Thu' },
            { h: 60, label: 'Fri' },
            { h: 90, label: 'Sat' },
            { h: 45, label: 'Sun' },
          ]" :key="i" class="flex flex-1 flex-col items-center gap-1.5">
            <div
              class="w-full rounded-md bg-violet-500/80 transition-all hover:bg-violet-600"
              :style="{ height: item.h + '%' }"
            ></div>
            <span class="text-[10px] text-slate-400">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
