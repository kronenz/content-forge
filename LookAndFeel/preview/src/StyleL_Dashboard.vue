<script setup lang="ts">
// Style L: Production Ready - ContentForge Design System
// Immersive web app with comprehensive design language
import {
  Home,
  FileText,
  Layers,
  BarChart3,
  Settings,
  Bell,
  Search,
  Plus,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Send,
  Zap,
  GitBranch,
  Users,
  Globe,
  ChevronRight,
  Filter,
  Calendar,
  MoreHorizontal,
  Play,
  Pause,
  SkipForward,
  X as XIcon
} from 'lucide-vue-next'
import { ref } from 'vue'

const sidebarExpanded = ref(false)

// Analytics stats with trend data
const stats = [
  {
    label: 'Total Views',
    value: '847.3K',
    change: '+18.2%',
    trend: 'up',
    icon: Eye,
    color: 'blue'
  },
  {
    label: 'Published',
    value: '234',
    change: '+12',
    trend: 'up',
    icon: Send,
    color: 'emerald'
  },
  {
    label: 'Processing',
    value: '18',
    change: '-4',
    trend: 'down',
    icon: RefreshCw,
    color: 'amber'
  },
  {
    label: 'Avg. Score',
    value: '8.2',
    change: '+0.4',
    trend: 'up',
    icon: TrendingUp,
    color: 'violet'
  },
]

// Materials with rich metadata
const materials = [
  {
    id: '1',
    title: 'The Future of AI Content Creation',
    source: 'TechCrunch',
    score: 9.2,
    status: 'published',
    channels: ['Medium', 'LinkedIn', 'X', 'Newsletter'],
    views: '28.4K',
    engagement: '6.8%',
    publishedAt: '2h ago',
    thumbnail: 'gradient-1'
  },
  {
    id: '2',
    title: 'Building Scalable Content Pipelines',
    source: 'Engineering Blog',
    score: 8.7,
    status: 'processing',
    channels: ['Medium', 'Dev.to', 'Hashnode'],
    views: '-',
    engagement: '-',
    publishedAt: 'Processing',
    thumbnail: 'gradient-2'
  },
  {
    id: '3',
    title: '10 Marketing Automation Trends',
    source: 'Marketing Weekly',
    score: 8.9,
    status: 'published',
    channels: ['LinkedIn', 'X', 'Medium', 'Newsletter', 'Brunch'],
    views: '45.2K',
    engagement: '8.2%',
    publishedAt: '5h ago',
    thumbnail: 'gradient-3'
  },
  {
    id: '4',
    title: 'Content Strategy for 2026',
    source: 'Content Marketing Institute',
    score: 7.8,
    status: 'scheduled',
    channels: ['Medium', 'LinkedIn'],
    views: '-',
    engagement: '-',
    publishedAt: 'Tomorrow 9:00 AM',
    thumbnail: 'gradient-4'
  },
  {
    id: '5',
    title: 'Multi-Channel Publishing Guide',
    source: 'Blog Network',
    score: 8.4,
    status: 'published',
    channels: ['Medium', 'Substack', 'Ghost'],
    views: '18.7K',
    engagement: '5.4%',
    publishedAt: '1d ago',
    thumbnail: 'gradient-5'
  },
  {
    id: '6',
    title: 'Social Media Analytics Deep Dive',
    source: 'Data Science Weekly',
    score: 9.1,
    status: 'published',
    channels: ['LinkedIn', 'Medium', 'X', 'Newsletter'],
    views: '52.1K',
    engagement: '9.1%',
    publishedAt: '1d ago',
    thumbnail: 'gradient-6'
  },
]

