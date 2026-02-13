<script setup lang="ts">
import {
  FileText,
  BarChart3,
  RefreshCw,
  Send,
  TrendingUp,
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
  Clock
} from 'lucide-vue-next'

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
        <router-link to="/" class="flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
          <BarChart3 :size="20" />
          Dashboard
        </router-link>
        <router-link to="/materials/mat-001" class="flex items-center gap-3 rounded-lg border-l-2 border-blue-600 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600">
          <FileText :size="20" />
          Materials
        </router-link>
        <router-link to="/pipelines" class="flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
          <RefreshCw :size="20" />
          Pipelines
        </router-link>
        <a href="#" class="flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
          <Send :size="20" />
          Publications
        </a>
        <a href="#" class="flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
          <TrendingUp :size="20" />
          Analytics
        </a>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="ml-60 p-8">
      <!-- Back + Header -->
      <div class="mb-8">
        <a href="#" class="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft :size="16" />
          Back to Materials
        </a>
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-slate-900">{{ material.title }}</h1>
            <div class="mt-2 flex items-center gap-4 text-sm text-slate-500">
              <span class="flex items-center gap-1">
                <Calendar :size="14" />
                {{ new Date(material.collectedAt).toLocaleDateString() }}
              </span>
              <a :href="material.url" class="flex items-center gap-1 text-blue-600 hover:underline">
                <ExternalLink :size="14" />
                {{ material.source }}
              </a>
              <span class="flex items-center gap-1">
                <Star :size="14" class="text-amber-500" />
                Score: {{ material.score }}/10
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <Edit3 :size="16" />
              Edit
            </button>
            <button class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <Copy :size="16" />
              Duplicate
            </button>
            <button class="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50">
              <Trash2 :size="16" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-8">
        <!-- Content (2 cols) -->
        <div class="col-span-2 space-y-6">
          <!-- Content Body -->
          <div class="rounded-lg border border-slate-200 bg-white p-6">
            <h2 class="mb-4 text-lg font-semibold text-slate-900">Content</h2>
            <div class="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {{ material.content }}
            </div>
          </div>

          <!-- Pipeline Assignments -->
          <div class="rounded-lg border border-slate-200 bg-white p-6">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-slate-900">Pipeline Assignments</h2>
              <button class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                <Zap :size="14" />
                Process All
              </button>
            </div>
            <div class="space-y-3">
              <div
                v-for="pipeline in assignedPipelines"
                :key="pipeline.name"
                class="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4"
              >
                <div>
                  <div class="text-sm font-medium text-slate-900">{{ pipeline.name }}</div>
                  <div class="mt-1 flex items-center gap-1.5">
                    <span
                      v-for="ch in pipeline.channels"
                      :key="ch"
                      class="rounded bg-white px-2 py-0.5 text-xs text-slate-500 shadow-sm"
                    >
                      {{ ch }}
                    </span>
                  </div>
                </div>
                <span
                  :class="pipeline.status === 'completed'
                    ? 'text-green-600 bg-green-50'
                    : 'text-amber-600 bg-amber-50'"
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                >
                  <component :is="pipeline.status === 'completed' ? CheckCircle2 : Clock" :size="12" />
                  {{ pipeline.status }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar Info (1 col) -->
        <div class="space-y-6">
          <!-- Status Card -->
          <div class="rounded-lg border border-slate-200 bg-white p-6">
            <h3 class="mb-4 text-sm font-semibold text-slate-900">Details</h3>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between">
                <dt class="text-slate-500">ID</dt>
                <dd class="font-mono text-slate-700">{{ material.id }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Status</dt>
                <dd>
                  <span class="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                    {{ material.status }}
                  </span>
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Source</dt>
                <dd class="text-slate-700">{{ material.source }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Score</dt>
                <dd class="font-semibold text-amber-600">{{ material.score }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Collected</dt>
                <dd class="text-slate-700">{{ new Date(material.collectedAt).toLocaleString() }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Characters</dt>
                <dd class="text-slate-700">{{ material.content.length }}</dd>
              </div>
            </dl>
          </div>

          <!-- Tags -->
          <div class="rounded-lg border border-slate-200 bg-white p-6">
            <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Tag :size="16" />
              Tags
            </h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in material.tags"
                :key="tag"
                class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
