<script setup lang="ts">
// Style I: Warm Canvas — HubSpot Canvas inspired
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
  Flame,
  Layers,
  Settings,
  Search,
  Plus,
  Bell,
  Users,
  ChevronDown
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
  { name: 'Text Pipeline', status: 'running', items: 142, channels: ['Medium', 'LinkedIn', 'Blog'] },
  { name: 'Thread Pipeline', status: 'idle', items: 87, channels: ['X', 'Threads'] },
  { name: 'Snackable Pipeline', status: 'completed', items: 56, channels: ['IG Carousel', 'IG Story'] },
  { name: 'Longform Video', status: 'error', items: 12, channels: ['YouTube'] },
]

const statusIcon = { published: CheckCircle2, pending: Clock, failed: XCircle }
const statusStyles = {
  published: 'text-emerald-700 bg-emerald-50',
  pending: 'text-orange-700 bg-orange-50',
  failed: 'text-red-600 bg-red-50',
}

const pipelineStyles: Record<string, string> = {
  running: 'text-orange-700 bg-orange-50 border-orange-200',
  idle: 'text-slate-500 bg-slate-50 border-slate-200',
  completed: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  error: 'text-red-600 bg-red-50 border-red-200',
}
</script>

<template>
  <div class="min-h-screen bg-[#faf8f5]">
    <!-- Sidebar -->
    <aside class="fixed left-0 top-0 h-full w-60 border-r border-orange-100/80 bg-white p-5">
      <div class="mb-8 flex items-center gap-2.5">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF4800]">
          <Flame :size="18" class="text-white" />
        </div>
        <div>
          <span class="text-sm font-bold text-slate-900">ContentForge</span>
          <div class="text-[10px] text-slate-400">Content Hub</div>
        </div>
      </div>

      <div class="mb-6 flex items-center gap-2 rounded-xl border border-orange-100 bg-[#faf8f5] px-3 py-2.5 text-sm text-slate-400">
        <Search :size="14" />
        Search...
      </div>

      <div class="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">Main</div>
      <nav class="mb-6 space-y-0.5">
        <a href="#" class="flex items-center gap-3 rounded-xl bg-[#FF4800]/5 px-3 py-2.5 text-sm font-medium text-[#FF4800]">
          <BarChart3 :size="18" />
          Dashboard
        </a>
        <a href="#" class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-orange-50/50">
          <FileText :size="18" />
          Materials
        </a>
        <a href="#" class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-orange-50/50">
          <Layers :size="18" />
          Pipelines
        </a>
        <a href="#" class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-orange-50/50">
          <Send :size="18" />
          Publications
        </a>
        <a href="#" class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-orange-50/50">
          <TrendingUp :size="18" />
          Analytics
        </a>
      </nav>

      <div class="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">Team</div>
      <nav class="space-y-0.5">
        <a href="#" class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-orange-50/50">
          <Users :size="18" />
          Members
        </a>
        <a href="#" class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-orange-50/50">
          <Settings :size="18" />
          Settings
        </a>
      </nav>
    </aside>

    <!-- Main -->
    <main class="ml-60 p-8">
      <!-- Back + top actions -->
      <div class="mb-6 flex items-center justify-between">
        <router-link to="/styles" class="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#FF4800]">
          <ArrowLeft :size="14" />
          Back to Style Selector
        </router-link>
        <div class="flex items-center gap-2">
          <button class="relative rounded-xl p-2 text-slate-400 hover:bg-white hover:text-slate-600">
            <Bell :size="18" />
            <span class="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#FF4800]"></span>
          </button>
          <div class="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-[#FF4800]">HS</div>
        </div>
      </div>

      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-[#1F1F1F]">Dashboard</h1>
          <p class="text-sm text-slate-400">Overview of your content performance</p>
        </div>
        <button class="inline-flex items-center gap-2 rounded-xl bg-[#FF4800] px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-orange-200 hover:bg-[#e64100] transition-colors">
          <Plus :size="16" />
          New Material
        </button>
      </div>

      <!-- Stats -->
      <div class="mb-8 grid grid-cols-4 gap-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-2xl border border-orange-100/60 bg-white p-5"
        >
          <div class="mb-3 flex items-center justify-between">
            <span class="text-sm text-slate-400">{{ stat.label }}</span>
            <div class="rounded-xl bg-orange-50 p-2">
              <component :is="stat.icon" :size="16" class="text-[#FF4800]" />
            </div>
          </div>
          <div class="text-2xl font-bold tabular-nums text-[#1F1F1F]">{{ stat.value }}</div>
          <div class="mt-1.5 flex items-center gap-1.5 text-sm">
            <span
              :class="stat.positive ? 'text-emerald-600' : 'text-red-500'"
              class="flex items-center gap-0.5 text-xs font-semibold"
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
        <div class="col-span-2 rounded-2xl border border-orange-100/60 bg-white">
          <div class="flex items-center justify-between border-b border-orange-50 px-6 py-4">
            <h2 class="font-semibold text-[#1F1F1F]">Recent Activity</h2>
            <button class="text-sm font-medium text-[#FF4800] hover:text-[#e64100]">View All</button>
          </div>
          <div class="divide-y divide-orange-50/60">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="flex items-center justify-between px-6 py-4 transition-colors hover:bg-orange-50/20"
            >
              <div class="flex items-center gap-3">
                <span
                  :class="statusStyles[activity.status]"
                  class="flex h-8 w-8 items-center justify-center rounded-xl"
                >
                  <component :is="statusIcon[activity.status]" :size="16" />
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
        <div class="rounded-2xl border border-orange-100/60 bg-white">
          <div class="flex items-center justify-between border-b border-orange-50 px-5 py-4">
            <h2 class="font-semibold text-[#1F1F1F]">Pipelines</h2>
          </div>
          <div class="divide-y divide-orange-50/60">
            <div
              v-for="pipeline in pipelines"
              :key="pipeline.name"
              class="px-5 py-4"
            >
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm font-medium text-slate-700">{{ pipeline.name }}</span>
                <span
                  :class="pipelineStyles[pipeline.status]"
                  class="rounded-lg border px-2 py-0.5 text-[11px] font-medium capitalize"
                >
                  {{ pipeline.status }}
                </span>
              </div>
              <div class="flex items-center gap-1">
                <span
                  v-for="ch in pipeline.channels"
                  :key="ch"
                  class="rounded-lg bg-[#faf8f5] px-2 py-0.5 text-[11px] text-slate-400"
                >
                  {{ ch }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="mt-6 rounded-2xl border border-orange-100/60 bg-white p-6">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-semibold text-[#1F1F1F]">Content Performance</h2>
          <div class="flex rounded-xl border border-orange-200 p-0.5">
            <button class="rounded-lg bg-[#FF4800] px-3 py-1 text-xs font-medium text-white">Week</button>
            <button class="px-3 py-1 text-xs text-slate-400 hover:text-slate-600">Month</button>
            <button class="px-3 py-1 text-xs text-slate-400 hover:text-slate-600">Quarter</button>
          </div>
        </div>
        <div class="flex items-end gap-3 h-36">
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
              class="w-full rounded-lg bg-gradient-to-t from-[#FF4800] to-orange-400 opacity-80 transition-all hover:opacity-100"
              :style="{ height: item.h + '%' }"
            ></div>
            <span class="text-xs text-slate-400">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
