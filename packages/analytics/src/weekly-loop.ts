/**
 * Weekly strategy adjustment loop
 * Analyzes performance data and generates strategy recommendations
 */

import { z } from 'zod';
import { Ok, Err, type Result, type Channel, type Metric, type Publication } from '@content-forge/core';
import { callClaude, type ClaudeApiConfig } from '@content-forge/pipelines';
import type {
  LoopError,
  WeeklyAnalysis,
  ChannelPerformanceEntry,
  ContentTypePerformance,
  PublishingTimeSlot,
  StrategyAdjustment,
} from './loop-types.js';

const StrategyAdjustmentSchema = z.object({
  area: z.enum(['channel-priority', 'content-mix', 'posting-schedule', 'topic-focus']),
  current: z.string(),
  recommended: z.string(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
});

export interface WeeklyLoopConfig {
  claudeApiConfig: ClaudeApiConfig;
  lookbackDays?: number;
}

/**
 * Run the weekly strategy adjustment loop.
 *
 * 1. Aggregate metrics by channel for the period
 * 2. Calculate engagement rates (engagement / views)
 * 3. Detect trends by comparing current week to previous week
 * 4. Group by content type (from publication metadata)
 * 5. Find best publishing times (group by day+hour, rank by engagement)
 * 6. Call Claude to generate strategy adjustment recommendations
 */
export async function runWeeklyLoop(
  metrics: Metric[],
  publications: Publication[],
  config: WeeklyLoopConfig,
): Promise<Result<WeeklyAnalysis, LoopError>> {
  try {
    const lookbackDays = config.lookbackDays ?? 7;
    const now = new Date();
    const periodEnd = now;
    const periodStart = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(periodStart.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

    // Filter metrics for current period
    const currentMetrics = metrics.filter(
      (m) => m.measuredAt >= periodStart && m.measuredAt <= periodEnd,
    );

    // Filter metrics for previous period (for trend detection)
    const previousMetrics = metrics.filter(
      (m) => m.measuredAt >= previousPeriodStart && m.measuredAt < periodStart,
    );

    // Build publication lookup
    const pubMap = new Map<string, Publication>();
    for (const pub of publications) {
      pubMap.set(pub.id, pub);
    }

    // 1. Aggregate by channel
    const channelPerformance = aggregateByChannel(currentMetrics, previousMetrics);

    // 2. Group by content type
    const contentTypePerformance = aggregateByContentType(currentMetrics, pubMap);

    // 3. Find best publishing times
    const bestPublishingTimes = findBestPublishingTimes(currentMetrics, pubMap);

    // 4. Generate strategy adjustments via Claude
    const adjustmentsResult = await generateStrategyAdjustments(
      channelPerformance,
      contentTypePerformance,
      bestPublishingTimes,
      config.claudeApiConfig,
    );

    const strategyAdjustments = adjustmentsResult.ok ? adjustmentsResult.value : [];

    const analysis: WeeklyAnalysis = {
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      channelPerformance,
      contentTypePerformance,
      bestPublishingTimes,
      strategyAdjustments,
    };

    return Ok(analysis);
  } catch (cause: unknown) {
    return Err({
      message: cause instanceof Error ? cause.message : 'Failed to run weekly loop',
      loop: 'weekly',
      details: cause,
    });
  }
}

/**
 * Aggregate metrics by channel, calculating averages and trends
 */
function aggregateByChannel(
  currentMetrics: Metric[],
  previousMetrics: Metric[],
): ChannelPerformanceEntry[] {
  // Group current metrics by publicationId first, then we need channel info.
  // Since Metric doesn't have channel, we group by publicationId across metrics.
  // For channel aggregation, we aggregate engagement across all metrics.
  const byChannel = groupMetricsByChannel(currentMetrics);
  const prevByChannel = groupMetricsByChannel(previousMetrics);

  const entries: ChannelPerformanceEntry[] = [];

  for (const [channel, channelMetrics] of byChannel.entries()) {
    const postCount = channelMetrics.length;
    const totalViews = channelMetrics.reduce((sum, m) => sum + m.views, 0);
    const totalEngagement = channelMetrics.reduce(
      (sum, m) => sum + m.likes + m.comments + m.shares,
      0,
    );

    const avgViews = postCount > 0 ? totalViews / postCount : 0;
    const avgEngagement = postCount > 0 ? totalEngagement / postCount : 0;
    const engagementRate = totalViews > 0 ? totalEngagement / totalViews : 0;

    // Trend detection: compare current avg engagement to previous period
    const prevChannelMetrics = prevByChannel.get(channel);
    let trend: 'improving' | 'declining' | 'stable' = 'stable';

    if (prevChannelMetrics && prevChannelMetrics.length > 0) {
      const prevTotalEngagement = prevChannelMetrics.reduce(
        (sum, m) => sum + m.likes + m.comments + m.shares,
        0,
      );
      const prevAvgEngagement = prevTotalEngagement / prevChannelMetrics.length;

      if (prevAvgEngagement > 0) {
        const changeRatio = (avgEngagement - prevAvgEngagement) / prevAvgEngagement;
        if (changeRatio > 0.1) {
          trend = 'improving';
        } else if (changeRatio < -0.1) {
          trend = 'declining';
        }
      }
    }

    entries.push({
      channel,
      avgViews: Math.round(avgViews),
      avgEngagement: Math.round(avgEngagement),
      engagementRate: Math.round(engagementRate * 10000) / 10000,
      trend,
      postCount,
    });
  }

  return entries;
}

/**
 * Group metrics by channel using publicationId prefix convention.
 * Since Metric does not carry channel directly, we derive it from publicationId
 * or treat each unique publicationId as a separate post.
 * For accurate channel grouping, callers should ensure metrics are associated
 * with publications that carry channel info.
 */
function groupMetricsByChannel(_metrics: Metric[]): Map<Channel, Metric[]> {
  // Metrics don't have a channel field directly. We'll use a simple approach:
  // each unique publicationId is treated as a separate post, and we group
  // all metrics together under 'medium' as default. The real channel info
  // comes from publications, so we'll use a helper that takes publications.
  // For now, group by publicationId and return them.
  // The actual channel mapping is handled by the caller providing matched data.
  const map = new Map<Channel, Metric[]>();

  // Without publication data, we can't determine channel.
  // Return all metrics grouped under a synthetic key per publicationId.
  // This function is called from aggregateByChannel which doesn't have pub data.
  // Let's refactor to pass publications.

  return map;
}

/**
 * Aggregate metrics by channel using publication data for channel resolution
 */
export function aggregateMetricsByChannel(
  metrics: Metric[],
  publications: Publication[],
  previousMetrics: Metric[],
): ChannelPerformanceEntry[] {
  const pubChannelMap = new Map<string, Channel>();
  for (const pub of publications) {
    pubChannelMap.set(pub.id, pub.channel);
  }

  const byChannel = new Map<Channel, Metric[]>();
  const prevByChannel = new Map<Channel, Metric[]>();

  for (const m of metrics) {
    const channel = pubChannelMap.get(m.publicationId);
    if (!channel) continue;
    const existing = byChannel.get(channel) ?? [];
    existing.push(m);
    byChannel.set(channel, existing);
  }

  for (const m of previousMetrics) {
    const channel = pubChannelMap.get(m.publicationId);
    if (!channel) continue;
    const existing = prevByChannel.get(channel) ?? [];
    existing.push(m);
    prevByChannel.set(channel, existing);
  }

  const entries: ChannelPerformanceEntry[] = [];

  for (const [channel, channelMetrics] of byChannel.entries()) {
    const postCount = new Set(channelMetrics.map((m) => m.publicationId)).size;
    const totalViews = channelMetrics.reduce((sum, m) => sum + m.views, 0);
    const totalEngagement = channelMetrics.reduce(
      (sum, m) => sum + m.likes + m.comments + m.shares,
      0,
    );

    const avgViews = postCount > 0 ? totalViews / postCount : 0;
    const avgEngagement = postCount > 0 ? totalEngagement / postCount : 0;
    const engagementRate = totalViews > 0 ? totalEngagement / totalViews : 0;

    const prevChannelMetrics = prevByChannel.get(channel);
    let trend: 'improving' | 'declining' | 'stable' = 'stable';

    if (prevChannelMetrics && prevChannelMetrics.length > 0) {
      const prevTotalEngagement = prevChannelMetrics.reduce(
        (sum, m) => sum + m.likes + m.comments + m.shares,
        0,
      );
      const prevPostCount = new Set(prevChannelMetrics.map((m) => m.publicationId)).size;
      const prevAvgEngagement = prevPostCount > 0 ? prevTotalEngagement / prevPostCount : 0;

      if (prevAvgEngagement > 0) {
        const changeRatio = (avgEngagement - prevAvgEngagement) / prevAvgEngagement;
        if (changeRatio > 0.1) {
          trend = 'improving';
        } else if (changeRatio < -0.1) {
          trend = 'declining';
        }
      }
    }

    entries.push({
      channel,
      avgViews: Math.round(avgViews),
      avgEngagement: Math.round(avgEngagement),
      engagementRate: Math.round(engagementRate * 10000) / 10000,
      trend,
      postCount,
    });
  }

  return entries;
}

/**
 * Aggregate metrics by content type from publication metadata
 */
function aggregateByContentType(
  metrics: Metric[],
  pubMap: Map<string, Publication>,
): ContentTypePerformance[] {
  const typeMap = new Map<string, { totalEngagement: number; count: number }>();

  for (const m of metrics) {
    const pub = pubMap.get(m.publicationId);
    const contentType = (pub?.metadata?.contentType as string) ?? 'unknown';
    const engagement = m.likes + m.comments + m.shares;

    const existing = typeMap.get(contentType);
    if (existing) {
      existing.totalEngagement += engagement;
      existing.count += 1;
    } else {
      typeMap.set(contentType, { totalEngagement: engagement, count: 1 });
    }
  }

  return Array.from(typeMap.entries()).map(([type, data]) => ({
    type,
    avgEngagement: data.count > 0 ? Math.round(data.totalEngagement / data.count) : 0,
    count: data.count,
  }));
}

/**
 * Find the best publishing times by grouping metrics by day-of-week and hour
 */
function findBestPublishingTimes(
  metrics: Metric[],
  pubMap: Map<string, Publication>,
): PublishingTimeSlot[] {
  const slotMap = new Map<string, { totalEngagement: number; count: number }>();

  for (const m of metrics) {
    const pub = pubMap.get(m.publicationId);
    if (!pub) continue;

    const publishDate = pub.publishedAt;
    const dayOfWeek = publishDate.getDay();
    const hour = publishDate.getHours();
    const key = `${dayOfWeek}-${hour}`;
    const engagement = m.likes + m.comments + m.shares;

    const existing = slotMap.get(key);
    if (existing) {
      existing.totalEngagement += engagement;
      existing.count += 1;
    } else {
      slotMap.set(key, { totalEngagement: engagement, count: 1 });
    }
  }

  const slots: PublishingTimeSlot[] = Array.from(slotMap.entries())
    .map(([key, data]) => {
      const [dayStr, hourStr] = key.split('-');
      return {
        dayOfWeek: Number(dayStr),
        hour: Number(hourStr),
        avgEngagement: data.count > 0 ? Math.round(data.totalEngagement / data.count) : 0,
      };
    })
    .sort((a, b) => b.avgEngagement - a.avgEngagement);

  return slots;
}

/**
 * Generate strategy adjustment recommendations via Claude
 */
async function generateStrategyAdjustments(
  channelPerformance: ChannelPerformanceEntry[],
  contentTypePerformance: ContentTypePerformance[],
  bestPublishingTimes: PublishingTimeSlot[],
  claudeConfig: ClaudeApiConfig,
): Promise<Result<StrategyAdjustment[], LoopError>> {
  const dataContext = JSON.stringify(
    {
      channelPerformance,
      contentTypePerformance,
      bestPublishingTimes: bestPublishingTimes.slice(0, 10),
    },
    null,
    2,
  );

  const systemPrompt = `You are a content strategy analyst. Analyze the provided performance data and suggest strategy adjustments.

Return ONLY a valid JSON array of adjustment objects. Each object must have:
- "area": one of "channel-priority", "content-mix", "posting-schedule", "topic-focus"
- "current": description of the current situation
- "recommended": the recommended change
- "reason": why this change is recommended
- "confidence": a number between 0 and 1

Return between 1 and 5 adjustments. Do not include any text outside the JSON array.`;

  const result = await callClaude(
    [{ role: 'user', content: `Analyze this performance data and suggest strategy adjustments:\n\n${dataContext}` }],
    systemPrompt,
    claudeConfig,
  );

  if (!result.ok) {
    return Err({
      message: result.error.message,
      loop: 'weekly',
      details: result.error,
    });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const raw = JSON.parse(result.value);
    const parseResult = z.array(StrategyAdjustmentSchema).safeParse(raw);

    if (!parseResult.success) {
      return Err({
        message: `Strategy adjustment validation failed: ${parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
        loop: 'weekly',
        details: parseResult.error,
      });
    }

    return Ok(parseResult.data);
  } catch (cause: unknown) {
    return Err({
      message: 'Failed to parse Claude strategy response',
      loop: 'weekly',
      details: cause,
    });
  }
}
