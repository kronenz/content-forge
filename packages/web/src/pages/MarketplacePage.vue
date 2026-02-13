<script setup lang="ts">
import { onMounted } from 'vue';
import {
  Search,
  Store,
  Layers,
  Download,
  X,
  Monitor,
  Smartphone,
  User,
  Bookmark,
} from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { useMarketplaceStore, type TemplateCategory } from '@/stores/marketplace-store';

const router = useRouter();
const marketplaceStore = useMarketplaceStore();

onMounted(() => {
  marketplaceStore.fetchTemplates();
});

const categories: { value: TemplateCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'promo', label: 'Promo' },
  { value: 'social', label: 'Social' },
  { value: 'explainer', label: 'Explainer' },
  { value: 'review', label: 'Review' },
];

function categoryBadgeClass(category: string): string {
  const map: Record<string, string> = {
    presentation: 'bg-blue-500/10 text-blue-400',
    tutorial: 'bg-emerald-500/10 text-emerald-400',
    promo: 'bg-violet-500/10 text-violet-400',
    social: 'bg-pink-500/10 text-pink-400',
    explainer: 'bg-amber-500/10 text-amber-400',
    review: 'bg-cyan-500/10 text-cyan-400',
  };
  return map[category] ?? 'bg-slate-500/10 text-slate-400';
}

function handleUseTemplate(id: string): void {
  marketplaceStore.useTemplate(id);
  router.push('/');
}
</script>

