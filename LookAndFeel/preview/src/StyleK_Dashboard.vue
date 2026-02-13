<script setup lang="ts">
// Style K: Web App — Suno.com inspired dark app shell
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
  Search,
  Plus,
  Home,
  Compass,
  Library,
  Bell,
  User,
  Play,
  Pause,
  SkipForward,
  Loader2,
  ChevronRight,
  Grid3x3,
  LayoutList
} from 'lucide-vue-next'

const stats = [
  { label: 'Views', value: '24.5K', change: '+12.5%', positive: true },
  { label: 'Published', value: '48', change: '+8', positive: true },
  { label: 'Processing', value: '12', change: '-3', positive: false },
  { label: 'Engagement', value: '4.2%', change: '+0.8%', positive: true },
]

const recentMaterials = [
  { id: '1', title: 'AI Trends 2026', source: 'techblog', score: 8.5, status: 'published', tags: ['AI', 'Trends'], gradient: 'from-violet-600 to-indigo-600' },
  { id: '2', title: 'Content Automation Guide', source: 'medium', score: 7.8, status: 'processing', tags: ['Guide', 'Automation'], gradient: 'from-cyan-600 to-blue-600' },
  { id: '3', title: 'Marketing in the AI Era', source: 'newsletter', score: 9.1, status: 'published', tags: ['Marketing', 'AI'], gradient: 'from-pink-600 to-rose-600' },
  { id: '4', title: 'Building Content Pipelines', source: 'blog', score: 6.4, status: 'queued', tags: ['Technical', 'Pipeline'], gradient: 'from-amber-600 to-orange-600' },
  { id: '5', title: 'Social Media Strategy 2026', source: 'research', score: 8.9, status: 'published', tags: ['Social', 'Strategy'], gradient: 'from-emerald-600 to-teal-600' },
  { id: '6', title: 'Video Content Best Practices', source: 'youtube', score: 7.2, status: 'queued', tags: ['Video', 'Best Practices'], gradient: 'from-purple-600 to-violet-600' },
]

const activities = [
  { action: 'Published to Medium', time: '2m', status: 'done' },
  { action: 'LinkedIn transform', time: '5m', status: 'done' },
  { action: 'X Thread processing', time: '8m', status: 'active' },
  { action: 'Newsletter queue', time: '15m', status: 'pending' },
]

const statusDot: Record<string, string> = {
  published: 'bg-emerald-400',
  processing: 'bg-cyan-400 animate-pulse',
  queued: 'bg-slate-500',
}
</script>

