import { describe, it, expect, beforeEach } from 'vitest';
import { ABTestManager } from '../ab-testing.js';
import type { ABTestVariable } from '../ab-testing.js';

describe('ABTestManager', () => {
  let manager: ABTestManager;

  beforeEach(() => {
    manager = new ABTestManager();
  });

  describe('createTest', () => {
    it('should create a test with valid inputs', () => {
      const result = manager.createTest('Title Test', 'medium', 'title', [
        { label: 'Short Title', value: 'Short' },
        { label: 'Long Title', value: 'A Much Longer Title for Testing' },
      ]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('Title Test');
        expect(result.value.channel).toBe('medium');
        expect(result.value.variable).toBe('title');
        expect(result.value.variants).toHaveLength(2);
        expect(result.value.status).toBe('running');
        expect(result.value.startedAt).toBeInstanceOf(Date);
        expect(result.value.id).toBeTruthy();
      }
    });

    it('should initialize variant metrics to zero', () => {
      const result = manager.createTest('CTA Test', 'linkedin', 'cta', [
        { label: 'A', value: 'Click here' },
        { label: 'B', value: 'Learn more' },
      ]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        for (const variant of result.value.variants) {
          expect(variant.metrics.views).toBe(0);
          expect(variant.metrics.engagement).toBe(0);
          expect(variant.metrics.clicks).toBe(0);
          expect(variant.sampleSize).toBe(0);
        }
      }
    });

    it('should error when fewer than 2 variants', () => {
      const result = manager.createTest('Bad Test', 'medium', 'title', [
        { label: 'Only One', value: 'solo' },
      ]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.source).toBe('ABTestManager');
        expect(result.error.message).toContain('at least 2');
      }
    });

    it('should error when name is empty', () => {
      const result = manager.createTest('', 'medium', 'title', [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
      ]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('empty');
      }
    });

    it('should assign unique IDs to variants', () => {
      const result = manager.createTest('ID Test', 'blog', 'thumbnail', [
        { label: 'A', value: 'img-a.png' },
        { label: 'B', value: 'img-b.png' },
        { label: 'C', value: 'img-c.png' },
      ]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const ids = result.value.variants.map((v) => v.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });

    it('should support all test variables', () => {
      const variables: ABTestVariable[] = ['title', 'thumbnail', 'cta', 'publish-time'];

      for (const variable of variables) {
        const result = manager.createTest(`Test ${variable}`, 'medium', variable, [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ]);
        expect(result.ok).toBe(true);
      }
    });
  });

  describe('recordMetric', () => {
    it('should record metrics for a variant', () => {
      const createResult = manager.createTest('Metric Test', 'medium', 'title', [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
      ]);

      expect(createResult.ok).toBe(true);
      if (createResult.ok) {
        const test = createResult.value;
        const variantId = test.variants[0]!.id;

        const result = manager.recordMetric(test.id, variantId, {
          views: 100,
          engagement: 15,
          clicks: 10,
        });

        expect(result.ok).toBe(true);

        const updated = manager.getTest(test.id);
        expect(updated).toBeDefined();
        const variant = updated!.variants.find((v) => v.id === variantId);
        expect(variant!.metrics.views).toBe(100);
        expect(variant!.metrics.engagement).toBe(15);
        expect(variant!.metrics.clicks).toBe(10);
        expect(variant!.sampleSize).toBe(1);
      }
    });

    it('should accumulate metrics across multiple recordings', () => {
      const createResult = manager.createTest('Accumulate Test', 'linkedin', 'cta', [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
      ]);

      expect(createResult.ok).toBe(true);
      if (createResult.ok) {
        const test = createResult.value;
        const variantId = test.variants[0]!.id;

        manager.recordMetric(test.id, variantId, { views: 50, engagement: 5, clicks: 3 });
        manager.recordMetric(test.id, variantId, { views: 75, engagement: 10, clicks: 7 });

        const updated = manager.getTest(test.id);
        const variant = updated!.variants.find((v) => v.id === variantId);
        expect(variant!.metrics.views).toBe(125);
        expect(variant!.metrics.engagement).toBe(15);
        expect(variant!.metrics.clicks).toBe(10);
        expect(variant!.sampleSize).toBe(2);
      }
    });

    it('should error when test not found', () => {
      const result = manager.recordMetric('nonexistent', 'var-1', {
        views: 100,
        engagement: 10,
        clicks: 5,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('should error when variant not found', () => {
      const createResult = manager.createTest('Variant Test', 'medium', 'title', [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
      ]);

      expect(createResult.ok).toBe(true);
      if (createResult.ok) {
        const result = manager.recordMetric(createResult.value.id, 'nonexistent', {
          views: 100,
          engagement: 10,
          clicks: 5,
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toContain('Variant not found');
        }
      }
    });

    it('should error when test is completed', () => {
      const createResult = manager.createTest('Completed Test', 'medium', 'title', [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
      ]);

      expect(createResult.ok).toBe(true);
      if (createResult.ok) {
        const test = createResult.value;
        const v0 = test.variants[0]!.id;
        const v1 = test.variants[1]!.id;

        // Record some data and analyze to complete the test
        manager.recordMetric(test.id, v0, { views: 100, engagement: 20, clicks: 10 });
        manager.recordMetric(test.id, v1, { views: 100, engagement: 5, clicks: 2 });
        manager.analyzeResults(test.id);

        const result = manager.recordMetric(test.id, v0, {
          views: 50,
          engagement: 10,
          clicks: 5,
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toContain('completed');
        }
      }
    });
  });

  describe('analyzeResults', () => {
    it('should identify the winner by engagement rate', () => {
      const createResult = manager.createTest('Winner Test', 'medium', 'title', [
        { label: 'Good Title', value: 'good' },
        { label: 'Bad Title', value: 'bad' },
      ]);

      expect(createResult.ok).toBe(true);
      if (createResult.ok) {
        const test = createResult.value;
        const goodId = test.variants[0]!.id;
        const badId = test.variants[1]!.id;

        // Good variant: 20% engagement rate
        manager.recordMetric(test.id, goodId, { views: 500, engagement: 100, clicks: 50 });
        // Bad variant: 5% engagement rate
        manager.recordMetric(test.id, badId, { views: 500, engagement: 25, clicks: 10 });

        const result = manager.analyzeResults(test.id);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.winner.id).toBe(goodId);
          expect(result.value.improvement).toBeGreaterThan(0);
          expect(result.value.confidence).toBeGreaterThan(0);
          expect(result.value.recommendation).toBeTruthy();
        }
      }
    });

    it('should mark the test as completed after analysis', () => {
      const createResult = manager.createTest('Complete Test', 'linkedin', 'cta', [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
      ]);

      expect(createResult.ok).toBe(true);
      if (createResult.ok) {
        const test = createResult.value;
        manager.recordMetric(test.id, test.variants[0]!.id, { views: 100, engagement: 20, clicks: 10 });
        manager.recordMetric(test.id, test.variants[1]!.id, { views: 100, engagement: 5, clicks: 2 });

        manager.analyzeResults(test.id);

        const updated = manager.getTest(test.id);
        expect(updated!.status).toBe('completed');
        expect(updated!.completedAt).toBeInstanceOf(Date);
        expect(updated!.winnerId).toBeTruthy();
      }
    });

    it('should error when test not found', () => {
      const result = manager.analyzeResults('nonexistent');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('should error when no data recorded', () => {
      const createResult = manager.createTest('Empty Test', 'medium', 'title', [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
      ]);

      expect(createResult.ok).toBe(true);
      if (createResult.ok) {
        const result = manager.analyzeResults(createResult.value.id);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toContain('No data');
        }
      }
    });

    it('should return higher confidence with larger sample sizes', () => {
      // Test 1: small samples
      const small = manager.createTest('Small Test', 'medium', 'title', [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
      ]);
      expect(small.ok).toBe(true);
      if (small.ok) {
        manager.recordMetric(small.value.id, small.value.variants[0]!.id, { views: 10, engagement: 3, clicks: 1 });
        manager.recordMetric(small.value.id, small.value.variants[1]!.id, { views: 10, engagement: 1, clicks: 0 });
        const smallResult = manager.analyzeResults(small.value.id);

        // Test 2: large samples with same proportions
        const large = manager.createTest('Large Test', 'medium', 'title', [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ]);
        expect(large.ok).toBe(true);
        if (large.ok) {
          manager.recordMetric(large.value.id, large.value.variants[0]!.id, { views: 1000, engagement: 300, clicks: 100 });
          manager.recordMetric(large.value.id, large.value.variants[1]!.id, { views: 1000, engagement: 100, clicks: 30 });
          const largeResult = manager.analyzeResults(large.value.id);

          expect(smallResult.ok).toBe(true);
          expect(largeResult.ok).toBe(true);
          if (smallResult.ok && largeResult.ok) {
            expect(largeResult.value.confidence).toBeGreaterThanOrEqual(smallResult.value.confidence);
          }
        }
      }
    });

    it('should generate a recommendation string', () => {
      const createResult = manager.createTest('Rec Test', 'blog', 'thumbnail', [
        { label: 'Photo', value: 'photo.png' },
        { label: 'Illustration', value: 'illustration.png' },
      ]);

      expect(createResult.ok).toBe(true);
      if (createResult.ok) {
        const test = createResult.value;
        manager.recordMetric(test.id, test.variants[0]!.id, { views: 500, engagement: 100, clicks: 50 });
        manager.recordMetric(test.id, test.variants[1]!.id, { views: 500, engagement: 25, clicks: 10 });

        const result = manager.analyzeResults(test.id);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(typeof result.value.recommendation).toBe('string');
          expect(result.value.recommendation.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('getTest', () => {
    it('should return undefined for nonexistent test', () => {
      expect(manager.getTest('nonexistent')).toBeUndefined();
    });

    it('should return the test by ID', () => {
      const createResult = manager.createTest('Get Test', 'medium', 'title', [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
      ]);

      expect(createResult.ok).toBe(true);
      if (createResult.ok) {
        const test = manager.getTest(createResult.value.id);
        expect(test).toBeDefined();
        expect(test!.name).toBe('Get Test');
      }
    });
  });
});
