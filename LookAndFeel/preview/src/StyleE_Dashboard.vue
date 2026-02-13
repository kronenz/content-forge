<script setup lang="ts">
// Style E: Data Dense — Datadog/Grafana inspired
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
  Activity,
  Layers,
  Settings,
  Terminal,
  Gauge,
  CircleDot,
  LayoutGrid
} from 'lucide-vue-next'

const stats = [
  { label: 'Views', value: '24,521', change: '+12.5%', positive: true, color: 'text-green-400 border-green-500/30 bg-green-500/5' },
  { label: 'Published', value: '48', change: '+8', positive: true, color: 'text-blue-400 border-blue-500/30 bg-blue-500/5' },
  { label: 'Pipeline', value: '12', change: '-3', positive: false, color: 'text-amber-400 border-amber-500/30 bg-amber-500/5' },
  { label: 'Engagement', value: '4.2%', change: '+0.8%', positive: true, color: 'text-purple-400 border-purple-500/30 bg-purple-500/5' },
]

const recentActivities = [
  { id: '1', action: 'Published "AI Trends 2026"', channel: 'Medium', status: 'published' as const, time: '14:22:01' },
  { id: '2', action: 'Transformed for LinkedIn', channel: 'LinkedIn', status: 'published' as const, time: '14:19:33' },
  { id: '3', action: 'Processing X Thread', channel: 'X', status: 'pending' as const, time: '14:16:12' },
  { id: '4', action: 'Newsletter draft ready', channel: 'Newsletter', status: 'pending' as const, time: '14:09:45' },
  { id: '5', action: 'Brunch publish failed', channel: 'Brunch', status: 'failed' as const, time: '14:02:18' },
]

const pipelines = [
  { name: 'text-pipeline', status: 'running', items: 142, cpu: '23%', mem: '128MB', uptime: '2d 14h' },
  { name: 'thread-pipeline', status: 'idle', items: 87, cpu: '0%', mem: '64MB', uptime: '2d 14h' },
  { name: 'snackable-pipeline', status: 'completed', items: 56, cpu: '0%', mem: '96MB', uptime: '1d 8h' },
  { name: 'longform-video', status: 'error', items: 12, cpu: '0%', mem: '256MB', uptime: '0d 0h' },
  { name: 'shortform-video', status: 'idle', items: 34, cpu: '0%', mem: '64MB', uptime: '5d 2h' },
  { name: 'webtoon-pipeline', status: 'idle', items: 0, cpu: '0%', mem: '32MB', uptime: '—' },
]

const statusColor: Record<string, string> = {
  published: 'text-green-400',
  pending: 'text-yellow-400',
  failed: 'text-red-400',
}

const pipelineStatusColor: Record<string, string> = {
  running: 'text-green-400',
  idle: 'text-slate-500',
  completed: 'text-blue-400',
  error: 'text-red-400',
}
</script>

