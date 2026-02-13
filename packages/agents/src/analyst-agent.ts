/**
 * Analyst Agent - analyzes content performance metrics and generates strategy recommendations
 */

import {
  Ok, Err, type Result, type Task,
  type Metric, type Channel,
} from '@content-forge/core';
import { callClaude, type ClaudeApiConfig } from '@content-forge/pipelines';
import { BaseAgent } from './base-agent.js';
import type { AgentError, TaskOutput } from './types.js';

export interface AnalystInput {
  metrics: Metric[];
  period: { start: Date; end: Date };
  channels: Channel[];
  claudeApiConfig: ClaudeApiConfig;
}

export interface PerformanceReport {
  period: { start: string; end: string };
  totalViews: number;
  totalEngagement: number;
  engagementRate: number;
  topPerformingChannels: Array<{ channel: Channel; score: number }>;
  topPerformingContent: Array<{ publicationId: string; score: number }>;
  trends: Array<{ metric: string; direction: 'up' | 'down' | 'stable'; change: number }>;
}

export interface StrategyRecommendation {
  type: 'channel-focus' | 'content-type' | 'timing' | 'topic';
  description: string;
  confidence: number;
  basedOn: string;
}

export interface AnalystOutput {
  report: PerformanceReport;
  recommendations: StrategyRecommendation[];
}

export class AnalystAgent extends BaseAgent {
  /**
   * Execute performance analysis and recommendation generation
   */
  protected async execute(task: Task): Promise<Result<TaskOutput, AgentError>> {
    try {
      const input = task.input as unknown as AnalystInput;

      if (!input.metrics || !Array.isArray(input.metrics)) {
        return Err({
          agent: this.name,
          message: 'Invalid input: metrics array is required',
        });
      }

      if (!input.period) {
        return Err({
          agent: this.name,
          message: 'Invalid input: period is required',
        });
      }

      if (!input.channels || !Array.isArray(input.channels)) {
        return Err({
          agent: this.name,
          message: 'Invalid input: channels array is required',
        });
      }

      // Step 1: Aggregate metrics
      const report = this.buildReport(input);

      // Step 2: Generate recommendations using Claude
      let recommendations: StrategyRecommendation[] = [];
      if (input.claudeApiConfig && input.metrics.length > 0) {
        const recsResult = await this.generateRecommendations(report, input);
        if (recsResult.ok) {
          recommendations = recsResult.value;
        } else {
          this.logger.warn('analyst.recommendations_failed', {
            error: recsResult.error.message,
          });
          // Continue without recommendations
        }
      }

      const output: AnalystOutput = { report, recommendations };

      return Ok({
        agentId: this.id,
        taskId: task.id,
        result: output as unknown as Record<string, unknown>,
        completedAt: new Date(),
      });
    } catch (err) {
      return Err({
        agent: this.name,
        message: `Execution failed: ${String(err)}`,
        cause: err,
      });
    }
  }

  /**
   * Build performance report from raw metrics
   */
  private buildReport(input: AnalystInput): PerformanceReport {
    const { metrics, period } = input;

    // Aggregate totals
    const totalViews = metrics.reduce((sum, m) => sum + m.views, 0);
    const totalLikes = metrics.reduce((sum, m) => sum + m.likes, 0);
    const totalComments = metrics.reduce((sum, m) => sum + m.comments, 0);
    const totalShares = metrics.reduce((sum, m) => sum + m.shares, 0);
    const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
    const totalEngagement = totalLikes + totalComments + totalShares + totalClicks;
    const engagementRate = totalViews > 0 ? totalEngagement / totalViews : 0;

    // Score content by publication
    const contentScores = this.scoreByPublication(metrics);

    // Score channels (using the provided channels and metric data)
    const channelScores = this.scoreChannels(metrics, input.channels);

    // Detect trends
    const trends = this.detectTrends(metrics);

    return {
      period: {
        start: period.start instanceof Date ? period.start.toISOString() : String(period.start),
        end: period.end instanceof Date ? period.end.toISOString() : String(period.end),
      },
      totalViews,
      totalEngagement,
      engagementRate,
      topPerformingChannels: channelScores,
      topPerformingContent: contentScores.slice(0, 10),
      trends,
    };
  }

