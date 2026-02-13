/**
 * Analytics types for ContentForge
 */

import type { Channel } from '@content-forge/core';

/**
 * Error type for analytics operations
 */
export interface AnalyticsError {
  source: string;
  message: string;
  cause?: unknown;
}

/**
 * Metrics collected from a single channel for a publication
 */
export interface ChannelMetrics {
  channel: Channel;
  publicationId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  measuredAt: Date;
}

/**
 * Configuration for the analytics collector
 */
export interface CollectorConfig {
  channels: Channel[];
  pollIntervalMs?: number;
}

/**
 * Weekly performance report
 */
export interface WeeklyReport {
  period: { start: Date; end: Date };
  summary: {
    totalViews: number;
    totalEngagement: number;
    topChannel: Channel;
    topContent: string;
  };
  channelBreakdown: Array<{
    channel: Channel;
    views: number;
    engagement: number;
    contentCount: number;
  }>;
  recommendations: string[];
  generatedAt: Date;
}
