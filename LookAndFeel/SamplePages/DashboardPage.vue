<script setup lang="ts">
// Style L: Production Ready - Dashboard Sample Page
// Reference implementation for ContentForge dark design system
import {
  Home,
  FileText,
  Layers,
  BarChart3,
  Settings,
  Bell,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Send,
  Zap,
  ChevronRight,
  Filter,
  Calendar,
  MoreHorizontal,
  GitBranch,
  Globe,
  Users
} from 'lucide-vue-next'
import { ref } from 'vue'

const sidebarExpanded = ref(false)

interface StatCard {
  label: string
  value: string
  change: string
  positive: boolean
  icon: typeof BarChart3
  color: string
}

interface RecentActivity {
  id: string
  action: string
  channel: string
  status: 'published' | 'pending' | 'failed'
  time: string
  icon: typeof CheckCircle2
  color: string
}

const stats: StatCard[] = [
  { label: 'Total Views', value: '24.5K', change: '+12.5%', positive: true, icon: Eye, color: 'blue' },
  { label: 'Published', value: '48', change: '+8', positive: true, icon: Send, color: 'emerald' },
  { label: 'In Pipeline', value: '12', change: '-3', positive: false, icon: RefreshCw, color: 'amber' },
  { label: 'Engagement', value: '4.2%', change: '+0.8%', positive: true, icon: TrendingUp, color: 'violet' },
]

const recentActivities: RecentActivity[] = [
  { id: '1', action: 'Published "AI Trends 2026"', channel: 'Medium', status: 'published', time: '2m ago', icon: CheckCircle2, color: 'text-emerald-400' },
  { id: '2', action: 'Transformed for LinkedIn', channel: 'LinkedIn', status: 'published', time: '5m ago', icon: CheckCircle2, color: 'text-emerald-400' },
  { id: '3', action: 'Processing X Thread', channel: 'X', status: 'pending', time: '8m ago', icon: RefreshCw, color: 'text-cyan-400' },
  { id: '4', action: 'Newsletter draft ready', channel: 'Newsletter', status: 'pending', time: '15m ago', icon: Clock, color: 'text-amber-400' },
  { id: '5', action: 'Brunch publish failed', channel: 'Brunch', status: 'failed', time: '22m ago', icon: AlertCircle, color: 'text-rose-400' },
]

const statusConfig: Record<string, { bg: string, text: string, ring: string }> = {
  published: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20' },
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', ring: 'ring-amber-500/20' },
  failed: { bg: 'bg-rose-500/10', text: 'text-rose-400', ring: 'ring-rose-500/20' },
}
</script>

