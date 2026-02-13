import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type TemplateCategory = 'all' | 'presentation' | 'tutorial' | 'promo' | 'social' | 'explainer' | 'review';

export interface MarketplaceTemplate {
  id: string;
  title: string;
  author: string;
  category: Exclude<TemplateCategory, 'all'>;
  description: string;
  useCount: number;
  previewColor: string;
  aspectRatio: '16:9' | '9:16';
  sceneCount: number;
  createdAt: string;
}

const mockTemplates: MarketplaceTemplate[] = [
  {
    id: 'tpl-001',
    title: 'Tech News Roundup',
    author: 'ContentForge',
    category: 'presentation',
    description: 'Clean, modern layout for weekly tech news summaries with animated transitions.',
    useCount: 1_240,
    previewColor: 'from-blue-600 to-cyan-600',
    aspectRatio: '16:9',
    sceneCount: 6,
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'tpl-002',
    title: 'Step-by-Step Tutorial',
    author: 'EduCreators',
    category: 'tutorial',
    description: 'Numbered step cards with code highlighting, perfect for dev tutorials.',
    useCount: 982,
    previewColor: 'from-emerald-600 to-teal-600',
    aspectRatio: '16:9',
    sceneCount: 8,
    createdAt: '2026-01-20T00:00:00Z',
  },
  {
    id: 'tpl-003',
    title: 'Product Launch 30s',
    author: 'PromoStudio',
    category: 'promo',
    description: 'High-energy short-form template for product launches and announcements.',
    useCount: 2_150,
    previewColor: 'from-violet-600 to-purple-600',
    aspectRatio: '9:16',
    sceneCount: 4,
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'tpl-004',
    title: 'Instagram Carousel Story',
    author: 'SocialPack',
    category: 'social',
    description: 'Swipeable story format with bold text overlays and gradient backgrounds.',
    useCount: 3_400,
    previewColor: 'from-pink-600 to-rose-600',
    aspectRatio: '9:16',
    sceneCount: 5,
    createdAt: '2026-01-08T00:00:00Z',
  },
  {
    id: 'tpl-005',
    title: 'Concept Explainer',
    author: 'ContentForge',
    category: 'explainer',
    description: 'Whiteboard-style animations for explaining complex concepts simply.',
    useCount: 780,
    previewColor: 'from-amber-600 to-orange-600',
    aspectRatio: '16:9',
    sceneCount: 7,
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'tpl-006',
    title: 'Product Review',
    author: 'ReviewHub',
    category: 'review',
    description: 'Side-by-side comparison layout with rating cards and verdict scenes.',
    useCount: 560,
    previewColor: 'from-cyan-600 to-blue-600',
    aspectRatio: '16:9',
    sceneCount: 6,
    createdAt: '2026-02-03T00:00:00Z',
  },
  {
    id: 'tpl-007',
    title: 'TikTok Hook Opener',
    author: 'ViralFactory',
    category: 'social',
    description: 'Attention-grabbing opener templates designed for maximum first-second retention.',
    useCount: 4_200,
    previewColor: 'from-red-600 to-pink-600',
    aspectRatio: '9:16',
    sceneCount: 3,
    createdAt: '2026-01-25T00:00:00Z',
  },
  {
    id: 'tpl-008',
    title: 'Quarterly Report',
    author: 'BizTemplates',
    category: 'presentation',
    description: 'Professional data-driven presentation with chart placeholders and KPI cards.',
    useCount: 340,
    previewColor: 'from-slate-600 to-zinc-600',
    aspectRatio: '16:9',
    sceneCount: 10,
    createdAt: '2026-02-05T00:00:00Z',
  },
  {
    id: 'tpl-009',
    title: 'Coding Walkthrough',
    author: 'DevContent',
    category: 'tutorial',
    description: 'Terminal and editor-style scenes with syntax highlighting for code tutorials.',
    useCount: 1_100,
    previewColor: 'from-green-600 to-emerald-600',
    aspectRatio: '16:9',
    sceneCount: 8,
    createdAt: '2026-01-28T00:00:00Z',
  },
  {
    id: 'tpl-010',
    title: 'Event Promotion',
    author: 'PromoStudio',
    category: 'promo',
    description: 'Countdown-style template for event promotions with date and venue details.',
    useCount: 890,
    previewColor: 'from-indigo-600 to-violet-600',
    aspectRatio: '16:9',
    sceneCount: 5,
    createdAt: '2026-02-07T00:00:00Z',
  },
  {
    id: 'tpl-011',
    title: 'How It Works',
    author: 'ContentForge',
    category: 'explainer',
    description: 'Process flow template with numbered steps and animated connectors.',
    useCount: 650,
    previewColor: 'from-teal-600 to-cyan-600',
    aspectRatio: '16:9',
    sceneCount: 5,
    createdAt: '2026-02-09T00:00:00Z',
  },
  {
    id: 'tpl-012',
    title: 'Before & After',
    author: 'ReviewHub',
    category: 'review',
    description: 'Split-screen comparison template ideal for transformation and review content.',
    useCount: 720,
    previewColor: 'from-orange-600 to-amber-600',
    aspectRatio: '9:16',
    sceneCount: 4,
    createdAt: '2026-02-10T00:00:00Z',
  },
];

export const useMarketplaceStore = defineStore('marketplace', () => {
  const templates = ref<MarketplaceTemplate[]>([]);
  const loading = ref(false);
  const searchQuery = ref('');
  const selectedCategory = ref<TemplateCategory>('all');
  const selectedTemplate = ref<MarketplaceTemplate | null>(null);

  const filteredTemplates = computed(() => {
    let result = templates.value;
    if (selectedCategory.value !== 'all') {
      result = result.filter((t) => t.category === selectedCategory.value);
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.author.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
    }
    return result;
  });

  async function fetchTemplates(): Promise<void> {
    loading.value = true;
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      templates.value = [...mockTemplates];
    } finally {
      loading.value = false;
    }
  }

  function selectTemplate(id: string): void {
    selectedTemplate.value = templates.value.find((t) => t.id === id) ?? null;
  }

  function clearSelection(): void {
    selectedTemplate.value = null;
  }

  function useTemplate(id: string): void {
    const template = templates.value.find((t) => t.id === id);
    if (template) {
      template.useCount++;
    }
    selectedTemplate.value = null;
  }

  return {
    templates,
    loading,
    searchQuery,
    selectedCategory,
    selectedTemplate,
    filteredTemplates,
    fetchTemplates,
    selectTemplate,
    clearSelection,
    useTemplate,
  };
});
