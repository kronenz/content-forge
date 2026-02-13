<script setup lang="ts">
// Style L: Production Ready - Material Detail Sample Page
// Reference implementation for ContentForge dark design system
import {
  Home,
  FileText,
  Layers,
  BarChart3,
  Settings,
  ArrowLeft,
  ExternalLink,
  Tag,
  Calendar,
  Star,
  Zap,
  Copy,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-vue-next'
import { ref } from 'vue'

const sidebarExpanded = ref(false)

const material = {
  id: 'mat-001',
  title: 'How AI is Transforming Content Creation in 2026',
  source: 'techblog',
  url: 'https://techblog.example.com/ai-content-2026',
  score: 8.5,
  status: 'scored',
  tags: ['AI', 'content-creation', 'automation', 'trends'],
  collectedAt: '2026-02-12T08:00:00Z',
  content: `Artificial intelligence is rapidly transforming how content is created, distributed, and consumed. In 2026, we're seeing unprecedented adoption of AI-powered content tools across industries.

The key trends include:
1. Multi-modal content generation from single source materials
2. Automated distribution across 16+ channels
3. Real-time performance optimization through BML feedback loops
4. Human-AI collaboration replacing fully manual workflows

Companies that adopt these tools early are seeing 3-5x improvements in content output while maintaining quality through AI guardians and humanization filters.`,
}

const assignedPipelines = [
  { name: 'Text Pipeline', channels: ['Medium', 'LinkedIn', 'Blog'], status: 'completed' },
  { name: 'Thread Pipeline', channels: ['X', 'Threads'], status: 'pending' },
  { name: 'Snackable Pipeline', channels: ['IG Carousel', 'IG Story'], status: 'pending' },
]

const statusConfig: Record<string, { bg: string, text: string, ring: string }> = {
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20' },
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', ring: 'ring-amber-500/20' },
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
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200"
            :title="!sidebarExpanded ? 'Dashboard' : ''"
          >
            <Home :size="18" class="shrink-0" />
            <span v-if="sidebarExpanded" class="text-sm font-medium">Dashboard</span>
          </button>
          <button
            class="flex w-full items-center gap-3 rounded-lg bg-blue-600/10 px-3 py-2.5 text-blue-400 ring-1 ring-blue-500/20"
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
            <a
              href="#"
              class="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              <ArrowLeft :size="14" />
              <span>Back to Materials</span>
            </a>
            <div class="h-4 w-px bg-slate-800/50"></div>
            <h1 class="text-sm font-semibold text-white">Material Details</h1>
          </div>

          <div class="flex items-center gap-2">
            <button class="inline-flex items-center gap-2 rounded-lg bg-slate-900/50 px-3 py-2 text-sm text-slate-400 ring-1 ring-slate-800/50 hover:bg-slate-800/50">
              <Edit3 :size="14" />
              <span>Edit</span>
            </button>
            <button class="inline-flex items-center gap-2 rounded-lg bg-slate-900/50 px-3 py-2 text-sm text-slate-400 ring-1 ring-slate-800/50 hover:bg-slate-800/50">
              <Copy :size="14" />
              <span>Duplicate</span>
            </button>
            <button class="inline-flex items-center gap-2 rounded-lg bg-rose-600/10 px-3 py-2 text-sm text-rose-400 ring-1 ring-rose-500/20 hover:bg-rose-600/20">
              <Trash2 :size="14" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <div class="grid grid-cols-3 gap-6">
            <!-- Main Content (2 cols) -->
            <div class="col-span-2 space-y-6">
              <!-- Title & Metadata -->
              <div class="rounded-xl bg-slate-900/50 p-6 ring-1 ring-slate-800/50">
                <h2 class="text-xl font-bold text-white mb-4">{{ material.title }}</h2>
                <div class="flex items-center gap-4 text-sm">
                  <span class="flex items-center gap-1.5 text-slate-400">
                    <Calendar :size="14" />
                    {{ new Date(material.collectedAt).toLocaleDateString() }}
                  </span>
                  <a :href="material.url" class="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors">
                    <ExternalLink :size="14" />
                    {{ material.source }}
                  </a>
                  <span class="flex items-center gap-1.5 text-amber-400">
                    <Star :size="14" />
                    Score: {{ material.score }}/10
                  </span>
                </div>
              </div>

              <!-- Content Body -->
              <div class="rounded-xl bg-slate-900/50 p-6 ring-1 ring-slate-800/50">
                <h3 class="mb-4 text-sm font-semibold text-white">Content</h3>
                <div class="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                  {{ material.content }}
                </div>
              </div>

              <!-- Pipeline Assignments -->
              <div class="rounded-xl bg-slate-900/50 p-6 ring-1 ring-slate-800/50">
                <div class="mb-4 flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-white">Pipeline Assignments</h3>
                  <button class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/30">
                    <Zap :size="14" />
                    <span>Process All</span>
                  </button>
                </div>
                <div class="space-y-3">
                  <div
                    v-for="pipeline in assignedPipelines"
                    :key="pipeline.name"
                    class="flex items-center justify-between rounded-lg bg-slate-800/30 p-4 ring-1 ring-slate-800/50"
                  >
                    <div>
                      <div class="text-sm font-medium text-white mb-2">{{ pipeline.name }}</div>
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span
                          v-for="ch in pipeline.channels"
                          :key="ch"
                          class="rounded bg-slate-900/50 px-2 py-0.5 text-[10px] text-slate-400"
                        >
                          {{ ch }}
                        </span>
                      </div>
                    </div>
                    <div
                      :class="[
                        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 ring-1',
                        statusConfig[pipeline.status].bg,
                        statusConfig[pipeline.status].text,
                        statusConfig[pipeline.status].ring
                      ]"
                    >
                      <component :is="pipeline.status === 'completed' ? CheckCircle2 : Clock" :size="12" />
                      <span class="text-xs font-medium">{{ pipeline.status }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sidebar (1 col) -->
            <div class="space-y-6">
              <!-- Details Card -->
              <div class="rounded-xl bg-slate-900/50 p-6 ring-1 ring-slate-800/50">
                <h3 class="mb-4 text-sm font-semibold text-white">Details</h3>
                <dl class="space-y-3 text-sm">
                  <div class="flex justify-between">
                    <dt class="text-slate-500">ID</dt>
                    <dd class="font-mono text-slate-300">{{ material.id }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-500">Status</dt>
                    <dd>
                      <span class="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20">
                        {{ material.status }}
                      </span>
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-500">Source</dt>
                    <dd class="text-slate-300">{{ material.source }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-500">Score</dt>
                    <dd class="font-semibold text-amber-400">{{ material.score }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-500">Collected</dt>
                    <dd class="text-slate-400 text-xs">{{ new Date(material.collectedAt).toLocaleString() }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-slate-500">Characters</dt>
                    <dd class="text-slate-300 tabular-nums">{{ material.content.length }}</dd>
                  </div>
                </dl>
              </div>

              <!-- Tags Card -->
              <div class="rounded-xl bg-slate-900/50 p-6 ring-1 ring-slate-800/50">
                <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <Tag :size="16" />
                  Tags
                </h3>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="tag in material.tags"
                    :key="tag"
                    class="rounded-md bg-slate-800/50 px-2.5 py-1 text-xs text-slate-400 ring-1 ring-slate-700/50"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Bottom Status Bar -->
    <div class="flex h-14 items-center justify-between border-t border-slate-800/50 bg-slate-900/80 px-4 backdrop-blur-xl">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800/50">
          <FileText :size="14" class="text-slate-400" />
        </div>
        <div class="min-w-0">
          <div class="text-xs font-medium text-white line-clamp-1">Viewing material: {{ material.id }}</div>
          <div class="text-[10px] text-slate-500">{{ material.tags.length }} tags • {{ material.content.length }} characters</div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-1.5">
          <Star :size="12" class="text-amber-400" />
          <span class="text-xs text-slate-400">{{ material.score }}/10</span>
        </div>
      </div>
    </div>
  </div>
</template>
