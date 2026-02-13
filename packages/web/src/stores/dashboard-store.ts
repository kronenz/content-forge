import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface ChannelMetric {
  name: string;
  views: number;
  subscribers: number;
  growth: number;
}

export interface RecentPublication {
  id: string;
  title: string;
  channel: string;
  publishedAt: string;
  views: number;
  status: 'published' | 'scheduled' | 'failed';
}

export interface DashboardMetrics {
  totalViews: number;
  totalViewsChange: number;
  engagementRate: number;
  engagementChange: number;
  totalSubscribers: number;
  subscribersChange: number;
  totalPublished: number;
  publishedChange: number;
  channels: ChannelMetric[];
  recentPublications: RecentPublication[];
  weeklyViews: number[];
}

export const useDashboardStore = defineStore('dashboard', () => {
  const metrics = ref<DashboardMetrics | null>(null);
  const loading = ref(false);
  const dateRange = ref<'7d' | '30d' | '90d'>('30d');
  const channelFilter = ref<string>('all');

  async function fetchDashboardData(): Promise<void> {
    loading.value = true;
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      metrics.value = {
        totalViews: 284_350,
        totalViewsChange: 12.5,
        engagementRate: 4.8,
        engagementChange: 0.3,
        totalSubscribers: 15_420,
        subscribersChange: 8.2,
        totalPublished: 47,
        publishedChange: 15,
        channels: [
          { name: 'YouTube', views: 142_800, subscribers: 8_200, growth: 14.2 },
          { name: 'TikTok', views: 98_500, subscribers: 5_100, growth: 22.1 },
          { name: 'Instagram', views: 43_050, subscribers: 2_120, growth: 6.8 },
        ],
        recentPublications: [
          {
            id: 'pub-001',
            title: 'AI Trends 2026 Overview',
            channel: 'YouTube',
            publishedAt: '2026-02-12T10:00:00Z',
            views: 12_400,
            status: 'published',
          },
          {
            id: 'pub-002',
            title: 'Pinia State Management Tips',
            channel: 'YouTube',
            publishedAt: '2026-02-11T14:00:00Z',
            views: 8_200,
            status: 'published',
          },
          {
            id: 'pub-003',
            title: 'Product Launch Short',
            channel: 'TikTok',
            publishedAt: '2026-02-13T09:00:00Z',
            views: 0,
            status: 'scheduled',
          },
          {
            id: 'pub-004',
            title: 'Vue 3 Composition API',
            channel: 'Instagram',
            publishedAt: '2026-02-10T16:00:00Z',
            views: 3_100,
            status: 'published',
          },
          {
            id: 'pub-005',
            title: 'ContentForge Demo Reel',
            channel: 'YouTube',
            publishedAt: '2026-02-09T11:00:00Z',
            views: 5_800,
            status: 'published',
          },
        ],
        weeklyViews: [32_100, 28_500, 41_200, 38_900, 45_600, 52_300, 45_750],
      };
    } finally {
      loading.value = false;
    }
  }

  return {
    metrics,
    loading,
    dateRange,
    channelFilter,
    fetchDashboardData,
  };
});
