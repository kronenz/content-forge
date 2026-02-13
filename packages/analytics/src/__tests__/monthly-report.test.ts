import { describe, it, expect } from 'vitest';
import { MonthlyReportGenerator } from '../monthly-report.js';
import type { Channel } from '@content-forge/core';
import type { ChannelMetrics } from '../types.js';

function makeMetrics(overrides: Partial<ChannelMetrics> = {}): ChannelMetrics {
  return {
    channel: 'medium',
    publicationId: 'pub-1',
    views: 1000,
    likes: 50,
    comments: 10,
    shares: 5,
    clicks: 30,
    measuredAt: new Date('2025-01-15'),
    ...overrides,
  };
}

function makePeriod() {
  return {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31'),
  };
}

describe('MonthlyReportGenerator', () => {
  const generator = new MonthlyReportGenerator();

  describe('generate', () => {
    it('should generate a monthly report with valid metrics', () => {
      const metrics = [
        makeMetrics({ publicationId: 'pub-1', channel: 'medium', views: 1000 }),
        makeMetrics({ publicationId: 'pub-2', channel: 'linkedin', views: 800 }),
      ];

      const result = generator.generate(metrics, makePeriod());

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.period).toEqual(makePeriod());
        expect(result.value.generatedAt).toBeInstanceOf(Date);
        expect(result.value.channelPerformance.length).toBeGreaterThan(0);
        expect(result.value.trends.length).toBeGreaterThan(0);
        expect(result.value.topContent.length).toBeGreaterThan(0);
        expect(result.value.recommendations.length).toBeGreaterThan(0);
        expect(typeof result.value.executiveSummary).toBe('string');
      }
    });

    it('should error when no metrics are provided', () => {
      const result = generator.generate([], makePeriod());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.source).toBe('MonthlyReportGenerator');
        expect(result.error.message).toContain('No metrics');
      }
    });

    it('should error when period start is after end', () => {
      const metrics = [makeMetrics()];
      const badPeriod = { start: new Date('2025-01-31'), end: new Date('2025-01-01') };

      const result = generator.generate(metrics, badPeriod);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('before');
      }
    });

    it('should build correct channel performance breakdown', () => {
      const metrics = [
        makeMetrics({ channel: 'medium', views: 500, likes: 20, comments: 5, shares: 3 }),
        makeMetrics({ channel: 'medium', views: 300, likes: 15, comments: 3, shares: 2 }),
        makeMetrics({ channel: 'linkedin', views: 800, likes: 40, comments: 10, shares: 5 }),
      ];

      const result = generator.generate(metrics, makePeriod());

      expect(result.ok).toBe(true);
      if (result.ok) {
        const mediumData = result.value.channelPerformance.find((c) => c.channel === 'medium');
        const linkedinData = result.value.channelPerformance.find((c) => c.channel === 'linkedin');

        expect(mediumData).toBeDefined();
        expect(mediumData!.totalViews).toBe(800);
        expect(mediumData!.totalEngagement).toBe(20 + 5 + 3 + 15 + 3 + 2);
        expect(mediumData!.contentCount).toBe(2);
        expect(mediumData!.avgEngagementRate).toBeGreaterThan(0);

        expect(linkedinData).toBeDefined();
        expect(linkedinData!.totalViews).toBe(800);
        expect(linkedinData!.contentCount).toBe(1);
      }
    });

    it('should identify top content by engagement rate', () => {
      const metrics = [
        makeMetrics({
          publicationId: 'low-engagement',
          views: 1000,
          likes: 5,
          comments: 1,
          shares: 0,
        }),
        makeMetrics({
          publicationId: 'high-engagement',
          views: 500,
          likes: 100,
          comments: 50,
          shares: 30,
        }),
      ];

      const result = generator.generate(metrics, makePeriod());

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.topContent.length).toBeGreaterThan(0);
        expect(result.value.topContent[0]!.publicationId).toBe('high-engagement');
        expect(result.value.topContent[0]!.engagementRate).toBeGreaterThan(0);
      }
    });

    it('should analyze trends by splitting period into halves', () => {
      const period = { start: new Date('2025-01-01'), end: new Date('2025-01-31') };

      const metrics = [
        // First half - lower performance
        makeMetrics({ views: 100, likes: 5, comments: 1, shares: 0, clicks: 3, measuredAt: new Date('2025-01-05') }),
        // Second half - higher performance
        makeMetrics({ views: 500, likes: 30, comments: 10, shares: 5, clicks: 20, measuredAt: new Date('2025-01-25') }),
      ];

      const result = generator.generate(metrics, period);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.trends.length).toBe(3); // views, engagement, clicks

        const viewsTrend = result.value.trends.find((t) => t.metric === 'views');
        expect(viewsTrend).toBeDefined();
        expect(viewsTrend!.direction).toBe('up');
        expect(viewsTrend!.changePercent).toBeGreaterThan(0);
        expect(viewsTrend!.insight).toBeTruthy();
      }
    });

    it('should detect downward trends', () => {
      const period = { start: new Date('2025-01-01'), end: new Date('2025-01-31') };

      const metrics = [
        // First half - higher performance
        makeMetrics({ views: 500, likes: 30, comments: 10, shares: 5, clicks: 20, measuredAt: new Date('2025-01-05') }),
        // Second half - lower performance
        makeMetrics({ views: 100, likes: 5, comments: 1, shares: 0, clicks: 3, measuredAt: new Date('2025-01-25') }),
      ];

      const result = generator.generate(metrics, period);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const viewsTrend = result.value.trends.find((t) => t.metric === 'views');
        expect(viewsTrend).toBeDefined();
        expect(viewsTrend!.direction).toBe('down');
        expect(viewsTrend!.changePercent).toBeLessThan(0);
      }
    });

    it('should generate recommendations for low engagement', () => {
      const metrics = [
        makeMetrics({ views: 10000, likes: 10, comments: 2, shares: 1 }),
      ];

      const result = generator.generate(metrics, makePeriod());

      expect(result.ok).toBe(true);
      if (result.ok) {
        const hasLowRec = result.value.recommendations.some((r) => r.includes('below 2%'));
        expect(hasLowRec).toBe(true);
      }
    });

    it('should limit top content entries', () => {
      const metrics = Array.from({ length: 10 }, (_, i) =>
        makeMetrics({
          publicationId: `pub-${i}`,
          views: 1000 - i * 100,
          likes: 50 - i * 5,
        }),
      );

      const result = generator.generate(metrics, makePeriod());

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.topContent.length).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('generateExecutiveSummary', () => {
    it('should generate a readable summary string', () => {
      const channelPerformance = [
        {
          channel: 'medium' as Channel,
          totalViews: 5000,
          totalEngagement: 300,
          avgEngagementRate: 6,
          growth: 0,
          contentCount: 10,
        },
        {
          channel: 'linkedin' as Channel,
          totalViews: 3000,
          totalEngagement: 200,
          avgEngagementRate: 6.7,
          growth: 0,
          contentCount: 5,
        },
      ];
      const trends = [
        { metric: 'views', direction: 'up' as const, changePercent: 15, insight: 'Views increased' },
      ];
      const topContent = [
        {
          publicationId: 'best-post',
          channel: 'medium' as Channel,
          views: 2000,
          engagement: 150,
          engagementRate: 7.5,
        },
      ];

      const summary = generator.generateExecutiveSummary(
        channelPerformance,
        trends,
        topContent,
        makePeriod(),
      );

      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(50);
      expect(summary).toContain('medium');
      expect(summary).toContain('15');
      expect(summary).toContain('best-post');
    });

    it('should handle empty channel performance', () => {
      const summary = generator.generateExecutiveSummary([], [], [], makePeriod());
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });
  });
});