// Recent activity feed
const activities = [
  {
    type: 'publish',
    message: 'Published to Medium',
    material: 'AI Content Creation',
    time: '3m ago',
    icon: CheckCircle2,
    color: 'text-emerald-400'
  },
  {
    type: 'transform',
    message: 'LinkedIn optimization complete',
    material: 'Marketing Automation',
    time: '8m ago',
    icon: CheckCircle2,
    color: 'text-emerald-400'
  },
  {
    type: 'processing',
    message: 'Processing X thread',
    material: 'Content Pipelines',
    time: '12m ago',
    icon: RefreshCw,
    color: 'text-cyan-400'
  },
  {
    type: 'scheduled',
    message: 'Scheduled for tomorrow',
    material: 'Content Strategy 2026',
    time: '18m ago',
    icon: Clock,
    color: 'text-amber-400'
  },
  {
    type: 'error',
    message: 'Brunch publish failed',
    material: 'Multi-Channel Guide',
    time: '22m ago',
    icon: AlertCircle,
    color: 'text-rose-400'
  },
]

// Pipeline status for bottom bar
const currentPipeline = {
  name: 'Content Transformation Pipeline',
  material: 'Building Scalable Content Pipelines',
  progress: 65,
  stage: 'Optimizing for LinkedIn (3/5)',
  channels: ['Medium', 'LinkedIn', 'Dev.to', 'Hashnode', 'X'],
  completedChannels: 2
}

const statusConfig: Record<string, { bg: string, text: string, ring: string }> = {
  published: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20' },
  processing: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', ring: 'ring-cyan-500/20' },
  scheduled: { bg: 'bg-amber-500/10', text: 'text-amber-400', ring: 'ring-amber-500/20' },
  failed: { bg: 'bg-rose-500/10', text: 'text-rose-400', ring: 'ring-rose-500/20' },
}

