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
  Zap,
  Activity,
  ArrowLeft,
  Layers,
  Settings
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
  { name: 'Text Pipeline', status: 'running', items: 142, channels: 5 },
  { name: 'Thread Pipeline', status: 'idle', items: 87, channels: 3 },
  { name: 'Snackable Pipeline', status: 'completed', items: 56, channels: 3 },
  { name: 'Longform Video', status: 'error', items: 12, channels: 1 },
]

const statusIcon = { published: CheckCircle2, pending: Clock, failed: XCircle }
const statusColor = {
  published: 'text-emerald-400',
  pending: 'text-amber-400',
  failed: 'text-red-400',
}

const pipelineStatusColor: Record<string, string> = {
  running: 'bg-cyan-500',
  idle: 'bg-slate-500',
  completed: 'bg-emerald-500',
  error: 'bg-red-500',
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-white">
    <!-- Sidebar -->
    <aside class="fixed left-0 top-0 h-full w-56 border-r border-slate-800/80 bg-slate-950 p-4">
      <div class="mb-8 flex items-center gap-2.5 px-3">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
          <Zap :size="16" class="text-white" />
        </div>
        <span class="text-base font-semibold tracking-tight text-white">ContentForge</span>
      </div>

      <nav class="space-y-0.5">
        <a href="#" class="flex items-center gap-3 rounded-lg bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-400">
          <BarChart3 :size="18" />
          Dashboard
        </a>
        <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-slate-200">
          <FileText :size="18" />
          Materials
        </a>
        <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-slate-200">
          <Layers :size="18" />
          Pipelines
        </a>
        <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-slate-200">
          <Send :size="18" />
          Publications
        </a>
        <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-slate-200">
          <Activity :size="18" />
          Analytics
        </a>
      </nav>

      <div class="absolute bottom-4 left-4 right-4">
        <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-800/50 hover:text-slate-300">
          <Settings :size="18" />
          Settings
        </a>
      </div>
    </aside>

    <!-- Main -->
    <main class="ml-56 p-8">
      <!-- Back link -->
      <router-link to="/styles" class="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-400">
        <ArrowLeft :size="14" />
        Back to Style Selector
      </router-link>

      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p class="text-sm text-slate-500">Overview of your content performance</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            All Systems Active
          </span>
        </div>
      </div>

      <!-- Stat Cards -->
      <div class="mb-8 grid grid-cols-4 gap-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-xl border border-slate-800/80 bg-slate-900/50 p-5"
        >
          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs font-medium uppercase tracking-wider text-slate-500">{{ stat.label }}</span>
            <component :is="stat.icon" :size="16" class="text-slate-600" />
          </div>
          <div class="text-2xl font-bold tabular-nums tracking-tight">{{ stat.value }}</div>
          <div class="mt-1.5 flex items-center gap-1.5 text-xs">
            <span
              :class="stat.positive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'"
              class="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium"
            >
              <component :is="stat.positive ? ArrowUpRight : ArrowDownRight" :size="12" />
              {{ stat.change }}
            </span>
            <span class="text-slate-600">vs last week</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-6">
        <!-- Activity Feed (2 cols) -->
        <div class="col-span-2 rounded-xl border border-slate-800/80 bg-slate-900/50">
          <div class="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
            <h2 class="text-sm font-semibold">Recent Activity</h2>
            <button class="text-xs text-violet-400 hover:text-violet-300">View All</button>
          </div>
          <div class="divide-y divide-slate-800/50">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="flex items-center justify-between px-6 py-3.5"
            >
              <div class="flex items-center gap-3">
                <component
                  :is="statusIcon[activity.status]"
                  :size="16"
                  :class="statusColor[activity.status]"
                />
                <div>
                  <div class="text-sm text-slate-200">{{ activity.action }}</div>
                  <div class="text-xs text-slate-500">{{ activity.channel }}</div>
                </div>
              </div>
              <span class="text-xs tabular-nums text-slate-600">{{ activity.time }}</span>
            </div>
          </div>
        </div>

        <!-- Pipeline Status (1 col) -->
        <div class="rounded-xl border border-slate-800/80 bg-slate-900/50">
          <div class="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
            <h2 class="text-sm font-semibold">Pipelines</h2>
            <button class="text-xs text-violet-400 hover:text-violet-300">Manage</button>
          </div>
          <div class="divide-y divide-slate-800/50">
            <div
              v-for="pipeline in pipelines"
              :key="pipeline.name"
              class="flex items-center justify-between px-6 py-3.5"
            >
              <div class="flex items-center gap-3">
                <span :class="pipelineStatusColor[pipeline.status]" class="h-2 w-2 rounded-full"></span>
                <div>
                  <div class="text-sm text-slate-200">{{ pipeline.name }}</div>
                  <div class="text-xs text-slate-500">{{ pipeline.channels }} channels</div>
                </div>
              </div>
              <span class="font-mono text-xs tabular-nums text-slate-500">{{ pipeline.items }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Graph Placeholder -->
      <div class="mt-6 rounded-xl border border-slate-800/80 bg-slate-900/50 p-6">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-semibold">Content Performance</h2>
          <div class="flex gap-2">
            <button class="rounded-md bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-400">7D</button>
            <button class="rounded-md px-3 py-1 text-xs text-slate-500 hover:text-slate-300">30D</button>
            <button class="rounded-md px-3 py-1 text-xs text-slate-500 hover:text-slate-300">90D</button>
          </div>
        </div>
        <!-- Simulated chart bars -->
        <div class="flex items-end gap-2 h-40">
          <div v-for="(h, i) in [45, 62, 38, 75, 55, 88, 70, 95, 60, 82, 48, 92, 65, 78]" :key="i"
            class="flex-1 rounded-t-sm bg-gradient-to-t from-violet-600/60 to-violet-400/40 transition-all hover:from-violet-500 hover:to-violet-300/60"
            :style="{ height: h + '%' }"
          ></div>
        </div>
        <div class="mt-2 flex justify-between text-xs text-slate-600">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
        </div>
      </div>
    </main>
  </div>
</template>
