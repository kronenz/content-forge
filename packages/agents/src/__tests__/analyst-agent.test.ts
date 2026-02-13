/**
 * Analyst agent tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Task, AgentConfig, Metric, Channel } from '@content-forge/core';
import { Ok, Err } from '@content-forge/core';
import { AnalystAgent } from '../analyst-agent.js';
import { InMemoryLockManager } from '../lock-manager.js';

// Mock callClaude
vi.mock('@content-forge/pipelines', () => ({
  callClaude: vi.fn(),
}));

import { callClaude } from '@content-forge/pipelines';

const mockCallClaude = vi.mocked(callClaude);

const TEST_CLAUDE_CONFIG = {
  apiKey: 'test-key',
  model: 'claude-sonnet-4-20250514',
  maxRetries: 3,
  baseDelayMs: 100,
};

const createMetric = (
  id: string,
  publicationId: string,
  views: number,
  likes: number,
  comments: number,
  shares: number,
  clicks: number,
  daysAgo = 0,
): Metric => ({
  id,
  publicationId,
  views,
  likes,
  comments,
  shares,
  clicks,
  measuredAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
});

const VALID_RECOMMENDATIONS = JSON.stringify([
  {
    type: 'channel-focus',
    description: 'Focus more on LinkedIn content',
    confidence: 0.85,
    basedOn: 'LinkedIn shows highest engagement rate',
  },
  {
    type: 'timing',
    description: 'Post during morning hours for better reach',
    confidence: 0.72,
    basedOn: 'Morning posts have 30% more views',
  },
]);

describe('AnalystAgent', () => {
  let agent: AnalystAgent;
  let lockManager: InMemoryLockManager;

  const createTask = (
    metrics: Metric[],
    channels: Channel[] = ['medium', 'linkedin'],
    period = { start: new Date('2025-01-01'), end: new Date('2025-01-31') },
  ): Task => ({
    id: 'task-1',
    type: 'analyst',
    status: 'pending',
    agentId: 'analyst-1',
    input: {
      metrics,
      period,
      channels,
      claudeApiConfig: TEST_CLAUDE_CONFIG,
    },
    output: null,
    error: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
  });

  beforeEach(() => {
    vi.clearAllMocks();

    const config: AgentConfig = {
      id: 'analyst-1',
      name: 'Analyst',
      type: 'analyst',
    };
    lockManager = new InMemoryLockManager();
    agent = new AnalystAgent(config, lockManager);

    // Default mock: return valid recommendations
    mockCallClaude.mockResolvedValue(Ok(VALID_RECOMMENDATIONS));
  });

  describe('metric aggregation', () => {
    it('should aggregate total views and engagement', async () => {
      const metrics = [
        createMetric('m1', 'pub-1', 1000, 50, 10, 5, 20),
        createMetric('m2', 'pub-2', 2000, 100, 20, 10, 40),
      ];

      const task = createTask(metrics);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as {
          report: {
            totalViews: number;
            totalEngagement: number;
          };
        };
        expect(output.report.totalViews).toBe(3000);
        // engagement = likes + comments + shares + clicks
        // = (50+100) + (10+20) + (5+10) + (20+40) = 150 + 30 + 15 + 60 = 255
        expect(output.report.totalEngagement).toBe(255);
      }
    });
  });

  describe('engagement rate calculation', () => {
    it('should calculate correct engagement rate', async () => {
      const metrics = [
        createMetric('m1', 'pub-1', 1000, 50, 10, 5, 20),
      ];

      const task = createTask(metrics);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as {
          report: { engagementRate: number };
        };
        // engagement = 50 + 10 + 5 + 20 = 85
        // rate = 85 / 1000 = 0.085
        expect(output.report.engagementRate).toBeCloseTo(0.085, 3);
      }
    });

    it('should handle zero views without division error', async () => {
      const metrics = [
        createMetric('m1', 'pub-1', 0, 0, 0, 0, 0),
      ];

      const task = createTask(metrics);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as {
          report: { engagementRate: number };
        };
        expect(output.report.engagementRate).toBe(0);
      }
    });
  });

  describe('channel ranking', () => {
    it('should rank channels by score', async () => {
      const metrics = [
        createMetric('m1', 'pub-1', 1000, 50, 10, 5, 20),
        createMetric('m2', 'pub-2', 2000, 100, 20, 10, 40),
      ];

      const task = createTask(metrics, ['medium', 'linkedin', 'blog']);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as {
          report: {
            topPerformingChannels: Array<{ channel: string; score: number }>;
          };
        };
        expect(output.report.topPerformingChannels).toHaveLength(3);
        // Each channel should have a score
        for (const ch of output.report.topPerformingChannels) {
          expect(ch.score).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should return empty channel ranking when no channels provided', async () => {
      const metrics = [
        createMetric('m1', 'pub-1', 1000, 50, 10, 5, 20),
      ];

      const task = createTask(metrics, []);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as {
          report: {
            topPerformingChannels: unknown[];
          };
        };
        expect(output.report.topPerformingChannels).toHaveLength(0);
      }
    });
  });

  describe('trend detection', () => {
    it('should detect upward trend when second half is higher', async () => {
      const metrics = [
        createMetric('m1', 'pub-1', 100, 5, 1, 0, 2, 30),  // older
        createMetric('m2', 'pub-2', 100, 5, 1, 0, 2, 20),  // older
        createMetric('m3', 'pub-3', 500, 25, 5, 2, 10, 10), // newer
        createMetric('m4', 'pub-4', 500, 25, 5, 2, 10, 5),  // newer
      ];

      const task = createTask(metrics);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as {
          report: {
            trends: Array<{ metric: string; direction: string; change: number }>;
          };
        };
        const viewsTrend = output.report.trends.find(t => t.metric === 'views');
        expect(viewsTrend?.direction).toBe('up');
        expect(viewsTrend?.change).toBeGreaterThan(0);
      }
    });

    it('should detect downward trend when second half is lower', async () => {
      const metrics = [
        createMetric('m1', 'pub-1', 500, 25, 5, 2, 10, 30), // older, higher
        createMetric('m2', 'pub-2', 500, 25, 5, 2, 10, 20), // older, higher
        createMetric('m3', 'pub-3', 100, 5, 1, 0, 2, 10),   // newer, lower
        createMetric('m4', 'pub-4', 100, 5, 1, 0, 2, 5),    // newer, lower
      ];

      const task = createTask(metrics);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as {
          report: {
            trends: Array<{ metric: string; direction: string; change: number }>;
          };
        };
        const viewsTrend = output.report.trends.find(t => t.metric === 'views');
        expect(viewsTrend?.direction).toBe('down');
        expect(viewsTrend?.change).toBeLessThan(0);
      }
    });

    it('should detect stable trend when metrics are similar', async () => {
      const metrics = [
        createMetric('m1', 'pub-1', 100, 5, 1, 0, 2, 30),
        createMetric('m2', 'pub-2', 100, 5, 1, 0, 2, 5),
      ];

      const task = createTask(metrics);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as {
          report: {
            trends: Array<{ metric: string; direction: string; change: number }>;
          };
        };
        const viewsTrend = output.report.trends.find(t => t.metric === 'views');
        expect(viewsTrend?.direction).toBe('stable');
      }
    });
  });

  describe('empty metrics handling', () => {
    it('should handle empty metrics array gracefully', async () => {
      const task = createTask([]);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as {
          report: {
            totalViews: number;
            totalEngagement: number;
            engagementRate: number;
            topPerformingContent: unknown[];
          };
          recommendations: unknown[];
        };
        expect(output.report.totalViews).toBe(0);
        expect(output.report.totalEngagement).toBe(0);
        expect(output.report.engagementRate).toBe(0);
        expect(output.report.topPerformingContent).toHaveLength(0);
        // Should not call Claude when no metrics
        expect(output.recommendations).toHaveLength(0);
      }

      // No Claude call for empty metrics
      expect(mockCallClaude).not.toHaveBeenCalled();
    });
  });

  describe('Claude-based recommendation generation', () => {
    it('should generate recommendations from Claude', async () => {
      const metrics = [
        createMetric('m1', 'pub-1', 1000, 50, 10, 5, 20),
      ];

      const task = createTask(metrics);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as {
          recommendations: Array<{
            type: string;
            description: string;
            confidence: number;
            basedOn: string;
          }>;
        };
        expect(output.recommendations).toHaveLength(2);
        expect(output.recommendations[0]?.type).toBe('channel-focus');
        expect(output.recommendations[0]?.confidence).toBe(0.85);
      }

      expect(mockCallClaude).toHaveBeenCalledOnce();
    });

    it('should continue without recommendations when Claude fails', async () => {
      mockCallClaude.mockResolvedValue(Err({
        message: 'API unavailable',
        statusCode: 500,
        retryable: true,
      }));

      const metrics = [
        createMetric('m1', 'pub-1', 1000, 50, 10, 5, 20),
      ];

      const task = createTask(metrics);
      const result = await agent.run(task);

      // Should still succeed with empty recommendations
      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as {
          report: { totalViews: number };
          recommendations: unknown[];
        };
        expect(output.report.totalViews).toBe(1000);
        expect(output.recommendations).toHaveLength(0);
      }
    });
  });

  describe('input validation', () => {
    it('should fail when metrics is not an array', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'analyst',
        status: 'pending',
        agentId: 'analyst-1',
        input: {
          metrics: 'invalid',
          period: { start: new Date(), end: new Date() },
          channels: ['medium'],
          claudeApiConfig: TEST_CLAUDE_CONFIG,
        },
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
      };

      const result = await agent.run(task);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('metrics array is required');
      }
    });

    it('should fail when period is missing', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'analyst',
        status: 'pending',
        agentId: 'analyst-1',
        input: {
          metrics: [],
          channels: ['medium'],
          claudeApiConfig: TEST_CLAUDE_CONFIG,
        },
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
      };

      const result = await agent.run(task);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('period is required');
      }
    });

    it('should fail when channels is not an array', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'analyst',
        status: 'pending',
        agentId: 'analyst-1',
        input: {
          metrics: [],
          period: { start: new Date(), end: new Date() },
          channels: 'invalid',
          claudeApiConfig: TEST_CLAUDE_CONFIG,
        },
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
      };

      const result = await agent.run(task);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('channels array is required');
      }
    });
  });

  describe('task output format', () => {
    it('should include agentId, taskId, and completedAt', async () => {
      const task = createTask([createMetric('m1', 'pub-1', 100, 5, 1, 0, 2)]);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.agentId).toBe('analyst-1');
        expect(result.value.taskId).toBe('task-1');
        expect(result.value.completedAt).toBeInstanceOf(Date);
      }
    });
  });
});
