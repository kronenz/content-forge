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
  PenTool,
  BookOpen,
  Inbox,
  ArrowLeft,
  Settings,
  Bell,
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
  { name: 'Text Pipeline', status: 'running', items: 142, channels: ['Medium', 'LinkedIn', 'Blog'] },
  { name: 'Thread Pipeline', status: 'idle', items: 87, channels: ['X', 'Threads'] },
  { name: 'Snackable Pipeline', status: 'completed', items: 56, channels: ['IG Carousel', 'IG Story'] },
  { name: 'Longform Video', status: 'error', items: 12, channels: ['YouTube'] },
]

const statusIcon = { published: CheckCircle2, pending: Clock, failed: XCircle }
const statusStyles = {
  published: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  pending: 'text-amber-700 bg-amber-50 border-amber-200',
  failed: 'text-red-700 bg-red-50 border-red-200',
}

const pipelineStatusStyles: Record<string, string> = {
  running: 'text-amber-700 bg-amber-50',
  idle: 'text-stone-600 bg-stone-100',
  completed: 'text-emerald-700 bg-emerald-50',
  error: 'text-red-700 bg-red-50',
}
</script>

<template>
  <div class="min-h-screen bg-amber-50/40">
    <!-- Top Navigation Bar -->
    <header class="sticky top-0 z-50 border-b border-amber-200/60 bg-white/80 backdrop-blur-sm">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2">
            <PenTool :size="22" class="text-amber-700" />
            <span class="text-lg font-bold text-stone-900" style="font-family: Georgia, 'Times New Roman', serif;">ContentForge</span>
          </div>
          <nav class="flex items-center gap-1">
            <a href="#" class="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800">Dashboard</a>
            <a href="#" class="rounded-lg px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-700">Materials</a>
            <a href="#" class="rounded-lg px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-700">Pipelines</a>
            <a href="#" class="rounded-lg px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-700">Publications</a>
            <a href="#" class="rounded-lg px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-700">Analytics</a>
          </nav>
        </div>
        <div class="flex items-center gap-3">
          <button class="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
            <Bell :size="18" />
          </button>
          <button class="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
            <Settings :size="18" />
          </button>
          <div class="h-8 w-8 rounded-full bg-amber-200 flex items-center justify-center">
            <User :size="16" class="text-amber-700" />
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="mx-auto max-w-6xl px-6 py-8">
      <!-- Back link -->
      <router-link to="/styles" class="mb-6 inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-amber-700">
        <ArrowLeft :size="14" />
        Back to Style Selector
      </router-link>

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-stone-900" style="font-family: Georgia, 'Times New Roman', serif;">
          Good afternoon
        </h1>
        <p class="mt-1 text-base text-stone-500">Here's what's happening with your content today.</p>
      </div>

      <!-- Stat Cards -->
      <div class="mb-8 grid grid-cols-4 gap-5">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-xl border border-amber-200/60 bg-white p-5 shadow-sm"
        >
          <div class="mb-3 flex items-center justify-between">
            <span class="text-sm text-stone-500">{{ stat.label }}</span>
            <div class="rounded-lg bg-amber-50 p-1.5">
              <component :is="stat.icon" :size="16" class="text-amber-600" />
            </div>
          </div>
          <div class="text-2xl font-bold text-stone-900" style="font-family: Georgia, 'Times New Roman', serif;">
            {{ stat.value }}
          </div>
          <div class="mt-2 flex items-center gap-1.5 text-sm">
            <component
              :is="stat.positive ? ArrowUpRight : ArrowDownRight"
              :size="14"
              :class="stat.positive ? 'text-emerald-600' : 'text-red-500'"
            />
            <span :class="stat.positive ? 'text-emerald-600' : 'text-red-500'" class="font-medium">
              {{ stat.change }}
            </span>
            <span class="text-stone-400">vs last week</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-5 gap-6">
        <!-- Activity Feed (3 cols) -->
        <div class="col-span-3 rounded-xl border border-amber-200/60 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-amber-100 px-6 py-4">
            <h2 class="text-lg font-semibold text-stone-900" style="font-family: Georgia, 'Times New Roman', serif;">
              Recent Activity
            </h2>
            <button class="text-sm font-medium text-amber-700 hover:text-amber-800">View All</button>
          </div>
          <div class="divide-y divide-amber-100/60">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="flex items-center justify-between px-6 py-4 hover:bg-amber-50/30"
            >
              <div class="flex items-center gap-3">
                <component
                  :is="statusIcon[activity.status]"
                  :size="18"
                  :class="statusStyles[activity.status].split(' ')[0]"
                />
                <div>
                  <div class="text-sm font-medium text-stone-800">{{ activity.action }}</div>
                  <div class="text-xs text-stone-400">{{ activity.channel }}</div>
                </div>
              </div>
              <span class="text-xs text-stone-400">{{ activity.time }}</span>
            </div>
          </div>
        </div>

        <!-- Pipeline Summary (2 cols) -->
        <div class="col-span-2 rounded-xl border border-amber-200/60 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-amber-100 px-6 py-4">
            <h2 class="text-lg font-semibold text-stone-900" style="font-family: Georgia, 'Times New Roman', serif;">
              Pipelines
            </h2>
            <button class="text-sm font-medium text-amber-700 hover:text-amber-800">Manage</button>
          </div>
          <div class="divide-y divide-amber-100/60">
            <div
              v-for="pipeline in pipelines"
              :key="pipeline.name"
              class="px-6 py-4 hover:bg-amber-50/30"
            >
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm font-medium text-stone-800">{{ pipeline.name }}</span>
                <span :class="pipelineStatusStyles[pipeline.status]" class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">
                  {{ pipeline.status }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex gap-1">
                  <span
                    v-for="ch in pipeline.channels"
                    :key="ch"
                    class="rounded border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-xs text-stone-500"
                  >
                    {{ ch }}
                  </span>
                </div>
                <span class="text-xs text-stone-400">{{ pipeline.items }} items</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Writing Activity -->
      <div class="mt-6 rounded-xl border border-amber-200/60 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-stone-900" style="font-family: Georgia, 'Times New Roman', serif;">
            Content Output This Week
          </h2>
          <div class="flex gap-1">
            <button class="rounded-md bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">Week</button>
            <button class="rounded-md px-3 py-1 text-xs text-stone-400 hover:text-stone-600">Month</button>
            <button class="rounded-md px-3 py-1 text-xs text-stone-400 hover:text-stone-600">Quarter</button>
          </div>
        </div>
        <!-- Warm bar chart -->
        <div class="flex items-end gap-3 h-36">
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
              class="w-full rounded-t-md bg-gradient-to-t from-amber-500 to-orange-400 transition-all hover:from-amber-400 hover:to-orange-300"
              :style="{ height: item.h + '%' }"
            ></div>
            <span class="text-xs text-stone-400">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