const thumbnailGradients: Record<string, string> = {
  'gradient-1': 'from-blue-600 via-blue-700 to-indigo-700',
  'gradient-2': 'from-cyan-600 via-cyan-700 to-teal-700',
  'gradient-3': 'from-violet-600 via-violet-700 to-purple-700',
  'gradient-4': 'from-amber-600 via-amber-700 to-orange-700',
  'gradient-5': 'from-emerald-600 via-emerald-700 to-green-700',
  'gradient-6': 'from-rose-600 via-rose-700 to-pink-700',
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
          <!-- Expand/Collapse Toggle -->
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
            <router-link
              to="/styles"
              class="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              <ArrowLeft :size="14" />
              <span>Back to Styles</span>
            </router-link>
            <div class="h-4 w-px bg-slate-800/50"></div>
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
                      :is="stat.trend === 'up' ? TrendingUp : TrendingDown"
                      :size="14"
                      :class="stat.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'"
                    />
                    <span
                      :class="['text-xs font-semibold', stat.trend === 'up' ? 'text-emerald-400' : 'text-rose-400']"
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

          <!-- Main Grid: Materials + Activity -->
          <div class="grid grid-cols-3 gap-6">
            <!-- Materials List (2 cols) -->
            <div class="col-span-2 space-y-4">
              <!-- Section Header -->
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-white">Recent Materials</h2>
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

              <!-- Materials Cards -->
              <div class="space-y-3">
                <div
                  v-for="material in materials"
                  :key="material.id"
                  class="group relative overflow-hidden rounded-xl bg-slate-900/50 ring-1 ring-slate-800/50 transition-all hover:bg-slate-800/50 hover:ring-slate-700/50"
                >
                  <div class="flex gap-4 p-4">
                    <!-- Thumbnail -->
                    <div
                      :class="['flex h-20 w-20 shrink-0 items-center justify-center rounded-lg', `bg-gradient-to-br ${thumbnailGradients[material.thumbnail]}`]"
                    >
                      <FileText :size="24" class="text-white/80" />
                    </div>

                    <!-- Content -->
                    <div class="flex flex-1 flex-col">
                      <div class="mb-1 flex items-start justify-between">
                        <h3 class="text-sm font-semibold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                          {{ material.title }}
                        </h3>
                        <button class="rounded-lg p-1 text-slate-600 opacity-0 transition-opacity hover:bg-slate-700/50 hover:text-slate-400 group-hover:opacity-100">
                          <MoreHorizontal :size="16" />
                        </button>
                      </div>

                      <div class="mb-2 text-xs text-slate-500">{{ material.source }}</div>

                      <div class="mt-auto flex items-center gap-3 text-xs">
                        <div
                          :class="[
                            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 ring-1',
                            statusConfig[material.status]?.bg,
                            statusConfig[material.status]?.text,
                            statusConfig[material.status]?.ring
                          ]"
                        >
                          <span class="h-1 w-1 rounded-full bg-current"></span>
                          {{ material.status }}
                        </div>
                        <div class="flex items-center gap-1 text-slate-600">
                          <Eye :size="12" />
                          {{ material.views }}
                        </div>
                        <div class="flex items-center gap-1 text-slate-600">
                          <TrendingUp :size="12" />
                          {{ material.engagement }}
                        </div>
                        <div class="flex items-center gap-1 text-slate-600">
                          <Clock :size="12" />
                          {{ material.publishedAt }}
                        </div>
                      </div>

                      <!-- Channels -->
                      <div class="mt-2 flex gap-1.5">
                        <div
                          v-for="channel in material.channels.slice(0, 4)"
                          :key="channel"
                          class="rounded bg-slate-800/50 px-2 py-0.5 text-[10px] text-slate-400"
                        >
                          {{ channel }}
                        </div>
                        <div
                          v-if="material.channels.length > 4"
                          class="rounded bg-slate-800/50 px-2 py-0.5 text-[10px] text-slate-500"
                        >
                          +{{ material.channels.length - 4 }}
                        </div>
                      </div>
                    </div>

                    <!-- Score Badge -->
                    <div class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-800/50">
                      <div class="text-xs font-bold text-amber-400">{{ material.score }}</div>
                      <div class="text-[9px] text-slate-600">score</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Activity Sidebar (1 col) -->
            <div class="space-y-4">
              <!-- Activity Feed -->
              <div class="overflow-hidden rounded-xl bg-slate-900/50 ring-1 ring-slate-800/50">
                <div class="flex items-center justify-between border-b border-slate-800/50 px-4 py-3">
                  <h3 class="text-sm font-semibold text-white">Live Activity</h3>
                  <button class="text-xs text-blue-400 hover:text-blue-300">View all</button>
                </div>
                <div class="divide-y divide-slate-800/30">
                  <div
                    v-for="(activity, idx) in activities"
                    :key="idx"
                    class="flex items-start gap-3 p-3 transition-colors hover:bg-slate-800/30"
                  >
                    <component
                      :is="activity.icon"
                      :size="14"
                      :class="['mt-0.5 shrink-0', activity.color, activity.type === 'processing' ? 'animate-spin' : '']"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="text-xs text-slate-300">{{ activity.message }}</div>
                      <div class="text-[10px] text-slate-600 line-clamp-1">{{ activity.material }}</div>
                      <div class="mt-1 text-[10px] text-slate-700">{{ activity.time }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quick Stats Card -->
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

              <!-- Channel Overview -->
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
      <!-- Pipeline Info -->
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600">
          <RefreshCw :size="14" class="animate-spin text-white" />
        </div>
        <div class="min-w-0">
          <div class="text-xs font-medium text-white line-clamp-1">{{ currentPipeline.material }}</div>
          <div class="text-[10px] text-slate-500">{{ currentPipeline.stage }}</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="flex flex-1 items-center gap-3 px-8">
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800/50">
          <div
            class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            :style="{ width: currentPipeline.progress + '%' }"
          ></div>
        </div>
        <span class="text-xs font-semibold tabular-nums text-slate-500">{{ currentPipeline.progress }}%</span>
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-2">
        <button class="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-800/50 hover:text-slate-300" title="Pause pipeline">
          <Pause :size="14" />
        </button>
        <button class="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-800/50 hover:text-slate-300" title="Skip current">
          <SkipForward :size="14" />
        </button>
        <button class="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-800/50 hover:text-slate-300" title="Stop pipeline">
          <XIcon :size="14" />
        </button>
        <div class="ml-2 flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-1.5">
          <Layers :size="12" class="text-slate-500" />
          <span class="text-xs text-slate-400">{{ currentPipeline.completedChannels }}/{{ currentPipeline.channels.length }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