<template>
  <div class="flex h-screen flex-col bg-[#18181B] text-white overflow-hidden">
    <!-- App Shell: Sidebar + Main -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left Sidebar — compact, icon-heavy -->
      <aside class="flex w-16 flex-col items-center border-r border-white/5 bg-[#111113] py-4">
        <div class="mb-6 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500">
          <Sparkles :size="16" class="text-white" />
        </div>

        <nav class="flex flex-1 flex-col items-center gap-1">
          <button class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white" title="Home">
            <Home :size="18" />
          </button>
          <button class="flex h-10 w-10 items-center justify-center rounded-xl text-white/40 hover:bg-white/5 hover:text-white/70" title="Explore">
            <Compass :size="18" />
          </button>
          <button class="flex h-10 w-10 items-center justify-center rounded-xl text-white/40 hover:bg-white/5 hover:text-white/70" title="Materials">
            <FileText :size="18" />
          </button>
          <button class="flex h-10 w-10 items-center justify-center rounded-xl text-white/40 hover:bg-white/5 hover:text-white/70" title="Pipelines">
            <Layers :size="18" />
          </button>
          <button class="flex h-10 w-10 items-center justify-center rounded-xl text-white/40 hover:bg-white/5 hover:text-white/70" title="Library">
            <Library :size="18" />
          </button>
          <button class="flex h-10 w-10 items-center justify-center rounded-xl text-white/40 hover:bg-white/5 hover:text-white/70" title="Analytics">
            <TrendingUp :size="18" />
          </button>
        </nav>

        <div class="flex flex-col items-center gap-1">
          <button class="flex h-10 w-10 items-center justify-center rounded-xl text-white/40 hover:bg-white/5 hover:text-white/70" title="Settings">
            <Settings :size="18" />
          </button>
          <div class="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-pink-400"></div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto">
        <!-- Top Bar -->
        <div class="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-[#18181B]/80 px-6 py-3 backdrop-blur-xl">
          <div class="flex items-center gap-4">
            <router-link to="/styles" class="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60">
              <ArrowLeft :size="14" />
              Styles
            </router-link>
            <span class="text-white/10">|</span>
            <h1 class="text-sm font-semibold">Dashboard</h1>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 text-sm text-white/30">
              <Search :size="14" />
              <span>Search materials...</span>
              <kbd class="ml-4 rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/20">Ctrl K</kbd>
            </div>
            <button class="relative rounded-xl p-2 text-white/40 hover:bg-white/5">
              <Bell :size="16" />
              <span class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-pink-500"></span>
            </button>
          </div>
        </div>

        <div class="p-6">
          <!-- Stats Row -->
          <div class="mb-6 grid grid-cols-4 gap-3">
            <div
              v-for="stat in stats"
              :key="stat.label"
              class="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/5"
            >
              <div class="text-[11px] font-medium text-white/30">{{ stat.label }}</div>
              <div class="mt-1 text-xl font-bold tabular-nums">{{ stat.value }}</div>
              <div class="mt-1 flex items-center gap-1">
                <component
                  :is="stat.positive ? ArrowUpRight : ArrowDownRight"
                  :size="12"
                  :class="stat.positive ? 'text-emerald-400' : 'text-pink-400'"
                />
                <span :class="stat.positive ? 'text-emerald-400' : 'text-pink-400'" class="text-xs font-medium">
                  {{ stat.change }}
                </span>
              </div>
            </div>
          </div>

          <!-- Create CTA -->
          <div class="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600/20 via-pink-600/20 to-cyan-600/20 p-[1px]">
            <div class="flex items-center justify-between rounded-2xl bg-[#18181B] px-6 py-4">
              <div>
                <h2 class="text-sm font-semibold">Create New Content</h2>
                <p class="text-xs text-white/40">Drop a URL, paste text, or upload a file to start transforming</p>
              </div>
              <button class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-shadow">
                <Plus :size="16" />
                Create
              </button>
            </div>
          </div>

          <!-- Section header -->
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-white/70">Recent Materials</h2>
            <div class="flex items-center gap-1">
              <button class="rounded-lg bg-white/10 p-1.5 text-white/60">
                <Grid3x3 :size="14" />
              </button>
              <button class="rounded-lg p-1.5 text-white/30 hover:text-white/60">
                <LayoutList :size="14" />
              </button>
            </div>
          </div>

          <!-- Material Cards Grid — app-like card UI -->
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="material in recentMaterials"
              :key="material.id"
              class="group cursor-pointer overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/5 transition-all hover:bg-white/[0.06] hover:ring-white/10"
            >
              <!-- Card gradient header -->
              <div :class="`bg-gradient-to-br ${material.gradient}`" class="relative h-28 p-4">
                <div class="absolute right-3 top-3">
                  <span :class="statusDot[material.status]" class="inline-block h-2 w-2 rounded-full"></span>
                </div>
                <div class="absolute bottom-3 left-3 right-3">
                  <h3 class="text-sm font-semibold text-white line-clamp-2">{{ material.title }}</h3>
                </div>
              </div>
              <!-- Card body -->
              <div class="p-3.5">
                <div class="mb-2 flex items-center justify-between text-xs">
                  <span class="text-white/30">{{ material.source }}</span>
                  <span class="font-semibold text-amber-400">{{ material.score }}</span>
                </div>
                <div class="flex gap-1">
                  <span
                    v-for="tag in material.tags"
                    :key="tag"
                    class="rounded-lg bg-white/5 px-2 py-0.5 text-[10px] text-white/40"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Activity sidebar-like section -->
          <div class="mt-6 rounded-2xl bg-white/[0.03] ring-1 ring-white/5">
            <div class="flex items-center justify-between border-b border-white/5 px-5 py-3">
              <h2 class="text-xs font-semibold text-white/50">Live Activity</h2>
              <button class="text-xs text-violet-400 hover:text-violet-300">View All</button>
            </div>
            <div class="divide-y divide-white/[0.03]">
              <div
                v-for="(a, i) in activities"
                :key="i"
                class="flex items-center justify-between px-5 py-3"
              >
                <div class="flex items-center gap-3">
                  <span
                    :class="a.status === 'done' ? 'text-emerald-400' : a.status === 'active' ? 'text-cyan-400' : 'text-white/20'"
                  >
                    <component :is="a.status === 'done' ? CheckCircle2 : a.status === 'active' ? Loader2 : Clock" :size="14" :class="a.status === 'active' ? 'animate-spin' : ''" />
                  </span>
                  <span class="text-xs text-white/60">{{ a.action }}</span>
                </div>
                <span class="text-[10px] tabular-nums text-white/20">{{ a.time }} ago</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Bottom Status Bar — like Suno's player bar -->
    <div class="flex h-16 items-center justify-between border-t border-white/5 bg-[#111113] px-4">
      <!-- Now processing -->
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
          <RefreshCw :size="14" class="animate-spin text-white" />
        </div>
        <div>
          <div class="text-xs font-medium text-white/80">Processing: X Thread Pipeline</div>
          <div class="text-[10px] text-white/30">3 of 5 channels complete</div>
        </div>
      </div>

      <!-- Progress -->
      <div class="flex flex-1 items-center gap-4 px-8">
        <div class="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
          <div class="h-full w-3/5 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"></div>
        </div>
        <span class="text-[10px] tabular-nums text-white/30">60%</span>
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-2">
        <button class="rounded-lg p-2 text-white/40 hover:text-white/70">
          <Pause :size="16" />
        </button>
        <button class="rounded-lg p-2 text-white/40 hover:text-white/70">
          <SkipForward :size="16" />
        </button>
        <div class="ml-2 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-[11px] text-white/40">
          <Layers :size="12" />
          4 queued
        </div>
      </div>
    </div>
  </div>
</template>
