/**
 * Shared types for BML learning loop modules
 */

import type { Channel } from '@content-forge/core';

/**
 * Error type for loop operations
 */
export interface LoopError {
  message: string;
  loop: 'weekly' | 'content' | 'prompt-evolution';
  details?: unknown;
}

/**
 * Channel performance entry for weekly analysis
 */
export interface ChannelPerformanceEntry {
  channel: Channel;
  avgViews: number;
  avgEngagement: number;
  engagementRate: number;
  trend: 'improving' | 'declining' | 'stable';
  postCount: number;
}

/**
 * Content type performance aggregation
 */
export interface ContentTypePerformance {
  type: string;
  avgEngagement: number;
  count: number;
}

/**
 * Best publishing time slot
 */
export interface PublishingTimeSlot {
  dayOfWeek: number;
  hour: number;
  avgEngagement: number;
}

/**
 * Strategy adjustment recommendation
 */
export interface StrategyAdjustment {
  area: 'channel-priority' | 'content-mix' | 'posting-schedule' | 'topic-focus';
  current: string;
  recommended: string;
  reason: string;
  confidence: number;
}

/**
 * Weekly analysis result
 */
export interface WeeklyAnalysis {
  period: { start: string; end: string };
  channelPerformance: ChannelPerformanceEntry[];
  contentTypePerformance: ContentTypePerformance[];
  bestPublishingTimes: PublishingTimeSlot[];
  strategyAdjustments: StrategyAdjustment[];
}

/**
 * Content analysis result for a single publication
 */
export interface ContentAnalysis {
  publicationId: string;
  channel: Channel;
  publishedAt: string;
  hoursElapsed: number;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
  };
  performance: 'high' | 'medium' | 'low';
  percentileRank: number;
  insights: string[];
}

/**
 * High-performance content pattern
 */
export interface HighPerformancePattern {
  id: string;
  pattern: string;
  channels: Channel[];
  avgEngagementLift: number;
  sampleSize: number;
  extractedAt: string;
}

/**
 * Prompt update suggestion
 */
export interface PromptUpdate {
  agentType: string;
  section: string;
  currentHint: string;
  suggestedHint: string;
  basedOnPatterns: string[];
  confidence: number;
}
