/**
 * Monthly BML report auto-generation
 *
 * Generates comprehensive monthly performance reports with channel breakdown,
 * trend analysis, top content identification, and actionable recommendations.
 */

import {
  createLogger,
  Ok,
  Err,
  type Logger,
  type Result,
  type Channel,
} from '@content-forge/core';
import type { ChannelMetrics, AnalyticsError } from './types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Monthly performance data for a single channel.
 */
export interface ChannelMonthlyData {
  channel: Channel;
  totalViews: number;
  totalEngagement: number;
  avgEngagementRate: number;
  /** Percentage growth vs previous period (NaN if no previous data) */
  growth: number;
  contentCount: number;
}

/**
 * Trend data for a specific metric.
 */
export interface TrendData {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
  insight: string;
}

/**
 * Top performing content entry.
 */
export interface TopContentEntry {
  publicationId: string;
  channel: Channel;
  views: number;
  engagement: number;
  engagementRate: number;
}

/**
 * Complete monthly performance report.
 */
export interface MonthlyReport {
  period: { start: Date; end: Date };
  executiveSummary: string;
  channelPerformance: ChannelMonthlyData[];
  trends: TrendData[];
  topContent: TopContentEntry[];
  recommendations: string[];
  generatedAt: Date;
}

// ---------------------------------------------------------------------------
// MonthlyReportGenerator
// ---------------------------------------------------------------------------

export class MonthlyReportGenerator {
  private readonly logger: Logger;

  constructor() {
    this.logger = createLogger({ agentId: 'analytics:monthly-report' });
  }

  /**
   * Generate a monthly report from collected metrics.
   */
  generate(
    metrics: ChannelMetrics[],
    period: { start: Date; end: Date },
  ): Result<MonthlyReport, AnalyticsError> {
    try {
      if (period.start >= period.end) {
        return Err({
          source: 'MonthlyReportGenerator',
          message: 'Period start must be before period end',
        });
      }

      if (metrics.length === 0) {
        return Err({
          source: 'MonthlyReportGenerator',
          message: 'No metrics provided for report generation',
        });
      }

      const channelPerformance = this.buildChannelPerformance(metrics);
      const trends = this.analyzeTrends(metrics, period);
      const topContent = this.identifyTopContent(metrics, 5);
      const recommendations = this.generateRecommendations(channelPerformance, trends);
      const executiveSummary = this.generateExecutiveSummary(
        channelPerformance,
        trends,
        topContent,
        period,
      );

      const report: MonthlyReport = {
        period,
        executiveSummary,
        channelPerformance,
        trends,
        topContent,
        recommendations,
        generatedAt: new Date(),
      };

      this.logger.info('generate_monthly_report', {
        periodStart: period.start.toISOString(),
        periodEnd: period.end.toISOString(),
        metricsCount: metrics.length,
        channelCount: channelPerformance.length,
        topContentCount: topContent.length,
      });

      return Ok(report);
    } catch (cause: unknown) {
      return Err({
        source: 'MonthlyReportGenerator',
        message: 'Failed to generate monthly report',
        cause,
      });
    }
  }

  /**
   * Generate a human-readable executive summary paragraph.
   */
  generateExecutiveSummary(
    channelPerformance: ChannelMonthlyData[],
    trends: TrendData[],
    topContent: TopContentEntry[],
    period: { start: Date; end: Date },
  ): string {
    const totalViews = channelPerformance.reduce((sum, c) => sum + c.totalViews, 0);
    const totalEngagement = channelPerformance.reduce((sum, c) => sum + c.totalEngagement, 0);
    const totalContent = channelPerformance.reduce((sum, c) => sum + c.contentCount, 0);
    const channelCount = channelPerformance.length;

    const startStr = period.start.toISOString().split('T')[0];
    const endStr = period.end.toISOString().split('T')[0];

    // Find top channel by views
    const topChannel = channelPerformance.length > 0
      ? [...channelPerformance].sort((a, b) => b.totalViews - a.totalViews)[0]
      : null;

    // Summarize trends
    const upTrends = trends.filter((t) => t.direction === 'up');
    const downTrends = trends.filter((t) => t.direction === 'down');

    let summary = `Monthly report for ${startStr} to ${endStr}: `;
    summary += `${totalContent} pieces of content were published across ${channelCount} channels, `;
    summary += `generating ${totalViews.toLocaleString()} total views and ${totalEngagement.toLocaleString()} engagements. `;

    if (topChannel) {
      summary += `The top performing channel was ${topChannel.channel} with ${topChannel.totalViews.toLocaleString()} views. `;
    }

    if (topContent.length > 0 && topContent[0]) {
      summary += `The best performing content was "${topContent[0].publicationId}" on ${topContent[0].channel} `;
      summary += `with an engagement rate of ${topContent[0].engagementRate.toFixed(1)}%. `;
    }

    if (upTrends.length > 0) {
      summary += `Positive trends: ${upTrends.map((t) => t.metric).join(', ')}. `;
    }

    if (downTrends.length > 0) {
      summary += `Areas needing attention: ${downTrends.map((t) => t.metric).join(', ')}.`;
    }

    return summary.trim();
  }