<template>
  <div class="h-full">
    <!-- Top Bar -->
    <div class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/50 bg-slate-950/80 px-4 sm:px-6 backdrop-blur-xl">
      <div class="flex items-center gap-3">
        <Store :size="18" class="text-blue-400" />
        <h1 class="text-sm font-semibold text-white">Template Marketplace</h1>
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-300 ring-1 ring-slate-700/50 transition-all hover:bg-slate-700/50 hover:text-white sm:px-4 sm:text-sm"
      >
        <Bookmark :size="14" />
        <span class="hidden sm:inline">Save as Template</span>
      </button>
    </div>

    <!-- Content -->
    <div class="p-4 sm:p-6 space-y-6">
      <!-- Loading -->
      <div v-if="marketplaceStore.loading" class="flex items-center justify-center py-20">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
      </div>

      <template v-else>
        <!-- Search + Category Filter -->
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <!-- Search -->
          <div class="relative flex-1">
            <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              v-model="marketplaceStore.searchQuery"
              type="text"
              placeholder="Search templates..."
              class="w-full rounded-lg bg-slate-900/50 pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 ring-1 ring-slate-800/50 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>

          <!-- Category Filter -->
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="cat in categories"
              :key="cat.value"
              @click="marketplaceStore.selectedCategory = cat.value"
              :class="[
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                marketplaceStore.selectedCategory === cat.value
                  ? 'bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/20'
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300',
              ]"
            >
              {{ cat.label }}
            </button>
          </div>
        </div>

        <!-- Results count -->
        <div class="text-xs text-slate-500">
          {{ marketplaceStore.filteredTemplates.length }} templates found
        </div>

        <!-- Template Grid -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div
            v-for="template in marketplaceStore.filteredTemplates"
            :key="template.id"
            @click="marketplaceStore.selectTemplate(template.id)"
            class="group cursor-pointer overflow-hidden rounded-xl bg-slate-900/50 ring-1 ring-slate-800/50 transition-all hover:bg-slate-800/50 hover:ring-slate-700/50"
          >
            <!-- Preview Thumbnail -->
            <div
              :class="[
                'flex h-36 items-center justify-center bg-gradient-to-br',
                template.previewColor,
              ]"
            >
              <div class="flex flex-col items-center gap-2 text-white/60">
                <Monitor v-if="template.aspectRatio === '16:9'" :size="32" />
                <Smartphone v-else :size="32" />
                <span class="text-xs font-medium">{{ template.aspectRatio }}</span>
              </div>
            </div>

            <!-- Info -->
            <div class="p-4 space-y-3">
              <div class="flex items-start justify-between gap-2">
                <h3 class="text-sm font-semibold text-white line-clamp-1">{{ template.title }}</h3>
                <span
                  :class="[
                    'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize',
                    categoryBadgeClass(template.category),
                  ]"
                >
                  {{ template.category }}
                </span>
              </div>

              <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">{{ template.description }}</p>

              <div class="flex items-center justify-between text-xs text-slate-500">
                <div class="flex items-center gap-1">
                  <User :size="10" />
                  <span>{{ template.author }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1">
                    <Layers :size="10" />
                    <span>{{ template.sceneCount }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <Download :size="10" />
                    <span>{{ template.useCount.toLocaleString() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="marketplaceStore.filteredTemplates.length === 0"
          class="flex flex-col items-center gap-3 py-16"
        >
          <div class="rounded-xl bg-slate-900/50 p-6 ring-1 ring-slate-800/50">
            <Search :size="40" class="text-slate-700" />
          </div>
          <div class="text-center space-y-1">
            <h3 class="text-sm font-semibold text-slate-300">No templates found</h3>
            <p class="text-xs text-slate-500">Try adjusting your search or filter criteria.</p>
          </div>
        </div>
      </template>
    </div>

    <!-- Template Detail Modal -->
    <Teleport to="body">
      <div
        v-if="marketplaceStore.selectedTemplate"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          @click="marketplaceStore.clearSelection()"
        />

        <!-- Modal -->
        <div class="relative w-full max-w-lg overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-slate-800/50 shadow-2xl">
          <!-- Preview -->
          <div
            :class="[
              'flex h-48 items-center justify-center bg-gradient-to-br',
              marketplaceStore.selectedTemplate.previewColor,
            ]"
          >
            <div class="flex flex-col items-center gap-2 text-white/70">
              <Monitor v-if="marketplaceStore.selectedTemplate.aspectRatio === '16:9'" :size="48" />
              <Smartphone v-else :size="48" />
              <span class="text-sm font-medium">Template Preview</span>
            </div>

            <button
              @click="marketplaceStore.clearSelection()"
              class="absolute right-3 top-3 rounded-lg bg-black/30 p-1.5 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/50 hover:text-white"
            >
              <X :size="16" />
            </button>
          </div>

          <!-- Content -->
          <div class="p-6 space-y-4">
            <div class="flex items-start justify-between">
              <div class="space-y-1">
                <h2 class="text-lg font-bold text-white">{{ marketplaceStore.selectedTemplate.title }}</h2>
                <div class="flex items-center gap-2 text-xs text-slate-500">
                  <span>by {{ marketplaceStore.selectedTemplate.author }}</span>
                  <span class="text-slate-700">|</span>
                  <span
                    :class="[
                      'rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize',
                      categoryBadgeClass(marketplaceStore.selectedTemplate.category),
                    ]"
                  >
                    {{ marketplaceStore.selectedTemplate.category }}
                  </span>
                </div>
              </div>
            </div>

            <p class="text-sm text-slate-400 leading-relaxed">
              {{ marketplaceStore.selectedTemplate.description }}
            </p>

            <div class="flex items-center gap-6 text-xs text-slate-500">
              <div class="flex items-center gap-1.5">
                <Layers :size="12" />
                <span>{{ marketplaceStore.selectedTemplate.sceneCount }} scenes</span>
              </div>
              <div class="flex items-center gap-1.5">
                <Monitor v-if="marketplaceStore.selectedTemplate.aspectRatio === '16:9'" :size="12" />
                <Smartphone v-else :size="12" />
                <span>{{ marketplaceStore.selectedTemplate.aspectRatio }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <Download :size="12" />
                <span>{{ marketplaceStore.selectedTemplate.useCount.toLocaleString() }} uses</span>
              </div>
            </div>

            <div class="flex gap-3 pt-2">
              <button
                @click="marketplaceStore.clearSelection()"
                class="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 ring-1 ring-slate-700/50 transition-colors hover:bg-slate-800/50 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                @click="handleUseTemplate(marketplaceStore.selectedTemplate!.id)"
                class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500"
              >
                <Download :size="14" />
                Use Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