<template>
  <div class="flex h-screen flex-col bg-slate-950 text-slate-100 overflow-hidden">
    <!-- Main Layout: Sidebar + Content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Compact Icon Sidebar -->
      <aside
        :class="[
          'flex flex-col border-r border-slate-800/50 bg-slate-900/50 backdrop-blur-xl transition-all duration-300',
          sidebarExpanded ? 'w-56' : 'w-16'
        ]"
      >
        <!-- Logo -->
        <div class="flex h-16 items-center border-b border-slate-800/50 px-4">
          <div class="flex items-center gap-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600">
              <Zap :size="16" class="text-white" />
            </div>
            <span
              v-if="sidebarExpanded"
              class="text-sm font-semibold tracking-tight text-white"
            >
              ContentForge
            </span>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 space-y-1 p-2">
          <button
            class="flex w-full items-center gap-3 rounded-lg bg-blue-600/10 px-3 py-2.5 text-blue-400 ring-1 ring-blue-500/20"
            :title="!sidebarExpanded ? 'Dashboard' : ''"
          >
            <Home :size="18" class="shrink-0" />
            <span v-if="sidebarExpanded" class="text-sm font-medium">Dashboard</span>
          </button>
          <button
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200"
            :title="!sidebarExpanded ? 'Materials' : ''"
          >
            <FileText :size="18" class="shrink-0" />
            <span v-if="sidebarExpanded" class="text-sm font-medium">Materials</span>
          </button>
          <button
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200"
            :title="!sidebarExpanded ? 'Pipelines' : ''"
          >
            <Layers :size="18" class="shrink-0" />
            <span v-if="sidebarExpanded" class="text-sm font-medium">Pipelines</span>
          </button>
          <button
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200"
            :title="!sidebarExpanded ? 'Analytics' : ''"
          >
            <BarChart3 :size="18" class="shrink-0" />
            <span v-if="sidebarExpanded" class="text-sm font-medium">Analytics</span>
          </button>
        </nav>

        <!-- Bottom Actions -->
        <div class="space-y-1 border-t border-slate-800/50 p-2">
          <button
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-500 transition-colors hover:bg-slate-800/50 hover:text-slate-300"
            :title="!sidebarExpanded ? 'Settings' : ''"
          >
            <Settings :size="18" class="shrink-0" />
            <span v-if="sidebarExpanded" class="text-sm font-medium">Settings</span>
          </button>
          <button
            @click="sidebarExpanded = !sidebarExpanded"
            class="flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-slate-500 transition-colors hover:bg-slate-800/50 hover:text-slate-300"
            :title="sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'"
          >
            <ChevronRight
              :size="18"
              class="shrink-0 transition-transform duration-300"
              :class="{ 'rotate-180': sidebarExpanded }"
            />
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 overflow-y-auto">
        <!-- Top Bar -->
        <div class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/50 bg-slate-950/80 px-6 backdrop-blur-xl">
          <div class="flex items-center gap-4">
            <h1 class="text-sm font-semibold text-white">Dashboard</h1>
          </div>

          <div class="flex items-center gap-3">
            <!-- Search -->
            <button class="flex items-center gap-2 rounded-lg bg-slate-900/50 px-3 py-2 ring-1 ring-slate-800/50 transition-all hover:bg-slate-800/50">
              <Search :size="14" class="text-slate-500" />
              <span class="text-xs text-slate-500">Search materials...</span>
              <kbd class="ml-2 rounded bg-slate-800/50 px-1.5 py-0.5 text-[10px] text-slate-600">⌘K</kbd>
            </button>

            <!-- Notifications -->
            <button class="relative rounded-lg p-2 text-slate-500 ring-1 ring-slate-800/50 transition-colors hover:bg-slate-800/50 hover:text-slate-300">
              <Bell :size="16" />
              <span class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 ring-2 ring-slate-950"></span>
            </button>

            <!-- Create Button -->
            <button class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/30">
              <Plus :size="16" />
              <span>Create</span>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Stats Grid -->
          <div class="grid grid-cols-4 gap-4">
            <div
              v-for="stat in stats"
              :key="stat.label"
              class="group relative overflow-hidden rounded-xl bg-slate-900/50 p-5 ring-1 ring-slate-800/50 transition-all hover:bg-slate-800/50"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="mb-1 text-xs font-medium text-slate-500">{{ stat.label }}</div>
                  <div class="mb-2 text-2xl font-bold tracking-tight">{{ stat.value }}</div>
                  <div class="flex items-center gap-1.5">
                    <component
                      :is="stat.positive ? TrendingUp : TrendingDown"
                      :size="14"
                      :class="stat.positive ? 'text-emerald-400' : 'text-rose-400'"
                    />
                    <span
                      :class="['text-xs font-semibold', stat.positive ? 'text-emerald-400' : 'text-rose-400']"
                    >
                      {{ stat.change }}
                    </span>
                    <span class="text-xs text-slate-600">vs last week</span>
                  </div>
                </div>
                <div
                  :class="['rounded-lg p-2', `bg-${stat.color}-500/10 text-${stat.color}-400`]"
                >
                  <component :is="stat.icon" :size="18" />
                </div>
              </div>
            </div>
          </div>

          <!-- Main Grid: Recent Activity + Quick Stats -->
          <div class="grid grid-cols-3 gap-6">
            <!-- Recent Activity (2 cols) -->
            <div class="col-span-2 space-y-4">
              <!-- Section Header -->
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-white">Recent Activity</h2>
                <div class="flex items-center gap-2">
                  <button class="inline-flex items-center gap-1.5 rounded-lg bg-slate-900/50 px-3 py-1.5 text-xs text-slate-400 ring-1 ring-slate-800/50 hover:bg-slate-800/50">
                    <Filter :size="12" />
                    Filter
                  </button>
                  <button class="inline-flex items-center gap-1.5 rounded-lg bg-slate-900/50 px-3 py-1.5 text-xs text-slate-400 ring-1 ring-slate-800/50 hover:bg-slate-800/50">
                    <Calendar :size="12" />
                    7 days
                  </button>
                </div>
              </div>

              <!-- Activity Cards -->
              <div class="overflow-hidden rounded-xl bg-slate-900/50 ring-1 ring-slate-800/50">
                <div class="divide-y divide-slate-800/30">
                  <div
                    v-for="activity in recentActivities"
                    :key="activity.id"
                    class="flex items-center justify-between p-4 transition-colors hover:bg-slate-800/30"
                  >
                    <div class="flex items-center gap-4">
                      <component
                        :is="activity.icon"
                        :size="16"
                        :class="[activity.color, activity.status === 'pending' ? 'animate-spin' : '']"
                      />
                      <div>
                        <div class="text-sm text-slate-300">{{ activity.action }}</div>
                        <div class="text-xs text-slate-600">{{ activity.channel }}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-4">
                      <span class="text-xs text-slate-600">{{ activity.time }}</span>
                      <div
                        :class="[
                          'inline-flex items-center gap-1 rounded-md px-2 py-0.5 ring-1',
                          statusConfig[activity.status]?.bg,
                          statusConfig[activity.status]?.text,
                          statusConfig[activity.status]?.ring
                        ]"
                      >
                        <span class="h-1 w-1 rounded-full bg-current"></span>
                        <span class="text-xs">{{ activity.status }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sidebar Stats (1 col) -->
            <div class="space-y-4">
              <!-- Pipeline Health -->
              <div class="overflow-hidden rounded-xl bg-gradient-to-br from-blue-600/10 to-cyan-600/10 p-4 ring-1 ring-blue-500/20">
                <div class="mb-3 flex items-center gap-2">
                  <div class="rounded-lg bg-blue-500/20 p-1.5">
                    <GitBranch :size="14" class="text-blue-400" />
                  </div>
                  <span class="text-xs font-semibold text-white">Pipeline Health</span>
                </div>
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-400">Active Pipelines</span>
                    <span class="font-semibold text-white">12</span>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-400">Success Rate</span>
                    <span class="font-semibold text-emerald-400">94.2%</span>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-400">Avg. Processing</span>
                    <span class="font-semibold text-cyan-400">2.4min</span>
                  </div>
                </div>
              </div>

              <!-- Top Channels -->
              <div class="overflow-hidden rounded-xl bg-slate-900/50 ring-1 ring-slate-800/50">
                <div class="border-b border-slate-800/50 px-4 py-3">
                  <h3 class="text-sm font-semibold text-white">Top Channels</h3>
                </div>
                <div class="divide-y divide-slate-800/30 p-2">
                  <div class="flex items-center justify-between py-2">
                    <div class="flex items-center gap-2">
                      <Globe :size="12" class="text-blue-400" />
                      <span class="text-xs text-slate-300">Medium</span>
                    </div>
                    <span class="text-xs font-semibold text-slate-400">124</span>
                  </div>
                  <div class="flex items-center justify-between py-2">
                    <div class="flex items-center gap-2">
                      <Users :size="12" class="text-cyan-400" />
                      <span class="text-xs text-slate-300">LinkedIn</span>
                    </div>
                    <span class="text-xs font-semibold text-slate-400">98</span>
                  </div>
                  <div class="flex items-center justify-between py-2">
                    <div class="flex items-center gap-2">
                      <Send :size="12" class="text-violet-400" />
                      <span class="text-xs text-slate-300">X</span>
                    </div>
                    <span class="text-xs font-semibold text-slate-400">87</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Bottom Status Bar - Pipeline Progress -->
    <div class="flex h-14 items-center justify-between border-t border-slate-800/50 bg-slate-900/80 px-4 backdrop-blur-xl">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600">
          <RefreshCw :size="14" class="animate-spin text-white" />
        </div>
        <div class="min-w-0">
          <div class="text-xs font-medium text-white line-clamp-1">Processing content pipeline</div>
          <div class="text-[10px] text-slate-500">Optimizing for LinkedIn (3/5)</div>
        </div>
      </div>

      <div class="flex flex-1 items-center gap-3 px-8">
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800/50">
          <div
            class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style="width: 65%"
          ></div>
        </div>
        <span class="text-xs font-semibold tabular-nums text-slate-500">65%</span>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-1.5">
          <Layers :size="12" class="text-slate-500" />
          <span class="text-xs text-slate-400">2/5</span>
        </div>
      </div>
    </div>
  </div>
</template>
