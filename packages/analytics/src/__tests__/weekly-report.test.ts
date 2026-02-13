import { describe, it, expect } from 'vitest';
import { WeeklyReportGenerator } from '../weekly-report.js';
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
    start: new Date('2025-01-13'),
    end: new Date('2025-01-20'),
  };
}

describe('WeeklyReportGenerator', () => {
  const generator = new WeeklyReportGenerator();

  describe('generate', () => {
    it('should generate a report with valid metrics', () => {
      const metrics = [
        makeMetrics({ publicationId: 'pub-1', channel: 'medium', views: 1000, likes: 50 }),
        makeMetrics({ publicationId: 'pub-2', channel: 'linkedin', views: 800, likes: 40 }),
      ];

      const result = generator.generate(metrics, makePeriod());

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.summary.totalViews).toBe(1800);
        expect(result.value.period).toEqual(makePeriod());
        expect(result.value.generatedAt).toBeInstanceOf(Date);
      }
    });

    it('should identify the top channel by views', () => {
      const metrics = [
        makeMetrics({ channel: 'medium', views: 500 }),
        makeMetrics({ channel: 'youtube', views: 3000 }),
        makeMetrics({ channel: 'linkedin', views: 800 }),
      ];

      const result = generator.generate(metrics, makePeriod());

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.summary.topChannel).toBe('youtube');
      }
    });

    it('should identify the top content by engagement', () => {
      const metrics = [
        makeMetrics({ publicationId: 'pub-low', likes: 10, comments: 2, shares: 1 }),
        makeMetrics({ publicationId: 'pub-high', likes: 200, comments: 50, shares: 30 }),
      ];

      const result = generator.generate(metrics, makePeriod());

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.summary.topContent).toBe('pub-high');
      }
    });

    it('should produce correct channel breakdown', () => {
      const metrics = [
        makeMetrics({ channel: 'medium', views: 500, likes: 20, comments: 5, shares: 3 }),
        makeMetrics({ channel: 'medium', views: 300, likes: 15, comments: 3, shares: 2 }),
        makeMetrics({ channel: 'linkedin', views: 800, likes: 40, comments: 10, shares: 5 }),
      ];

      const result = generator.generate(metrics, makePeriod());

      expect(result.ok).toBe(true);
      if (result.ok) {
        const breakdown = result.value.channelBreakdown;
        const mediumEntry = breakdown.find((b) => b.channel === 'medium');
        const linkedinEntry = breakdown.find((b) => b.channel === 'linkedin');

        expect(mediumEntry).toBeDefined();
        expect(mediumEntry!.views).toBe(800);
        expect(mediumEntry!.contentCount).toBe(2);
        expect(mediumEntry!.engagement).toBe(20 + 5 + 3 + 15 + 3 + 2);

        expect(linkedinEntry).toBeDefined();
        expect(linkedinEntry!.views).toBe(800);
        expect(linkedinEntry!.contentCount).toBe(1);
      }
    });

    it('should error when no metrics are provided', () => {
      const result = generator.generate([], makePeriod());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.source).toBe('WeeklyReportGenerator');
        expect(result.error.message).toContain('No metrics');
      }
    });

    it('should error when period start is after end', () => {
      const metrics = [makeMetrics()];
      const badPeriod = { start: new Date('2025-01-20'), end: new Date('2025-01-13') };

      const result = generator.generate(metrics, badPeriod);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('before');
      }
    });

    it('should error when period start equals end', () => {
      const metrics = [makeMetrics()];
      const samePeriod = { start: new Date('2025-01-15'), end: new Date('2025-01-15') };

      const result = generator.generate(metrics, samePeriod);

      expect(result.ok).toBe(false);
    });

    it('should include recommendations in the report', () => {
      const metrics = [
        makeMetrics({ views: 1000, likes: 50, comments: 10, shares: 5 }),
      ];

      const result = generator.generate(metrics, makePeriod());

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Array.isArray(result.value.recommendations)).toBe(true);
        expect(result.value.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('calculateEngagementRate', () => {
    it('should calculate engagement rate correctly', () => {
      const metrics = makeMetrics({ views: 1000, likes: 50, comments: 10, shares: 5 });
      const rate = generator.calculateEngagementRate(metrics);

      // (50 + 10 + 5) / 1000 * 100 = 6.5
      expect(rate).toBeCloseTo(6.5);
    });

    it('should return 0 for zero views', () => {
      const metrics = makeMetrics({ views: 0, likes: 0, comments: 0, shares: 0 });
      const rate = generator.calculateEngagementRate(metrics);

      expect(rate).toBe(0);
    });

    it('should handle high engagement rates', () => {
      const metrics = makeMetrics({ views: 100, likes: 80, comments: 30, shares: 20 });
      const rate = generator.calculateEngagementRate(metrics);

      // (80 + 30 + 20) / 100 * 100 = 130
      expect(rate).toBeCloseTo(130);
    });
  });

  describe('getTopPerformers', () => {
    it('should return top performers sorted by engagement', () => {
      const metrics = [
        makeMetrics({ publicationId: 'low', likes: 5, comments: 1, shares: 0 }),
        makeMetrics({ publicationId: 'high', likes: 100, comments: 50, shares: 30 }),
        makeMetrics({ publicationId: 'mid', likes: 30, comments: 10, shares: 5 }),
      ];

      const top = generator.getTopPerformers(metrics, 2);

      expect(top).toHaveLength(2);
      expect(top[0]!.publicationId).toBe('high');
      expect(top[1]!.publicationId).toBe('mid');
    });

    it('should respect the limit parameter', () => {
      const metrics = [
        makeMetrics({ publicationId: 'a' }),
        makeMetrics({ publicationId: 'b' }),
        makeMetrics({ publicationId: 'c' }),
      ];

      const top = generator.getTopPerformers(metrics, 1);
      expect(top).toHaveLength(1);
    });

    it('should handle limit larger than array', () => {
      const metrics = [makeMetrics({ publicationId: 'a' })];
      const top = generator.getTopPerformers(metrics, 10);

      expect(top).toHaveLength(1);
    });

    it('should not mutate the original array', () => {
      const metrics = [
        makeMetrics({ publicationId: 'b', likes: 10 }),
        makeMetrics({ publicationId: 'a', likes: 50 }),
      ];

      generator.getTopPerformers(metrics, 1);

      expect(metrics[0]!.publicationId).toBe('b');
      expect(metrics[1]!.publicationId).toBe('a');
    });
  });

  describe('generateRecommendations', () => {
    it('should return recommendations for empty metrics', () => {
      const recs = generator.generateRecommendations([]);
      expect(recs).toHaveLength(1);
      expect(recs[0]).toContain('Start publishing');
    });

    it('should recommend improvements for low engagement', () => {
      // engagement rate < 2%: (1 + 0 + 0) / 1000 * 100 = 0.1%
      const metrics = [
        makeMetrics({ views: 1000, likes: 1, comments: 0, shares: 0 }),
      ];

      const recs = generator.generateRecommendations(metrics);
      const hasLowEngagementRec = recs.some((r) => r.includes('below 2%'));
      expect(hasLowEngagementRec).toBe(true);
    });

    it('should congratulate high engagement', () => {
      // engagement rate > 5%: (60 + 10 + 5) / 1000 * 100 = 7.5%
      const metrics = [
        makeMetrics({ views: 1000, likes: 60, comments: 10, shares: 5 }),
      ];

      const recs = generator.generateRecommendations(metrics);
      const hasHighEngagementRec = recs.some((r) => r.includes('above 5%'));
      expect(hasHighEngagementRec).toBe(true);
    });

    it('should identify top performing channel', () => {
      const metrics = [
        makeMetrics({ channel: 'medium', likes: 10, comments: 2, shares: 1 }),
        makeMetrics({ channel: 'youtube', likes: 100, comments: 50, shares: 30 }),
      ];

      const recs = generator.generateRecommendations(metrics);
      const hasTopChannel = recs.some((r) => r.includes('youtube'));
      expect(hasTopChannel).toBe(true);
    });
  });
});