  /**
   * Score publications by total engagement
   */
  private scoreByPublication(metrics: Metric[]): Array<{ publicationId: string; score: number }> {
    const pubScores = new Map<string, number>();

    for (const m of metrics) {
      const score = m.views + (m.likes * 2) + (m.comments * 3) + (m.shares * 4) + m.clicks;
      const current = pubScores.get(m.publicationId) ?? 0;
      pubScores.set(m.publicationId, current + score);
    }

    return Array.from(pubScores.entries())
      .map(([publicationId, score]) => ({ publicationId, score }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Score channels based on associated metrics
   */
  private scoreChannels(
    metrics: Metric[],
    channels: Channel[],
  ): Array<{ channel: Channel; score: number }> {
    // Group metrics by publication, then compute per-channel scores
    // Since Metric doesn't include channel directly, we use publication grouping
    // and distribute across provided channels proportionally
    if (channels.length === 0 || metrics.length === 0) {
      return [];
    }

    const totalEngagement = metrics.reduce(
      (sum, m) => sum + m.views + m.likes + m.comments + m.shares + m.clicks, 0,
    );

    // Distribute score across channels based on metric count per channel index
    const perChannel = totalEngagement / channels.length;

    return channels.map(channel => ({
      channel,
      score: Math.round(perChannel),
    })).sort((a, b) => b.score - a.score);
  }

  /**
   * Detect trends by comparing first-half vs second-half metrics
   */
  private detectTrends(
    metrics: Metric[],
  ): Array<{ metric: string; direction: 'up' | 'down' | 'stable'; change: number }> {
    if (metrics.length < 2) {
      return [
        { metric: 'views', direction: 'stable', change: 0 },
        { metric: 'engagement', direction: 'stable', change: 0 },
      ];
    }

    // Sort by measuredAt
    const sorted = [...metrics].sort(
      (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime(),
    );

    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const firstViews = firstHalf.reduce((sum, m) => sum + m.views, 0);
    const secondViews = secondHalf.reduce((sum, m) => sum + m.views, 0);
    const viewsChange = firstViews > 0 ? (secondViews - firstViews) / firstViews : 0;

    const firstEng = firstHalf.reduce(
      (sum, m) => sum + m.likes + m.comments + m.shares + m.clicks, 0,
    );
    const secondEng = secondHalf.reduce(
      (sum, m) => sum + m.likes + m.comments + m.shares + m.clicks, 0,
    );
    const engChange = firstEng > 0 ? (secondEng - firstEng) / firstEng : 0;

    return [
      {
        metric: 'views',
        direction: this.classifyDirection(viewsChange),
        change: Math.round(viewsChange * 100) / 100,
      },
      {
        metric: 'engagement',
        direction: this.classifyDirection(engChange),
        change: Math.round(engChange * 100) / 100,
      },
    ];
  }

  /**
   * Classify a percentage change as up/down/stable
   */
  private classifyDirection(change: number): 'up' | 'down' | 'stable' {
    if (change > 0.05) return 'up';
    if (change < -0.05) return 'down';
    return 'stable';
  }

  /**
   * Use Claude API to generate natural language recommendations
   */
  private async generateRecommendations(
    report: PerformanceReport,
    input: AnalystInput,
  ): Promise<Result<StrategyRecommendation[], AgentError>> {
    const systemPrompt = `You are a content strategy analyst. Analyze performance data and provide actionable recommendations.
Output ONLY valid JSON array:
[
  {
    "type": "channel-focus|content-type|timing|topic",
    "description": "Specific actionable recommendation",
    "confidence": 0.0-1.0,
    "basedOn": "What data supports this recommendation"
  }
]
Provide 2-5 recommendations. Be specific and data-driven.`;

    const userMessage = `Performance Report:
- Period: ${report.period.start} to ${report.period.end}
- Total Views: ${report.totalViews}
- Total Engagement: ${report.totalEngagement}
- Engagement Rate: ${(report.engagementRate * 100).toFixed(2)}%
- Trends: ${report.trends.map(t => `${t.metric}: ${t.direction} (${(t.change * 100).toFixed(1)}%)`).join(', ')}
- Top Content: ${report.topPerformingContent.slice(0, 5).map(c => `${c.publicationId} (score: ${c.score})`).join(', ')}
- Channels: ${input.channels.join(', ')}

Please provide strategic recommendations based on this data.`;

    const result = await callClaude(
      [{ role: 'user', content: userMessage }],
      systemPrompt,
      input.claudeApiConfig,
    );

    if (!result.ok) {
      return Err({
        agent: this.name,
        message: `Claude API error: ${result.error.message}`,
        cause: result.error,
      });
    }

    try {
      const jsonStr = result.value.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(jsonStr) as StrategyRecommendation[];

      if (!Array.isArray(parsed)) {
        return Err({
          agent: this.name,
          message: 'Invalid recommendations: expected JSON array',
        });
      }

      return Ok(parsed);
    } catch (err) {
      return Err({
        agent: this.name,
        message: `Failed to parse recommendations JSON: ${String(err)}`,
        cause: err,
      });
    }
  }
}