<template>
  <div class="min-h-screen bg-[#0d1117] font-mono text-sm text-slate-300">
    <!-- Top bar -->
    <header class="sticky top-0 z-50 border-b border-slate-700/50 bg-[#161b22]">
      <div class="flex items-center justify-between px-4 py-2">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <Terminal :size="16" class="text-green-400" />
            <span class="font-bold text-white">ContentForge</span>
            <span class="text-slate-600">/</span>
            <span class="text-slate-400">dashboard</span>
          </div>
        </div>
        <div class="flex items-center gap-3 text-xs text-slate-500">
          <span class="flex items-center gap-1.5">
            <CircleDot :size="12" class="text-green-400" />
            6 pipelines
          </span>
          <span>|</span>
          <span>Last sync: 2m ago</span>
        </div>
      </div>
      <div class="flex items-center gap-1 border-t border-slate-700/30 bg-[#0d1117]/50 px-4">
        <a href="#" class="border-b-2 border-green-400 px-3 py-2 text-xs font-medium text-green-400">Overview</a>
        <a href="#" class="border-b-2 border-transparent px-3 py-2 text-xs text-slate-500 hover:text-slate-300">Materials</a>
        <a href="#" class="border-b-2 border-transparent px-3 py-2 text-xs text-slate-500 hover:text-slate-300">Pipelines</a>
        <a href="#" class="border-b-2 border-transparent px-3 py-2 text-xs text-slate-500 hover:text-slate-300">Publications</a>
        <a href="#" class="border-b-2 border-transparent px-3 py-2 text-xs text-slate-500 hover:text-slate-300">Metrics</a>
        <a href="#" class="border-b-2 border-transparent px-3 py-2 text-xs text-slate-500 hover:text-slate-300">Logs</a>
      </div>
    </header>

    <main class="p-4">
      <!-- Back -->
      <router-link to="/styles" class="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-green-400">
        <ArrowLeft :size="12" />
        style-selector
      </router-link>

      <!-- Stats Row -->
      <div class="mb-4 grid grid-cols-4 gap-3">
        <div
          v-for="stat in stats"
          :key="stat.label"
          :class="stat.color"
          class="rounded-md border p-4"
        >
          <div class="text-xs uppercase tracking-wider opacity-60">{{ stat.label }}</div>
          <div class="mt-1 text-2xl font-bold tabular-nums">{{ stat.value }}</div>
          <div class="mt-1 flex items-center gap-1 text-xs">
            <component :is="stat.positive ? ArrowUpRight : ArrowDownRight" :size="12" />
            {{ stat.change }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-3">
        <!-- Activity Log (7 cols) -->
        <div class="col-span-7 rounded-md border border-slate-700/50 bg-[#161b22]">
          <div class="flex items-center justify-between border-b border-slate-700/30 px-4 py-2.5">
            <div class="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Activity :size="14" />
              Activity Log
            </div>
            <span class="text-xs text-slate-600">{{ recentActivities.length }} events</span>
          </div>
          <div class="divide-y divide-slate-700/20">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/10"
            >
              <span class="w-16 text-xs tabular-nums text-slate-600">{{ activity.time }}</span>
              <span :class="statusColor[activity.status]" class="w-3 text-center">
                {{ activity.status === 'published' ? '+' : activity.status === 'failed' ? '!' : '~' }}
              </span>
              <span class="flex-1 text-xs text-slate-300">{{ activity.action }}</span>
              <span class="rounded bg-slate-700/40 px-2 py-0.5 text-xs text-slate-500">{{ activity.channel }}</span>
            </div>
          </div>
        </div>

        <!-- Pipeline Status (5 cols) -->
        <div class="col-span-5 rounded-md border border-slate-700/50 bg-[#161b22]">
          <div class="flex items-center justify-between border-b border-slate-700/30 px-4 py-2.5">
            <div class="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Layers :size="14" />
              Pipeline Status
            </div>
          </div>
          <!-- Table header -->
          <div class="grid grid-cols-6 gap-2 border-b border-slate-700/20 px-4 py-1.5 text-xs text-slate-600">
            <span class="col-span-2">NAME</span>
            <span>STATUS</span>
            <span class="text-right">ITEMS</span>
            <span class="text-right">CPU</span>
            <span class="text-right">MEM</span>
          </div>
          <div class="divide-y divide-slate-700/10">
            <div
              v-for="pipeline in pipelines"
              :key="pipeline.name"
              class="grid grid-cols-6 gap-2 px-4 py-2 text-xs hover:bg-slate-700/10"
            >
              <span class="col-span-2 text-slate-300">{{ pipeline.name }}</span>
              <span :class="pipelineStatusColor[pipeline.status]" class="capitalize">{{ pipeline.status }}</span>
              <span class="text-right tabular-nums text-slate-400">{{ pipeline.items }}</span>
              <span class="text-right tabular-nums text-slate-500">{{ pipeline.cpu }}</span>
              <span class="text-right tabular-nums text-slate-500">{{ pipeline.mem }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Throughput Chart -->
      <div class="mt-3 rounded-md border border-slate-700/50 bg-[#161b22] p-4">
        <div class="mb-3 flex items-center justify-between">
          <div class="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Gauge :size="14" />
            Throughput (items/hour)
          </div>
          <div class="flex gap-1 text-xs">
            <button class="rounded bg-green-500/10 px-2 py-0.5 text-green-400">1h</button>
            <button class="rounded px-2 py-0.5 text-slate-600 hover:text-slate-400">6h</button>
            <button class="rounded px-2 py-0.5 text-slate-600 hover:text-slate-400">24h</button>
            <button class="rounded px-2 py-0.5 text-slate-600 hover:text-slate-400">7d</button>
          </div>
        </div>
        <!-- Sparkline-style bars -->
        <div class="flex items-end gap-px h-24">
          <div v-for="(h, i) in [20, 35, 28, 45, 52, 38, 62, 55, 70, 48, 75, 82, 65, 90, 72, 85, 60, 78, 88, 95, 70, 82, 58, 92, 68, 80, 74, 86, 90, 78]" :key="i"
            class="flex-1 bg-green-500/60 transition-all hover:bg-green-400"
            :style="{ height: h + '%' }"
          ></div>
        </div>
        <div class="mt-2 flex justify-between text-xs text-slate-700">
          <span>14:00</span>
          <span>14:15</span>
          <span>14:30</span>
          <span>14:45</span>
          <span>15:00</span>
        </div>
      </div>
    </main>
  </div>
</template>
