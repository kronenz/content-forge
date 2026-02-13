<script setup lang="ts">
import { onMounted } from 'vue';
import {
  Eye,
  TrendingUp,
  Users,
  Send,
  Plus,
  BarChart3,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Play,
} from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { useDashboardStore } from '@/stores/dashboard-store';
import type { RecentPublication } from '@/stores/dashboard-store';

const router = useRouter();
const dashboardStore = useDashboardStore();

onMounted(() => {
  dashboardStore.fetchDashboardData();
});

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function publicationStatusConfig(status: RecentPublication['status']): { bg: string; text: string; label: string } {
  const map: Record<RecentPublication['status'], { bg: string; text: string; label: string }> = {
    published: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Published' },
    scheduled: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Scheduled' },
    failed: { bg: 'bg-rose-500/10', text: 'text-rose-400', label: 'Failed' },
  };
  return map[status];
}

const dateRangeOptions: { value: '7d' | '30d' | '90d'; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

const channelOptions = [
  { value: 'all', label: 'All Channels' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
];
</script>

<template>
  <div class="h-full">
    <!-- Top Bar -->
    <div class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/50 bg-slate-950/80 px-4 sm:px-6 backdrop-blur-xl">
      <div class="flex items-center gap-3">
        <BarChart3 :size="18" class="text-blue-400" />
        <h1 class="text-sm font-semibold text-white">Dashboard</h1>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="router.push('/')"
          class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/30 sm:px-4 sm:text-sm"
        >
          <Plus :size="14" />
          <span class="hidden sm:inline">New Project</span>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4 sm:p-6 space-y-6">
      <!-- Loading -->
      <div v-if="dashboardStore.loading" class="flex items-center justify-center py-20">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
      </div>

      <template v-else-if="dashboardStore.metrics">
        <!-- Filter Bar -->
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1 rounded-lg bg-slate-900/50 p-1 ring-1 ring-slate-800/50">
              <button
                v-for="opt in dateRangeOptions"
                :key="opt.value"
                @click="dashboardStore.dateRange = opt.value"
                :class="[
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  dashboardStore.dateRange === opt.value
                    ? 'bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/20'
                    : 'text-slate-500 hover:text-slate-300',
                ]"
              >
                {{ opt.label }}
              </button>
            </div>
            <Calendar :size="14" class="text-slate-600 hidden sm:block" />
          </div>

          <div class="flex items-center gap-2">
            <Filter :size="14" class="text-slate-600" />
            <select
              v-model="dashboardStore.channelFilter"
              class="rounded-lg bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300 ring-1 ring-slate-800/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            >
              <option v-for="ch in channelOptions" :key="ch.value" :value="ch.value">
                {{ ch.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Metrics Cards -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Total Views -->
          <div class="rounded-xl bg-slate-900/50 p-5 ring-1 ring-slate-800/50 transition-colors hover:bg-slate-800/30">
            <div class="flex items-center justify-between mb-3">
              <div class="rounded-lg bg-blue-500/10 p-2">
                <Eye :size="16" class="text-blue-400" />
              </div>
              <div
                :class="[
                  'flex items-center gap-0.5 text-xs font-medium',
                  dashboardStore.metrics.totalViewsChange >= 0 ? 'text-emerald-400' : 'text-rose-400',
                ]"
              >
                <ArrowUpRight v-if="dashboardStore.metrics.totalViewsChange >= 0" :size="12" />
                <ArrowDownRight v-else :size="12" />
                {{ Math.abs(dashboardStore.metrics.totalViewsChange) }}%
              </div>
            </div>
            <div class="text-2xl font-bold text-white tabular-nums">
              {{ formatNumber(dashboardStore.metrics.totalViews) }}
            </div>
            <div class="mt-1 text-xs text-slate-500">Total Views</div>
          </div>

          <!-- Engagement Rate -->
          <div class="rounded-xl bg-slate-900/50 p-5 ring-1 ring-slate-800/50 transition-colors hover:bg-slate-800/30">
            <div class="flex items-center justify-between mb-3">
              <div class="rounded-lg bg-cyan-500/10 p-2">
                <TrendingUp :size="16" class="text-cyan-400" />
              </div>
              <div
                :class="[
                  'flex items-center gap-0.5 text-xs font-medium',
                  dashboardStore.metrics.engagementChange >= 0 ? 'text-emerald-400' : 'text-rose-400',
                ]"
              >
                <ArrowUpRight v-if="dashboardStore.metrics.engagementChange >= 0" :size="12" />
                <ArrowDownRight v-else :size="12" />
                {{ Math.abs(dashboardStore.metrics.engagementChange) }}%
              </div>
            </div>
            <div class="text-2xl font-bold text-white tabular-nums">
              {{ dashboardStore.metrics.engagementRate }}%
            </div>
            <div class="mt-1 text-xs text-slate-500">Engagement Rate</div>
          </div>

          <!-- Subscribers -->
          <div class="rounded-xl bg-slate-900/50 p-5 ring-1 ring-slate-800/50 transition-colors hover:bg-slate-800/30">
            <div class="flex items-center justify-between mb-3">
              <div class="rounded-lg bg-violet-500/10 p-2">
                <Users :size="16" class="text-violet-400" />
              </div>
              <div
                :class="[
                  'flex items-center gap-0.5 text-xs font-medium',
                  dashboardStore.metrics.subscribersChange >= 0 ? 'text-emerald-400' : 'text-rose-400',
                ]"
              >
                <ArrowUpRight v-if="dashboardStore.metrics.subscribersChange >= 0" :size="12" />
                <ArrowDownRight v-else :size="12" />
                {{ Math.abs(dashboardStore.metrics.subscribersChange) }}%
              </div>
            </div>
            <div class="text-2xl font-bold text-white tabular-nums">
              {{ formatNumber(dashboardStore.metrics.totalSubscribers) }}
            </div>
            <div class="mt-1 text-xs text-slate-500">Total Subscribers</div>
          </div>

          <!-- Published -->
          <div class="rounded-xl bg-slate-900/50 p-5 ring-1 ring-slate-800/50 transition-colors hover:bg-slate-800/30">
            <div class="flex items-center justify-between mb-3">
              <div class="rounded-lg bg-emerald-500/10 p-2">
                <Send :size="16" class="text-emerald-400" />
              </div>
              <div class="flex items-center gap-0.5 text-xs font-medium text-emerald-400">
                <ArrowUpRight :size="12" />
                {{ dashboardStore.metrics.publishedChange }}%
              </div>
            </div>
            <div class="text-2xl font-bold text-white tabular-nums">
              {{ dashboardStore.metrics.totalPublished }}
            </div>
            <div class="mt-1 text-xs text-slate-500">Published Videos</div>
          </div>
        </div>

        <!-- Charts + Channel Performance -->
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <!-- Weekly Views Chart Area -->
          <div class="lg:col-span-2 rounded-xl bg-slate-900/50 p-5 ring-1 ring-slate-800/50">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-semibold text-white">Weekly Views</h2>
              <BarChart3 :size="14" class="text-slate-600" />
            </div>
            <!-- Chart Placeholder: styled bar visualization -->
            <div class="flex items-end gap-2 h-40">
              <div
                v-for="(val, idx) in dashboardStore.metrics.weeklyViews"
                :key="idx"
                class="flex-1 flex flex-col items-center gap-1"
              >
                <span class="text-[10px] text-slate-600 tabular-nums">{{ formatNumber(val) }}</span>
                <div
                  class="w-full rounded-t-md bg-gradient-to-t from-blue-600/40 to-blue-500/20 transition-all duration-300"
                  :style="{ height: `${(val / Math.max(...dashboardStore.metrics.weeklyViews)) * 120}px` }"
                />
                <span class="text-[10px] text-slate-600">
                  {{ ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx] }}
                </span>
              </div>
            </div>
          </div>

          <!-- Channel Performance -->
          <div class="rounded-xl bg-slate-900/50 p-5 ring-1 ring-slate-800/50">
            <h2 class="text-sm font-semibold text-white mb-4">Channel Performance</h2>
            <div class="space-y-4">
              <div
                v-for="channel in dashboardStore.metrics.channels"
                :key="channel.name"
                class="space-y-2"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-300">{{ channel.name }}</span>
                  <span class="text-xs text-emerald-400">+{{ channel.growth }}%</span>
                </div>
                <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/50">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                    :style="{ width: `${(channel.views / dashboardStore.metrics.totalViews) * 100}%` }"
                  />
                </div>
                <div class="flex items-center justify-between text-[10px] text-slate-600">
                  <span>{{ formatNumber(channel.views) }} views</span>
                  <span>{{ formatNumber(channel.subscribers) }} subs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Publications -->
        <div class="rounded-xl bg-slate-900/50 ring-1 ring-slate-800/50">
          <div class="flex items-center justify-between border-b border-slate-800/50 p-5">
            <h2 class="text-sm font-semibold text-white">Recent Publications</h2>
            <button class="text-xs text-blue-400 hover:text-blue-300 transition-colors">View All</button>
          </div>
          <div class="divide-y divide-slate-800/30">
            <div
              v-for="pub in dashboardStore.metrics.recentPublications"
              :key="pub.id"
              class="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-slate-800/20"
            >
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800/50">
                <Play :size="14" class="text-slate-500" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-slate-200 truncate">{{ pub.title }}</div>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-xs text-slate-500">{{ pub.channel }}</span>
                  <span class="text-slate-700">|</span>
                  <div class="flex items-center gap-1 text-xs text-slate-500">
                    <Clock :size="10" />
                    <span>{{ new Date(pub.publishedAt).toLocaleDateString('ko-KR') }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <div v-if="pub.views > 0" class="flex items-center gap-1 text-xs text-slate-400">
                  <Eye :size="12" />
                  <span class="tabular-nums">{{ formatNumber(pub.views) }}</span>
                </div>
                <div
                  :class="[
                    'rounded-md px-2 py-0.5 text-xs font-medium',
                    publicationStatusConfig(pub.status).bg,
                    publicationStatusConfig(pub.status).text,
                  ]"
                >
                  {{ publicationStatusConfig(pub.status).label }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            @click="router.push('/')"
            class="flex items-center gap-3 rounded-xl bg-slate-900/50 p-4 ring-1 ring-slate-800/50 text-left transition-all hover:bg-slate-800/30 hover:ring-slate-700/50"
          >
            <div class="rounded-lg bg-blue-500/10 p-2">
              <Plus :size="16" class="text-blue-400" />
            </div>
            <div>
              <div class="text-sm font-medium text-slate-200">Create Project</div>
              <div class="text-xs text-slate-500">Start a new video</div>
            </div>
          </button>

          <button
            class="flex items-center gap-3 rounded-xl bg-slate-900/50 p-4 ring-1 ring-slate-800/50 text-left transition-all hover:bg-slate-800/30 hover:ring-slate-700/50"
          >
            <div class="rounded-lg bg-cyan-500/10 p-2">
              <BarChart3 :size="16" class="text-cyan-400" />
            </div>
            <div>
              <div class="text-sm font-medium text-slate-200">Run Analytics</div>
              <div class="text-xs text-slate-500">Refresh all stats</div>
            </div>
          </button>

          <button
            @click="router.push('/marketplace')"
            class="flex items-center gap-3 rounded-xl bg-slate-900/50 p-4 ring-1 ring-slate-800/50 text-left transition-all hover:bg-slate-800/30 hover:ring-slate-700/50"
          >
            <div class="rounded-lg bg-violet-500/10 p-2">
              <TrendingUp :size="16" class="text-violet-400" />
            </div>
            <div>
              <div class="text-sm font-medium text-slate-200">Browse Templates</div>
              <div class="text-xs text-slate-500">Find new formats</div>
            </div>
          </button>

          <button
            class="flex items-center gap-3 rounded-xl bg-slate-900/50 p-4 ring-1 ring-slate-800/50 text-left transition-all hover:bg-slate-800/30 hover:ring-slate-700/50"
          >
            <div class="rounded-lg bg-emerald-500/10 p-2">
              <Send :size="16" class="text-emerald-400" />
            </div>
            <div>
              <div class="text-sm font-medium text-slate-200">Schedule Post</div>
              <div class="text-xs text-slate-500">Queue for publishing</div>
            </div>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
