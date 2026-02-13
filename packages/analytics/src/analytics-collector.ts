/**
 * Analytics collector - collects performance metrics from channels
 */

import { createLogger, Ok, Err, type Logger, type Result, type Channel } from '@content-forge/core';
import type { ChannelMetrics, CollectorConfig, AnalyticsError } from './types.js';

/**
 * Collects performance metrics from publication channels.
 * Currently generates mock metrics within realistic ranges.
 */
export class AnalyticsCollector {
  private readonly config: CollectorConfig;
  private readonly logger: Logger;

  constructor(config: CollectorConfig) {
    this.config = config;
    this.logger = createLogger({ agentId: 'analytics:collector' });
  }

  /**
   * Collect metrics for a single publication on a specific channel
   */
  collectMetrics(
    publicationId: string,
    channel: Channel,
  ): Promise<Result<ChannelMetrics, AnalyticsError>> {
    return Promise.resolve(((): Result<ChannelMetrics, AnalyticsError> => {
      try {
        if (!this.config.channels.includes(channel)) {
          return Err({
            source: 'AnalyticsCollector',
            message: `Channel "${channel}" is not configured for collection`,
          });
        }

        if (!publicationId) {
          return Err({
            source: 'AnalyticsCollector',
            message: 'Publication ID is required',
          });
        }

        const metrics = this.generateMockMetrics(publicationId, channel);

        this.logger.info('collectMetrics', {
          publicationId,
          channel,
          views: metrics.views,
        });

        return Ok(metrics);
      } catch (cause: unknown) {
        return Err({
          source: 'AnalyticsCollector',
          message: `Failed to collect metrics for publication "${publicationId}" on channel "${channel}"`,
          cause,
        });
      }
    })());
  }

  /**
   * Collect metrics for all given publications across their channels
   */
  async collectAllChannels(
    publicationIds: Array<{ id: string; channel: Channel }>,
  ): Promise<Result<ChannelMetrics[], AnalyticsError>> {
    try {
      const results: ChannelMetrics[] = [];

      for (const pub of publicationIds) {
        const result = await this.collectMetrics(pub.id, pub.channel);
        if (!result.ok) {
          this.logger.warn('collectAllChannels:skip', {
            publicationId: pub.id,
            channel: pub.channel,
            error: result.error.message,
          });
          continue;
        }
        results.push(result.value);
      }

      this.logger.info('collectAllChannels', {
        requested: publicationIds.length,
        collected: results.length,
      });

      return Ok(results);
    } catch (cause: unknown) {
      return Err({
        source: 'AnalyticsCollector',
        message: 'Failed to collect metrics for all channels',
        cause,
      });
    }
  }

  /**
   * Generate mock metrics within realistic ranges
   */
  private generateMockMetrics(publicationId: string, channel: Channel): ChannelMetrics {
    const baseViews = this.getBaseViewsForChannel(channel);
    const views = randomInRange(baseViews * 0.5, baseViews * 1.5);
    const engagementRate = randomInRange(0.01, 0.08);
    const likes = Math.round(views * engagementRate);
    const comments = Math.round(likes * randomInRange(0.05, 0.3));
    const shares = Math.round(likes * randomInRange(0.02, 0.15));
    const clicks = Math.round(views * randomInRange(0.01, 0.05));

    return {
      channel,
      publicationId,
      views,
      likes,
      comments,
      shares,
      clicks,
      measuredAt: new Date(),
    };
  }

  /**
   * Get base view count for a channel (realistic ranges per platform)
   */
  private getBaseViewsForChannel(channel: Channel): number {
    const baseViews: Record<Channel, number> = {
      'medium': 500,
      'linkedin': 800,
      'x-thread': 1200,
      'brunch': 300,
      'newsletter': 400,
      'blog': 600,
      'threads': 900,
      'kakao': 350,
      'youtube': 2000,
      'shorts': 5000,
      'reels': 4000,
      'tiktok': 6000,
      'ig-carousel': 1500,
      'ig-single': 1000,
      'ig-story': 2000,
      'webtoon': 800,
    };

    return baseViews[channel];
  }
}

/**
 * Generate a random number within a range
 */
function randomInRange(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}