  /**
   * Build channel-level performance data.
   */
  private buildChannelPerformance(metrics: ChannelMetrics[]): ChannelMonthlyData[] {
    const byChannel = new Map<Channel, ChannelMetrics[]>();

    for (const m of metrics) {
      const existing = byChannel.get(m.channel) ?? [];
      existing.push(m);
      byChannel.set(m.channel, existing);
    }

    const result: ChannelMonthlyData[] = [];

    for (const [channel, channelMetrics] of byChannel) {
      const totalViews = channelMetrics.reduce((sum, m) => sum + m.views, 0);
      const totalEngagement = channelMetrics.reduce(
        (sum, m) => sum + m.likes + m.comments + m.shares,
        0,
      );
      const avgEngagementRate = totalViews > 0
        ? (totalEngagement / totalViews) * 100
        : 0;

      result.push({
        channel,
        totalViews,
        totalEngagement,
        avgEngagementRate,
        growth: 0, // Growth requires previous period data; defaults to 0
        contentCount: channelMetrics.length,
      });
    }

    return result;
  }

  /**
   * Analyze trends by splitting the period into two halves and comparing.
   */
  private analyzeTrends(
    metrics: ChannelMetrics[],
    period: { start: Date; end: Date },
  ): TrendData[] {
    const midpoint = new Date(
      period.start.getTime() + (period.end.getTime() - period.start.getTime()) / 2,
    );

    const firstHalf = metrics.filter((m) => m.measuredAt < midpoint);
    const secondHalf = metrics.filter((m) => m.measuredAt >= midpoint);

    const trends: TrendData[] = [];

    // Views trend
    const firstViews = firstHalf.reduce((sum, m) => sum + m.views, 0);
    const secondViews = secondHalf.reduce((sum, m) => sum + m.views, 0);
    trends.push(this.buildTrend('views', firstViews, secondViews));

    // Engagement trend
    const firstEngagement = firstHalf.reduce(
      (sum, m) => sum + m.likes + m.comments + m.shares,
      0,
    );
    const secondEngagement = secondHalf.reduce(
      (sum, m) => sum + m.likes + m.comments + m.shares,
      0,
    );
    trends.push(this.buildTrend('engagement', firstEngagement, secondEngagement));

    // Clicks trend
    const firstClicks = firstHalf.reduce((sum, m) => sum + m.clicks, 0);
    const secondClicks = secondHalf.reduce((sum, m) => sum + m.clicks, 0);
    trends.push(this.buildTrend('clicks', firstClicks, secondClicks));

    return trends;
  }

  /**
   * Build a single trend entry by comparing two period values.
   */
  private buildTrend(metric: string, firstValue: number, secondValue: number): TrendData {
    if (firstValue === 0 && secondValue === 0) {
      return {
        metric,
        direction: 'stable',
        changePercent: 0,
        insight: `${metric} remained at zero throughout the period.`,
      };
    }

    if (firstValue === 0) {
      return {
        metric,
        direction: 'up',
        changePercent: 100,
        insight: `${metric} started from zero and grew to ${secondValue} in the second half.`,
      };
    }

    const changePercent = ((secondValue - firstValue) / firstValue) * 100;
    const direction: 'up' | 'down' | 'stable' =
      changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable';

    let insight: string;
    if (direction === 'up') {
      insight = `${metric} increased by ${changePercent.toFixed(1)}% in the second half of the period.`;
    } else if (direction === 'down') {
      insight = `${metric} decreased by ${Math.abs(changePercent).toFixed(1)}% in the second half of the period.`;
    } else {
      insight = `${metric} remained stable with ${changePercent.toFixed(1)}% change.`;
    }

    return { metric, direction, changePercent, insight };
  }

  /**
   * Identify top performing content by engagement rate.
   */
  private identifyTopContent(metrics: ChannelMetrics[], limit: number): TopContentEntry[] {
    return metrics
      .map((m) => {
        const engagement = m.likes + m.comments + m.shares;
        const engagementRate = m.views > 0 ? (engagement / m.views) * 100 : 0;

        return {
          publicationId: m.publicationId,
          channel: m.channel,
          views: m.views,
          engagement,
          engagementRate,
        };
      })
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, limit);
  }

  /**
   * Generate actionable recommendations based on channel performance and trends.
   */
  private generateRecommendations(
    channelPerformance: ChannelMonthlyData[],
    trends: TrendData[],
  ): string[] {
    const recommendations: string[] = [];

    // Overall engagement analysis
    const avgEngagement = channelPerformance.length > 0
      ? channelPerformance.reduce((sum, c) => sum + c.avgEngagementRate, 0) / channelPerformance.length
      : 0;

    if (avgEngagement < 2) {
      recommendations.push(
        'Average engagement rate is below 2%. Focus on improving content quality and call-to-action elements.',
      );
    } else if (avgEngagement > 5) {
      recommendations.push(
        'Strong average engagement rate above 5%. Consider expanding to additional channels.',
      );
    }

    // Channel-specific recommendations
    if (channelPerformance.length > 1) {
      const sorted = [...channelPerformance].sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];

      if (!best || !worst) {
        return recommendations;
      }

      recommendations.push(
        `Best performing channel: ${best.channel} (${best.avgEngagementRate.toFixed(1)}% engagement rate). Consider increasing content volume here.`,
      );

      if (worst.avgEngagementRate < best.avgEngagementRate * 0.3) {
        recommendations.push(
          `${worst.channel} significantly underperforms (${worst.avgEngagementRate.toFixed(1)}% vs ${best.avgEngagementRate.toFixed(1)}%). Evaluate whether to improve or deprioritize.`,
        );
      }
    }

    // Trend-based recommendations
    for (const trend of trends) {
      if (trend.direction === 'down' && trend.changePercent < -20) {
        recommendations.push(
          `${trend.metric} dropped by ${Math.abs(trend.changePercent).toFixed(1)}%. Investigate root causes and adjust strategy.`,
        );
      }
    }

    // Ensure at least one recommendation
    if (recommendations.length === 0) {
      recommendations.push(
        'Performance is stable. Continue monitoring and consider running A/B tests to optimize further.',
      );
    }

    return recommendations;
  }
}
