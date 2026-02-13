/**
 * Content performance analysis loop
 * Analyzes individual content performance after publication (48-hour early reaction)
 */

import type { Metric, Publication } from '@content-forge/core';
import type { ContentAnalysis } from './loop-types.js';

export interface ContentLoopConfig {
  hoursAfterPublish?: number;
}

/**
 * Analyze the performance of a single publication against historical data.
 *
 * 1. Get latest metrics for the publication
 * 2. Calculate engagement rate
 * 3. Compare against historical data for the same channel
 * 4. Calculate percentile rank
 * 5. Classify as high/medium/low based on percentile (>75: high, 25-75: medium, <25: low)
 * 6. Generate insights
 */
export function analyzeContentPerformance(
  publication: Publication,
  metrics: Metric[],
  historicalMetrics: Metric[],
  config?: ContentLoopConfig,
): ContentAnalysis {
  const hoursAfterPublish = config?.hoursAfterPublish ?? 48;

  // Get the latest metric for this publication
  const pubMetrics = metrics
    .filter((m) => m.publicationId === publication.id)
    .sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime());

  const latestMetric = pubMetrics[0];

  const views = latestMetric?.views ?? 0;
  const likes = latestMetric?.likes ?? 0;
  const comments = latestMetric?.comments ?? 0;
  const shares = latestMetric?.shares ?? 0;
  const totalEngagement = likes + comments + shares;
  const engagementRate = views > 0 ? totalEngagement / views : 0;

  // Calculate hours elapsed since publish
  const now = latestMetric?.measuredAt ?? new Date();
  const hoursElapsed = (now.getTime() - publication.publishedAt.getTime()) / (1000 * 60 * 60);

  // Calculate percentile rank against historical data for the same channel
  const historicalEngagements = historicalMetrics
    .map((m) => m.likes + m.comments + m.shares);

  const percentileRank = calculatePercentileRank(totalEngagement, historicalEngagements);

  // Classify performance
  let performance: 'high' | 'medium' | 'low';
  if (percentileRank > 75) {
    performance = 'high';
  } else if (percentileRank >= 25) {
    performance = 'medium';
  } else {
    performance = 'low';
  }

  // Generate insights
  const insights = generateInsights(
    { views, likes, comments, shares, engagementRate },
    historicalMetrics,
    hoursElapsed,
    hoursAfterPublish,
  );

  return {
    publicationId: publication.id,
    channel: publication.channel,
    publishedAt: publication.publishedAt.toISOString(),
    hoursElapsed: Math.round(hoursElapsed * 100) / 100,
    metrics: {
      views,
      likes,
      comments,
      shares,
      engagementRate: Math.round(engagementRate * 10000) / 10000,
    },
    performance,
    percentileRank: Math.round(percentileRank * 100) / 100,
    insights,
  };
}

/**
 * Calculate the percentile rank of a value against a distribution
 */
function calculatePercentileRank(value: number, distribution: number[]): number {
  if (distribution.length === 0) {
    return 50; // Default to median when no historical data
  }

  const belowCount = distribution.filter((v) => v < value).length;
  const equalCount = distribution.filter((v) => v === value).length;

  // Percentile = (B + 0.5 * E) / N * 100
  return ((belowCount + 0.5 * equalCount) / distribution.length) * 100;
}

/**
 * Generate human-readable insights about the content's performance
 */
function generateInsights(
  current: { views: number; likes: number; comments: number; shares: number; engagementRate: number },
  historicalMetrics: Metric[],
  hoursElapsed: number,
  hoursAfterPublish: number,
): string[] {
  const insights: string[] = [];

  if (historicalMetrics.length === 0) {
    insights.push('No historical data available for comparison');
    return insights;
  }

  // Calculate historical averages
  const histCount = historicalMetrics.length;
  const avgViews = historicalMetrics.reduce((sum, m) => sum + m.views, 0) / histCount;
  const avgLikes = historicalMetrics.reduce((sum, m) => sum + m.likes, 0) / histCount;
  const avgComments = historicalMetrics.reduce((sum, m) => sum + m.comments, 0) / histCount;
  const avgShares = historicalMetrics.reduce((sum, m) => sum + m.shares, 0) / histCount;

  // Compare each metric to historical average
  if (avgViews > 0) {
    const viewsRatio = current.views / avgViews;
    if (viewsRatio >= 2) {
      insights.push(`Views are ${viewsRatio.toFixed(1)}x above average`);
    } else if (viewsRatio <= 0.5) {
      insights.push('Views are below median');
    }
  }

  if (avgComments > 0) {
    const commentsRatio = current.comments / avgComments;
    if (commentsRatio >= 3) {
      insights.push(`Comments are ${commentsRatio.toFixed(0)}x above average`);
    } else if (commentsRatio <= 0.3) {
      insights.push('Comments are significantly below average');
    }
  }

  if (avgLikes > 0) {
    const likesRatio = current.likes / avgLikes;
    if (likesRatio >= 2) {
      insights.push(`Likes are ${likesRatio.toFixed(1)}x above average`);
    } else if (likesRatio <= 0.5) {
      insights.push('Likes are below average');
    }
  }

  if (avgShares > 0) {
    const sharesRatio = current.shares / avgShares;
    if (sharesRatio >= 2) {
      insights.push(`Shares are ${sharesRatio.toFixed(1)}x above average`);
    } else if (sharesRatio <= 0.5) {
      insights.push('Shares are below average');
    }
  }

  // Early performance indicator
  if (hoursElapsed < hoursAfterPublish) {
    insights.push(`Only ${Math.round(hoursElapsed)} hours since publish (early data)`);
  }

  // Engagement rate insight
  const historicalEngagementRates = historicalMetrics.map((m) => {
    const eng = m.likes + m.comments + m.shares;
    return m.views > 0 ? eng / m.views : 0;
  });
  const avgEngRate = historicalEngagementRates.reduce((a, b) => a + b, 0) / histCount;

  if (avgEngRate > 0 && current.engagementRate > avgEngRate * 1.5) {
    insights.push('Engagement rate is significantly above channel average');
  } else if (avgEngRate > 0 && current.engagementRate < avgEngRate * 0.5) {
    insights.push('Engagement rate is below channel average');
  }

  if (insights.length === 0) {
    insights.push('Performance is within normal range');
  }

  return insights;
}
