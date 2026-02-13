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
  AlertCircle,
  XCircle
} from 'lucide-vue-next'

interface StatCard {
  label: string
  value: string
  change: string
  positive: boolean
  icon: typeof BarChart3
}

interface RecentActivity {
  id: string
  action: string
  channel: string
  status: 'published' | 'pending' | 'failed'
  time: string
}

const stats: StatCard[] = [
  { label: 'Total Views', value: '24,521', change: '+12.5%', positive: true, icon: Eye },
  { label: 'Published', value: '48', change: '+8', positive: true, icon: Send },
  { label: 'In Pipeline', value: '12', change: '-3', positive: false, icon: RefreshCw },
  { label: 'Engagement', value: '4.2%', change: '+0.8%', positive: true, icon: TrendingUp },
]

const recentActivities: RecentActivity[] = [
  { id: '1', action: 'Published "AI Trends 2026"', channel: 'Medium', status: 'published', time: '2m ago' },
  { id: '2', action: 'Transformed for LinkedIn', channel: 'LinkedIn', status: 'published', time: '5m ago' },
  { id: '3', action: 'Processing X Thread', channel: 'X', status: 'pending', time: '8m ago' },
  { id: '4', action: 'Newsletter draft ready', channel: 'Newsletter', status: 'pending', time: '15m ago' },
  { id: '5', action: 'Brunch publish failed', channel: 'Brunch', status: 'failed', time: '22m ago' },
]

const statusIcon = {
  published: CheckCircle2,
  pending: Clock,
  failed: XCircle,
}

const statusColor = {
  published: 'text-green-600 bg-green-50',
  pending: 'text-amber-600 bg-amber-50',
  failed: 'text-red-600 bg-red-50',
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Sidebar -->
    <aside class="fixed left-0 top-0 h-full w-60 border-r border-slate-200 bg-slate-50 p-4">
      <div class="mb-8 flex items-center gap-2 px-3">
        <FileText :size="24" class="text-blue-600" />
        <span class="text-lg font-semibold text-slate-900">ContentForge</span>
      </div>

      <nav class="space-y-1">
        <router-link
          to="/"
          class="flex items-center gap-3 rounded-lg border-l-2 border-blue-600 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600"
        >
          <BarChart3 :size="20" />
          Dashboard
        </router-link>
        <router-link
          to="/materials/mat-001"
          class="flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          <FileText :size="20" />
          Materials
        </router-link>
        <router-link
          to="/pipelines"
          class="flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          <RefreshCw :size="20" />
          Pipelines
        </router-link>
        <a
          href="#"
          class="flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          <Send :size="20" />
          Publications
        </a>
        <a
          href="#"
          class="flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          <TrendingUp :size="20" />
          Analytics
        </a>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="ml-60 p-8">
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p class="text-sm text-slate-500">Overview of your content performance</p>
      </div>

      <!-- Stat Cards -->
      <div class="mb-8 grid grid-cols-4 gap-6">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm"
        >
          <div class="mb-4 flex items-center justify-between">
            <span class="text-sm text-slate-500">{{ stat.label }}</span>
            <component :is="stat.icon" :size="20" class="text-slate-400" />
          </div>
          <div class="text-2xl font-semibold text-slate-900">{{ stat.value }}</div>
          <div class="mt-1 flex items-center gap-1 text-sm">
            <component
              :is="stat.positive ? ArrowUpRight : ArrowDownRight"
              :size="16"
              :class="stat.positive ? 'text-green-600' : 'text-red-600'"
            />
            <span :class="stat.positive ? 'text-green-600' : 'text-red-600'">
              {{ stat.change }}
            </span>
            <span class="text-slate-400">vs last week</span>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-200 px-6 py-4">
          <h2 class="text-lg font-semibold text-slate-900">Recent Activity</h2>
        </div>
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-left text-sm font-medium text-slate-500">
              <th class="px-6 py-3">Action</th>
              <th class="px-6 py-3">Channel</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="activity in recentActivities"
              :key="activity.id"
              class="border-b border-slate-100 text-sm"
            >
              <td class="px-6 py-4 text-slate-900">{{ activity.action }}</td>
              <td class="px-6 py-4 text-slate-600">{{ activity.channel }}</td>
              <td class="px-6 py-4">
                <span
                  :class="statusColor[activity.status]"
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                >
                  <component :is="statusIcon[activity.status]" :size="12" />
                  {{ activity.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-400">{{ activity.time }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>
