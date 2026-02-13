<script setup lang="ts">
// Style D: Monochrome Minimal — Stripe/Apple inspired
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
  Menu,
  Search,
  Bell,
  ChevronRight,
  MoreHorizontal
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

const pipelineStatusDot: Record<string, string> = {
  running: 'bg-black',
  idle: 'bg-neutral-300',
  completed: 'bg-black',
  error: 'bg-red-500',
}
</script>

<template>
  <div class="min-h-screen bg-white text-neutral-900">
    <!-- Top bar -->
    <header class="sticky top-0 z-50 border-b border-neutral-200 bg-white">
      <div class="flex items-center justify-between px-6 py-3">
        <div class="flex items-center gap-8">
          <span class="text-base font-semibold tracking-tight text-black">ContentForge</span>
          <nav class="flex items-center gap-6 text-sm">
            <a href="#" class="border-b-2 border-black pb-3 pt-3 font-medium text-black">Dashboard</a>
            <a href="#" class="border-b-2 border-transparent pb-3 pt-3 text-neutral-400 hover:text-neutral-600">Materials</a>
            <a href="#" class="border-b-2 border-transparent pb-3 pt-3 text-neutral-400 hover:text-neutral-600">Pipelines</a>
            <a href="#" class="border-b-2 border-transparent pb-3 pt-3 text-neutral-400 hover:text-neutral-600">Publications</a>
            <a href="#" class="border-b-2 border-transparent pb-3 pt-3 text-neutral-400 hover:text-neutral-600">Analytics</a>
          </nav>
        </div>
        <div class="flex items-center gap-2">
          <button class="rounded-full p-2 hover:bg-neutral-100"><Search :size="16" class="text-neutral-500" /></button>
          <button class="rounded-full p-2 hover:bg-neutral-100"><Bell :size="16" class="text-neutral-500" /></button>
          <div class="ml-2 h-7 w-7 rounded-full bg-black"></div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-6 py-10">
      <!-- Back -->
      <router-link to="/styles" class="mb-8 inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-black">
        <ArrowLeft :size="14" />
        Back to Style Selector
      </router-link>

      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-3xl font-semibold tracking-tight text-black">Dashboard</h1>
        <p class="mt-1 text-sm text-neutral-400">Overview of your content performance</p>
      </div>

      <!-- Stats -->
      <div class="mb-10 grid grid-cols-4 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="bg-white p-6"
        >
          <div class="text-xs font-medium uppercase tracking-widest text-neutral-400">{{ stat.label }}</div>
          <div class="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-black">{{ stat.value }}</div>
          <div class="mt-2 flex items-center gap-1 text-sm">
            <span :class="stat.positive ? 'text-black' : 'text-red-500'" class="font-medium">
              {{ stat.change }}
            </span>
            <span class="text-neutral-300">vs last week</span>
          </div>
        </div>
      </div>

      <!-- Activity -->
      <div class="mb-10">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-semibold uppercase tracking-widest text-neutral-400">Recent Activity</h2>
          <button class="text-sm text-neutral-400 hover:text-black">View all</button>
        </div>
        <div class="overflow-hidden rounded-xl border border-neutral-200">
          <div
            v-for="(activity, i) in recentActivities"
            :key="activity.id"
            :class="i < recentActivities.length - 1 ? 'border-b border-neutral-100' : ''"
            class="flex items-center justify-between bg-white px-6 py-4 transition-colors hover:bg-neutral-50"
          >
            <div class="flex items-center gap-4">
              <component
                :is="statusIcon[activity.status]"
                :size="16"
                :class="activity.status === 'failed' ? 'text-red-500' : activity.status === 'pending' ? 'text-neutral-300' : 'text-black'"
              />
              <div>
                <span class="text-sm text-black">{{ activity.action }}</span>
                <span class="mx-2 text-neutral-200">|</span>
                <span class="text-sm text-neutral-400">{{ activity.channel }}</span>
              </div>
            </div>
            <span class="text-xs tabular-nums text-neutral-300">{{ activity.time }}</span>
          </div>
        </div>
      </div>

      <!-- Pipelines -->
      <div>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-semibold uppercase tracking-widest text-neutral-400">Pipelines</h2>
          <button class="text-sm text-neutral-400 hover:text-black">Manage</button>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="pipeline in pipelines"
            :key="pipeline.name"
            class="rounded-xl border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-300"
          >
            <div class="mb-3 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span :class="pipelineStatusDot[pipeline.status]" class="h-2 w-2 rounded-full"></span>
                <span class="text-sm font-medium text-black">{{ pipeline.name }}</span>
              </div>
              <button class="text-neutral-300 hover:text-neutral-500">
                <MoreHorizontal :size="16" />
              </button>
            </div>
            <div class="flex items-center gap-2">
              <span
                v-for="ch in pipeline.channels"
                :key="ch"
                class="rounded-full border border-neutral-200 px-2.5 py-0.5 text-xs text-neutral-500"
              >
                {{ ch }}
              </span>
            </div>
            <div class="mt-3 text-xs text-neutral-300">
              {{ pipeline.items }} items processed
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
