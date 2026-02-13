<script setup lang="ts">
// Style J: Bold Contrast — Jasper AI inspired
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
  ChevronRight,
  ArrowRight
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
  { name: 'Text Pipeline', status: 'running', items: 142 },
  { name: 'Thread Pipeline', status: 'idle', items: 87 },
  { name: 'Snackable Pipeline', status: 'completed', items: 56 },
  { name: 'Longform Video', status: 'error', items: 12 },
]

const statusIcon = { published: CheckCircle2, pending: Clock, failed: XCircle }
const statusColor = {
  published: 'text-emerald-500',
  pending: 'text-neutral-400',
  failed: 'text-[#FA4028]',
}

const pipelineDot: Record<string, string> = {
  running: 'bg-[#FA4028]',
  idle: 'bg-neutral-300',
  completed: 'bg-emerald-500',
  error: 'bg-[#FA4028] animate-pulse',
}
</script>

<template>
  <div class="min-h-screen bg-[#FAFAFA]">
    <!-- Top nav — Jasper-style bold minimal -->
    <header class="sticky top-0 z-50 bg-[#060606]">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-8 py-3">
        <div class="flex items-center gap-8">
          <div class="flex items-center gap-2">
            <Sparkles :size="18" class="text-[#FA4028]" />
            <span class="text-sm font-bold tracking-wide text-white">CONTENTFORGE</span>
          </div>
          <nav class="flex items-center gap-1">
            <a href="#" class="rounded px-3 py-1.5 text-sm font-medium text-white">Dashboard</a>
            <a href="#" class="rounded px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-300">Materials</a>
            <a href="#" class="rounded px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-300">Pipelines</a>
            <a href="#" class="rounded px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-300">Publications</a>
            <a href="#" class="rounded px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-300">Analytics</a>
          </nav>
        </div>
        <div class="flex items-center gap-3">
          <button class="rounded-lg bg-[#FA4028] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#e53620] transition-colors">
            Create
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-8 py-10">
      <!-- Back -->
      <router-link to="/styles" class="mb-8 inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-[#FA4028]">
        <ArrowLeft :size="14" />
        Back to Style Selector
      </router-link>

      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-4xl font-black tracking-tight text-[#060606]">Dashboard</h1>
        <p class="mt-1 text-base text-neutral-400">Your content performance at a glance.</p>
      </div>

      <!-- Stats — bold numbers -->
      <div class="mb-10 grid grid-cols-4 gap-6">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="border-l-4 border-[#060606] bg-white p-6"
        >
          <div class="text-xs font-bold uppercase tracking-wider text-neutral-400">{{ stat.label }}</div>
          <div class="mt-2 text-3xl font-black tabular-nums text-[#060606]">{{ stat.value }}</div>
          <div class="mt-2 flex items-center gap-1.5">
            <span
              :class="stat.positive ? 'text-emerald-500' : 'text-[#FA4028]'"
              class="flex items-center gap-0.5 text-sm font-bold"
            >
              <component :is="stat.positive ? ArrowUpRight : ArrowDownRight" :size="14" />
              {{ stat.change }}
            </span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-8">
        <!-- Activity (2 cols) -->
        <div class="col-span-2">
          <h2 class="mb-4 text-lg font-bold text-[#060606]">Recent Activity</h2>
          <div class="overflow-hidden bg-white">
            <div
              v-for="(activity, i) in recentActivities"
              :key="activity.id"
              :class="i < recentActivities.length - 1 ? 'border-b border-neutral-100' : ''"
              class="flex items-center justify-between px-6 py-4 transition-colors hover:bg-neutral-50"
            >
              <div class="flex items-center gap-4">
                <component
                  :is="statusIcon[activity.status]"
                  :size="18"
                  :class="statusColor[activity.status]"
                />
                <div>
                  <div class="text-sm font-semibold text-[#060606]">{{ activity.action }}</div>
                  <div class="text-xs text-neutral-400">{{ activity.channel }}</div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xs text-neutral-300">{{ activity.time }}</span>
                <ArrowRight :size="14" class="text-neutral-200" />
              </div>
            </div>
          </div>
        </div>

        <!-- Pipelines (1 col) -->
        <div>
          <h2 class="mb-4 text-lg font-bold text-[#060606]">Pipelines</h2>
          <div class="space-y-3">
            <div
              v-for="pipeline in pipelines"
              :key="pipeline.name"
              class="flex items-center justify-between bg-white p-4 transition-colors hover:bg-neutral-50"
            >
              <div class="flex items-center gap-3">
                <span :class="pipelineDot[pipeline.status]" class="h-3 w-3 rounded-full"></span>
                <div>
                  <div class="text-sm font-semibold text-[#060606]">{{ pipeline.name }}</div>
                  <div class="text-xs text-neutral-400 capitalize">{{ pipeline.status }}</div>
                </div>
              </div>
              <span class="text-sm font-bold tabular-nums text-neutral-300">{{ pipeline.items }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="mt-10 bg-white p-8">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-lg font-bold text-[#060606]">Performance</h2>
          <div class="flex gap-2">
            <button class="rounded bg-[#060606] px-4 py-1.5 text-xs font-bold text-white">7D</button>
            <button class="rounded px-4 py-1.5 text-xs font-bold text-neutral-300 hover:text-neutral-600">30D</button>
            <button class="rounded px-4 py-1.5 text-xs font-bold text-neutral-300 hover:text-neutral-600">90D</button>
          </div>
        </div>
        <div class="flex items-end gap-4 h-40">
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
              class="w-full bg-[#060606] transition-all hover:bg-[#FA4028]"
              :style="{ height: item.h + '%' }"
            ></div>
            <span class="text-xs font-bold text-neutral-300">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
