/**
 * Researcher Agent - trend research and keyword analysis
 */

import { Ok, Err, type Result, type Task, type Material } from '@content-forge/core';
import { BaseAgent } from './base-agent.js';
import type { AgentError, TaskOutput } from './types.js';

interface ResearcherInput {
  materials: Material[];
  focusKeywords?: string[];
}

interface TrendItem {
  keyword: string;
  score: number;
  volume: number;
}

interface ResearcherOutput {
  trends: TrendItem[];
  insights: string[];
  recommendations: string[];
}

export class ResearcherAgent extends BaseAgent {
  /**
   * Execute trend research and keyword analysis
   */
  protected async execute(task: Task): Promise<Result<TaskOutput, AgentError>> {
    await Promise.resolve();
    try {
      // Validate input
      const input = task.input as unknown as ResearcherInput;

      if (!input.materials || !Array.isArray(input.materials)) {
        return Err({
          agent: this.name,
          message: 'Invalid input: materials array is required',
        });
      }

      const focusKeywords = input.focusKeywords ?? [];

      // Extract keywords from materials
      const keywordFrequency = this.extractKeywords(input.materials, focusKeywords);

      // Build trend items
      const trends = this.buildTrends(keywordFrequency);

      // Generate insights
      const insights = this.generateInsights(input.materials, trends);

      // Generate recommendations
      const recommendations = this.generateRecommendations(trends, focusKeywords);

      const output: ResearcherOutput = {
        trends,
        insights,
        recommendations,
      };

      return Promise.resolve(Ok({
        agentId: this.id,
        taskId: task.id,
        result: output as unknown as Record<string, unknown>,
        completedAt: new Date(),
      }));
    } catch (err) {
      return Promise.resolve(Err({
        agent: this.name,
        message: `Execution failed: ${String(err)}`,
        cause: err,
      }));
    }
  }

  /**
   * Extract keyword frequencies from materials
   */
  private extractKeywords(materials: Material[], focusKeywords: string[]): Map<string, number> {
    const frequency = new Map<string, number>();

    // Count tag occurrences across all materials
    for (const material of materials) {
      for (const tag of material.tags) {
        const lower = tag.toLowerCase();
        frequency.set(lower, (frequency.get(lower) ?? 0) + 1);
      }

      // Extract words from titles
      const words = material.title
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3);

      for (const word of words) {
        frequency.set(word, (frequency.get(word) ?? 0) + 1);
      }
    }

    // Boost focus keywords
    for (const keyword of focusKeywords) {
      const lower = keyword.toLowerCase();
      const current = frequency.get(lower) ?? 0;
      frequency.set(lower, current + 3);
    }

    return frequency;
  }

  /**
   * Build trend items from keyword frequencies
   */
  private buildTrends(keywordFrequency: Map<string, number>): TrendItem[] {
    const entries = Array.from(keywordFrequency.entries());

    return entries
      .map(([keyword, count]) => ({
        keyword,
        score: Math.min(count * 2, 10),
        volume: count * 100,
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Generate insights from materials and trends
   */
  private generateInsights(materials: Material[], trends: TrendItem[]): string[] {
    const insights: string[] = [];

    if (materials.length === 0) {
      insights.push('No materials available for analysis');
      return insights;
    }

    // Material volume insight
    insights.push(`Analyzed ${materials.length} materials`);

    // Top trend insight
    if (trends.length > 0) {
      const topTrend = trends[0];
      insights.push(`Top trending keyword: "${topTrend?.keyword}" with score ${topTrend?.score}`);
    }

    // Source diversity
    const uniqueSources = new Set(materials.map(m => m.source));
    insights.push(`Content sourced from ${uniqueSources.size} unique sources`);

    // Average score
    const avgScore = materials.reduce((sum, m) => sum + m.score, 0) / materials.length;
    insights.push(`Average material score: ${avgScore.toFixed(1)}`);

    // High-quality material count
    const highQuality = materials.filter(m => m.score >= 7).length;
    if (highQuality > 0) {
      insights.push(`${highQuality} high-quality materials (score >= 7) identified`);
    }

    return insights;
  }

  /**
   * Generate recommendations based on trends and focus keywords
   */
  private generateRecommendations(trends: TrendItem[], focusKeywords: string[]): string[] {
    const recommendations: string[] = [];

    if (trends.length === 0) {
      recommendations.push('Collect more materials to identify trends');
      return recommendations;
    }

    // Top keywords recommendation
    const topKeywords = trends.slice(0, 3).map(t => t.keyword);
    recommendations.push(`Focus content creation on: ${topKeywords.join(', ')}`);

    // Gap analysis - find focus keywords not in top trends
    if (focusKeywords.length > 0) {
      const topTrendKeywords = new Set(trends.slice(0, 5).map(t => t.keyword));
      const gaps = focusKeywords.filter(k => !topTrendKeywords.has(k.toLowerCase()));

      if (gaps.length > 0) {
        recommendations.push(`Competitive gaps detected for: ${gaps.join(', ')}`);
      }
    }

    // Volume-based recommendation
    const highVolume = trends.filter(t => t.volume >= 300);
    if (highVolume.length > 0) {
      recommendations.push(`High-volume keywords to target: ${highVolume.map(t => t.keyword).join(', ')}`);
    }

    // Low competition opportunity
    const lowScore = trends.filter(t => t.score <= 4 && t.volume > 0);
    if (lowScore.length > 0) {
      recommendations.push(`Emerging topics with low competition: ${lowScore.slice(0, 3).map(t => t.keyword).join(', ')}`);
    }

    return recommendations;
  }
}
