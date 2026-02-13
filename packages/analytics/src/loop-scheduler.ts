/**
 * Loop scheduler - orchestrates all BML learning loop executions
 */

import { Ok, Err, type Result, type Metric, type Publication, type Content } from '@content-forge/core';
import type { ClaudeApiConfig } from '@content-forge/pipelines';
import type {
  LoopError,
  WeeklyAnalysis,
  ContentAnalysis,
  HighPerformancePattern,
  PromptUpdate,
} from './loop-types.js';
import { runWeeklyLoop } from './weekly-loop.js';
import { analyzeContentPerformance } from './content-loop.js';
import { extractPatterns, suggestPromptUpdates } from './prompt-evolution.js';

export interface LoopSchedulerConfig {
  claudeApiConfig: ClaudeApiConfig;
  weeklyEnabled?: boolean;
  contentLoopEnabled?: boolean;
  promptEvolutionEnabled?: boolean;
}

export interface LoopResult {
  weeklyAnalysis?: WeeklyAnalysis;
  contentAnalyses: ContentAnalysis[];
  patterns: HighPerformancePattern[];
  promptUpdates: PromptUpdate[];
  executedAt: string;
}

/**
 * Run all BML learning loops.
 *
 * 1. Run weekly loop (if enough data)
 * 2. Run content loop for recent publications (published 48+ hours ago)
 * 3. Extract patterns from high performers
 * 4. Suggest prompt updates
 * 5. Return combined results
 */
export async function runAllLoops(
  metrics: Metric[],
  publications: Publication[],
  contents: Content[],
  config: LoopSchedulerConfig,
): Promise<Result<LoopResult, LoopError>> {
  try {
    const weeklyEnabled = config.weeklyEnabled ?? true;
    const contentLoopEnabled = config.contentLoopEnabled ?? true;
    const promptEvolutionEnabled = config.promptEvolutionEnabled ?? true;

    let weeklyAnalysis: WeeklyAnalysis | undefined;
    const contentAnalyses: ContentAnalysis[] = [];
    let patterns: HighPerformancePattern[] = [];
    let promptUpdates: PromptUpdate[] = [];

    // 1. Weekly loop
    if (weeklyEnabled && metrics.length > 0) {
      const weeklyResult = await runWeeklyLoop(metrics, publications, {
        claudeApiConfig: config.claudeApiConfig,
      });

      if (weeklyResult.ok) {
        weeklyAnalysis = weeklyResult.value;
      }
      // Non-fatal: continue even if weekly loop fails
    }

    // 2. Content loop for publications 48+ hours old
    if (contentLoopEnabled) {
      const now = new Date();
      const hoursThreshold = 48;

      for (const pub of publications) {
        const hoursElapsed = (now.getTime() - pub.publishedAt.getTime()) / (1000 * 60 * 60);
        if (hoursElapsed < hoursThreshold) {
          continue;
        }

        // Get historical metrics for the same channel
        const historicalMetrics = metrics.filter((m) => {
          const matchingPub = publications.find((p) => p.id === m.publicationId);
          return matchingPub && matchingPub.channel === pub.channel && matchingPub.id !== pub.id;
        });

        const analysis = analyzeContentPerformance(pub, metrics, historicalMetrics);
        contentAnalyses.push(analysis);
      }
    }

    // 3. Extract patterns from high performers
    if (promptEvolutionEnabled) {
      const highPerformers = contentAnalyses.filter((a) => a.performance === 'high');

      if (highPerformers.length > 0) {
        const patternsResult = await extractPatterns(highPerformers, contents, {
          claudeApiConfig: config.claudeApiConfig,
        });

        if (patternsResult.ok) {
          patterns = patternsResult.value;
        }
      }

      // 4. Suggest prompt updates
      if (patterns.length > 0) {
        const updatesResult = await suggestPromptUpdates(patterns, {
          claudeApiConfig: config.claudeApiConfig,
        });

        if (updatesResult.ok) {
          promptUpdates = updatesResult.value;
        }
      }
    }

    const result: LoopResult = {
      contentAnalyses,
      patterns,
      promptUpdates,
      executedAt: new Date().toISOString(),
    };
    if (weeklyAnalysis !== undefined) {
      result.weeklyAnalysis = weeklyAnalysis;
    }
    return Ok(result);
  } catch (cause: unknown) {
    return Err({
      message: cause instanceof Error ? cause.message : 'Failed to run all loops',
      loop: 'weekly',
      details: cause,
    });
  }
}
