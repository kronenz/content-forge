/**
 * Weekly report generator - generates performance reports from collected metrics
 */

import { createLogger, Ok, Err, type Logger, type Result, type Channel } from '@content-forge/core';
import type { ChannelMetrics, WeeklyReport, AnalyticsError } from './types.js';

/**
 * Generates weekly performance reports from collected channel metrics.
 */
export class WeeklyReportGenerator {
  private readonly logger: Logger;

  constructor() {
    this.logger = createLogger({ agentId: 'analytics:weekly-report' });
  }

  /**
   * Generate a weekly report from the given metrics and time period
   */
  generate(
    metrics: ChannelMetrics[],
    period: { start: Date; end: Date },
  ): Result<WeeklyReport, AnalyticsError> {
    try {
      if (period.start >= period.end) {
        return Err({
          source: 'WeeklyReportGenerator',
          message: 'Period start must be before period end',
        });
      }

      if (metrics.length === 0) {
        return Err({
          source: 'WeeklyReportGenerator',
          message: 'No metrics provided for report generation',
        });
      }

      const totalViews = metrics.reduce((sum, m) => sum + m.views, 0);
      const totalEngagement = metrics.reduce(
        (sum, m) => sum + m.likes + m.comments + m.shares,
        0,
      );

      const channelBreakdown = this.buildChannelBreakdown(metrics);
      const topChannelEntry = channelBreakdown.reduce((best, entry) =>
        entry.views > best.views ? entry : best,
      );

      const topPerformers = this.getTopPerformers(metrics, 1);
      const topContent = topPerformers.length > 0 && topPerformers[0] ? topPerformers[0].publicationId : 'N/A';

      const recommendations = this.generateRecommendations(metrics);

      const report: WeeklyReport = {
        period,
        summary: {
          totalViews,
          totalEngagement,
          topChannel: topChannelEntry.channel,
          topContent,
        },
        channelBreakdown,
        recommendations,
        generatedAt: new Date(),
      };

      this.logger.info('generate', {
        periodStart: period.start.toISOString(),
        periodEnd: period.end.toISOString(),
        metricsCount: metrics.length,
        totalViews,
        totalEngagement,
      });

      return Ok(report);
    } catch (cause: unknown) {
      return Err({
        source: 'WeeklyReportGenerator',
        message: 'Failed to generate weekly report',
        cause,
      });
    }
  }

  /**
   * Calculate engagement rate for a single channel metric
   * Formula: (likes + comments + shares) / views * 100
   */
  calculateEngagementRate(metrics: ChannelMetrics): number {
    if (metrics.views === 0) {
      return 0;
    }
    return ((metrics.likes + metrics.comments + metrics.shares) / metrics.views) * 100;
  }

  /**
   * Get top performing publications sorted by total engagement
   */
  getTopPerformers(metrics: ChannelMetrics[], limit: number): ChannelMetrics[] {
    return [...metrics]
      .sort((a, b) => {
        const engA = a.likes + a.comments + a.shares;
        const engB = b.likes + b.comments + b.shares;
        return engB - engA;
      })
      .slice(0, limit);
  }

  /**
   * Generate actionable recommendations based on metrics
   */
  generateRecommendations(metrics: ChannelMetrics[]): string[] {
    const recommendations: string[] = [];

    if (metrics.length === 0) {
      return ['Start publishing content to generate performance data.'];
    }

    // Analyze average engagement rate
    const avgEngagement =
      metrics.reduce((sum, m) => sum + this.calculateEngagementRate(m), 0) / metrics.length;

    if (avgEngagement < 2) {
      recommendations.push(
        'Overall engagement is below 2%. Consider more interactive content formats.',
      );
    } else if (avgEngagement > 5) {
      recommendations.push(
        'Strong engagement rate above 5%. Continue current content strategy.',
      );
    }

    // Find best and worst performing channels
    const channelPerformance = this.buildChannelBreakdown(metrics);
    if (channelPerformance.length > 1) {
      const sorted = [...channelPerformance].sort((a, b) => b.engagement - a.engagement);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];

      if (!best || !worst) {
        return recommendations;
      }

      recommendations.push(
        `Top performing channel: ${best.channel} with ${best.engagement} total engagement.`,
      );

      if (worst.engagement < best.engagement * 0.3) {
        recommendations.push(
          `Consider improving content for ${worst.channel} or reallocating resources.`,
        );
      }
    }

    // Check for low-view content
    const lowViewMetrics = metrics.filter((m) => m.views < 100);
    if (lowViewMetrics.length > metrics.length * 0.5) {
      recommendations.push(
        'More than half of publications have under 100 views. Review distribution strategy.',
      );
    }

    // Check click-through rate
    const avgCtr =
      metrics.reduce((sum, m) => sum + (m.views > 0 ? m.clicks / m.views : 0), 0) /
      metrics.length;

    if (avgCtr < 0.02) {
      recommendations.push(
        'Click-through rate is below 2%. Improve call-to-action elements.',
      );
    }

    return recommendations;
  }

  /**
   * Build a breakdown of metrics by channel
   */
  private buildChannelBreakdown(
    metrics: ChannelMetrics[],
  ): Array<{ channel: Channel; views: number; engagement: number; contentCount: number }> {
    const byChannel = new Map<
      Channel,
      { views: number; engagement: number; contentCount: number }
    >();

    for (const m of metrics) {
      const existing = byChannel.get(m.channel);
      const engagement = m.likes + m.comments + m.shares;

      if (existing) {
        existing.views += m.views;
        existing.engagement += engagement;
        existing.contentCount += 1;
      } else {
        byChannel.set(m.channel, {
          views: m.views,
          engagement,
          contentCount: 1,
        });
      }
    }

    return Array.from(byChannel.entries()).map(([channel, data]) => ({
      channel,
      ...data,
    }));
  }
}
