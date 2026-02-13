/**
 * A/B testing framework for content optimization
 *
 * Manages creation, tracking, and statistical analysis of A/B tests
 * across different content variables (title, thumbnail, CTA, publish-time).
 */

import {
  createLogger,
  Ok,
  Err,
  type Logger,
  type Result,
  type Channel,
} from '@content-forge/core';
import type { AnalyticsError } from './types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Variables that can be A/B tested */
export type ABTestVariable = 'title' | 'thumbnail' | 'cta' | 'publish-time';

/**
 * A single variant in an A/B test.
 */
export interface ABVariant {
  id: string;
  label: string;
  value: string;
  metrics: {
    views: number;
    engagement: number;
    clicks: number;
  };
  sampleSize: number;
}

/**
 * An A/B test definition.
 */
export interface ABTest {
  id: string;
  name: string;
  channel: Channel;
  variable: ABTestVariable;
  variants: ABVariant[];
  status: 'draft' | 'running' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  winnerId?: string;
}

/**
 * Result of analyzing an A/B test.
 */
export interface ABTestResult {
  testId: string;
  winner: ABVariant;
  confidence: number;
  improvement: number;
  recommendation: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let idCounter = 0;

function generateId(prefix: string): string {
  idCounter++;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

/**
 * Simple chi-square approximation for two proportions.
 * Returns a confidence score between 0 and 1.
 */
function chiSquareConfidence(
  successes1: number,
  total1: number,
  successes2: number,
  total2: number,
): number {
  if (total1 === 0 || total2 === 0) {
    return 0;
  }

  const p1 = successes1 / total1;
  const p2 = successes2 / total2;
  const pPooled = (successes1 + successes2) / (total1 + total2);

  if (pPooled === 0 || pPooled === 1) {
    return 0;
  }

  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / total1 + 1 / total2));

  if (se === 0) {
    return 0;
  }

  const z = Math.abs(p1 - p2) / se;

  // Approximate p-value from z-score using a simple sigmoid approximation
  // This maps z to a confidence level (0 to 1)
  // z >= 1.96 -> ~95% confidence, z >= 2.58 -> ~99%
  const confidence = 1 - Math.exp(-0.5 * z * z);

  return Math.min(confidence, 0.999);
}

// ---------------------------------------------------------------------------
// ABTestManager
// ---------------------------------------------------------------------------

export class ABTestManager {
  private readonly logger: Logger;
  private readonly tests: Map<string, ABTest> = new Map();

  constructor() {
    this.logger = createLogger({ agentId: 'analytics:ab-testing' });
  }

  /**
   * Create a new A/B test.
   */
  createTest(
    name: string,
    channel: Channel,
    variable: ABTestVariable,
    variants: Array<Omit<ABVariant, 'id' | 'metrics' | 'sampleSize'>>,
  ): Result<ABTest, AnalyticsError> {
    try {
      if (variants.length < 2) {
        return Err({
          source: 'ABTestManager',
          message: 'A/B test requires at least 2 variants',
        });
      }

      if (!name.trim()) {
        return Err({
          source: 'ABTestManager',
          message: 'Test name must not be empty',
        });
      }

      const fullVariants: ABVariant[] = variants.map((v) => ({
        id: generateId('var'),
        label: v.label,
        value: v.value,
        metrics: { views: 0, engagement: 0, clicks: 0 },
        sampleSize: 0,
      }));

      const test: ABTest = {
        id: generateId('test'),
        name,
        channel,
        variable,
        variants: fullVariants,
        status: 'running',
        startedAt: new Date(),
      };

      this.tests.set(test.id, test);

      this.logger.info('create_test', {
        testId: test.id,
        name,
        channel,
        variable,
        variantCount: variants.length,
      });

      return Ok(test);
    } catch (cause: unknown) {
      return Err({
        source: 'ABTestManager',
        message: 'Failed to create A/B test',
        cause,
      });
    }
  }

  /**
   * Record metrics for a specific variant in a test.
   */
  recordMetric(
    testId: string,
    variantId: string,
    metric: { views: number; engagement: number; clicks: number },
  ): Result<void, AnalyticsError> {
    const test = this.tests.get(testId);

    if (!test) {
      return Err({
        source: 'ABTestManager',
        message: `Test not found: ${testId}`,
      });
    }

    if (test.status !== 'running') {
      return Err({
        source: 'ABTestManager',
        message: `Cannot record metrics for test with status: ${test.status}`,
      });
    }

    const variant = test.variants.find((v) => v.id === variantId);

    if (!variant) {
      return Err({
        source: 'ABTestManager',
        message: `Variant not found: ${variantId} in test ${testId}`,
      });
    }

    variant.metrics.views += metric.views;
    variant.metrics.engagement += metric.engagement;
    variant.metrics.clicks += metric.clicks;
    variant.sampleSize += 1;

    this.logger.debug('record_metric', {
      testId,
      variantId,
      views: metric.views,
      engagement: metric.engagement,
      clicks: metric.clicks,
    });

    return Ok(undefined);
  }

  /**
   * Analyze the results of an A/B test.
   * Uses chi-square approximation for statistical significance.
   */
  analyzeResults(testId: string): Result<ABTestResult, AnalyticsError> {
    const test = this.tests.get(testId);

    if (!test) {
      return Err({
        source: 'ABTestManager',
        message: `Test not found: ${testId}`,
      });
    }

    const totalSamples = test.variants.reduce((sum, v) => sum + v.sampleSize, 0);

    if (totalSamples === 0) {
      return Err({
        source: 'ABTestManager',
        message: 'No data recorded yet for this test',
      });
    }

    // Calculate engagement rate for each variant
    const variantRates = test.variants.map((v) => ({
      variant: v,
      engagementRate: v.metrics.views > 0
        ? v.metrics.engagement / v.metrics.views
        : 0,
    }));

    // Sort by engagement rate descending
    variantRates.sort((a, b) => b.engagementRate - a.engagementRate);

    const winner = variantRates[0];
    const runnerUp = variantRates[1];

    if (!winner) {
      return Err({ source: 'ab-testing', message: 'No variants available for analysis' });
    }

    // Calculate confidence using chi-square approximation
    let confidence = 0;
    let improvement = 0;

    if (runnerUp && runnerUp.variant.metrics.views > 0) {
      confidence = chiSquareConfidence(
        winner.variant.metrics.engagement,
        winner.variant.metrics.views,
        runnerUp.variant.metrics.engagement,
        runnerUp.variant.metrics.views,
      );

      improvement = runnerUp.engagementRate > 0
        ? ((winner.engagementRate - runnerUp.engagementRate) / runnerUp.engagementRate) * 100
        : 0;
    }

    // Generate recommendation
    const recommendation = this.generateRecommendation(
      test,
      winner.variant,
      confidence,
      improvement,
    );

    // Mark test as completed
    test.status = 'completed';
    test.completedAt = new Date();
    test.winnerId = winner.variant.id;

    const result: ABTestResult = {
      testId,
      winner: winner.variant,
      confidence,
      improvement,
      recommendation,
    };

    this.logger.info('analyze_results', {
      testId,
      winnerId: winner.variant.id,
      winnerLabel: winner.variant.label,
      confidence,
      improvement,
    });

    return Ok(result);
  }

  /**
   * Get a test by its ID.
   */
  getTest(testId: string): ABTest | undefined {
    return this.tests.get(testId);
  }

  /**
   * Generate a human-readable recommendation based on test results.
   */
  private generateRecommendation(
    test: ABTest,
    winner: ABVariant,
    confidence: number,
    improvement: number,
  ): string {
    if (confidence < 0.9) {
      return `Test "${test.name}" on ${test.channel}: Results are not yet statistically significant (confidence: ${(confidence * 100).toFixed(1)}%). Consider collecting more data before making changes.`;
    }

    if (confidence >= 0.95) {
      return `Test "${test.name}" on ${test.channel}: Strong winner found. Variant "${winner.label}" outperforms by ${improvement.toFixed(1)}% with ${(confidence * 100).toFixed(1)}% confidence. Recommend adopting this ${test.variable} immediately.`;
    }

    return `Test "${test.name}" on ${test.channel}: Variant "${winner.label}" shows a ${improvement.toFixed(1)}% improvement with ${(confidence * 100).toFixed(1)}% confidence. Consider adopting this ${test.variable}.`;
  }
}
