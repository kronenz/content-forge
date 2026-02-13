/**
 * Researcher agent tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Task, Material, AgentConfig } from '@content-forge/core';
import { ResearcherAgent } from '../researcher-agent.js';
import { InMemoryLockManager } from '../lock-manager.js';

describe('ResearcherAgent', () => {
  let agent: ResearcherAgent;
  let lockManager: InMemoryLockManager;

  const createMaterial = (id: string, title: string, tags: string[], score = 5): Material => ({
    id,
    source: 'test-source',
    url: `https://example.com/${id}`,
    title,
    content: `Content for ${title}`,
    score,
    tags,
    status: 'new',
    collectedAt: new Date(),
    createdAt: new Date(),
  });

  const createTask = (materials: Material[], focusKeywords?: string[]): Task => ({
    id: 'task-1',
    type: 'researcher',
    status: 'pending',
    agentId: 'researcher-1',
    input: { materials, focusKeywords },
    output: null,
    error: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
  });

  beforeEach(() => {
    const config: AgentConfig = {
      id: 'researcher-1',
      name: 'Researcher',
      type: 'researcher',
    };
    lockManager = new InMemoryLockManager();
    agent = new ResearcherAgent(config, lockManager);
  });

  describe('execute', () => {
    it('should extract trends from materials', async () => {
      const materials = [
        createMaterial('m1', 'AI Revolution in Tech', ['ai', 'tech']),
        createMaterial('m2', 'Machine Learning Trends', ['ai', 'ml']),
        createMaterial('m3', 'Web Development Guide', ['web', 'tech']),
      ];

      const task = createTask(materials);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { trends: Array<{ keyword: string; score: number; volume: number }> };
        expect(output.trends.length).toBeGreaterThan(0);
        // 'ai' appears in 2 materials as a tag, should be high
        const aiTrend = output.trends.find(t => t.keyword === 'ai');
        expect(aiTrend).toBeDefined();
        expect(aiTrend!.score).toBeGreaterThan(0);
      }
    });

    it('should boost focus keywords', async () => {
      const materials = [
        createMaterial('m1', 'General Article', ['general']),
      ];

      const task = createTask(materials, ['blockchain']);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { trends: Array<{ keyword: string; score: number }> };
        const blockchainTrend = output.trends.find(t => t.keyword === 'blockchain');
        expect(blockchainTrend).toBeDefined();
        expect(blockchainTrend!.score).toBeGreaterThanOrEqual(6); // Boosted by +3 occurrences -> score = min(3*2, 10) = 6
      }
    });

    it('should generate insights from materials', async () => {
      const materials = [
        createMaterial('m1', 'Article One', ['ai'], 8),
        createMaterial('m2', 'Article Two', ['tech'], 9),
      ];

      const task = createTask(materials);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { insights: string[] };
        expect(output.insights.length).toBeGreaterThan(0);
        expect(output.insights.some(i => i.includes('Analyzed 2 materials'))).toBe(true);
      }
    });

    it('should generate recommendations', async () => {
      const materials = [
        createMaterial('m1', 'AI in Healthcare', ['ai', 'health']),
        createMaterial('m2', 'AI for Business', ['ai', 'business']),
      ];

      const task = createTask(materials);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { recommendations: string[] };
        expect(output.recommendations.length).toBeGreaterThan(0);
        expect(output.recommendations.some(r => r.includes('Focus content creation on'))).toBe(true);
      }
    });

    it('should detect competitive gaps for focus keywords', async () => {
      const materials = [
        createMaterial('m1', 'AI Article About Tech', ['ai', 'tech', 'ml']),
        createMaterial('m2', 'AI Deep Learning', ['ai', 'tech', 'deep-learning']),
        createMaterial('m3', 'ML Pipeline Guide', ['ml', 'tech', 'data']),
        createMaterial('m4', 'Data Engineering', ['data', 'tech', 'infra']),
        createMaterial('m5', 'AI Systems Design', ['ai', 'ml', 'systems']),
      ];

      // 'blockchain' and 'quantum' are not present in any material tags/titles
      // and their boost of +3 won't be enough to reach top 5 (ai, tech, ml have much higher counts)
      const task = createTask(materials, ['blockchain', 'quantum']);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { recommendations: string[] };
        expect(output.recommendations.some(r => r.includes('gaps'))).toBe(true);
      }
    });

    it('should handle empty materials array', async () => {
      const task = createTask([]);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { trends: unknown[]; insights: string[]; recommendations: string[] };
        expect(output.trends).toHaveLength(0);
        expect(output.insights).toContain('No materials available for analysis');
        expect(output.recommendations.some(r => r.includes('Collect more materials'))).toBe(true);
      }
    });

    it('should fail with invalid input', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'researcher',
        status: 'pending',
        agentId: 'researcher-1',
        input: { materials: 'invalid' },
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
      };

      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('materials array is required');
      }
    });

    it('should identify high-quality materials in insights', async () => {
      const materials = [
        createMaterial('m1', 'Great Article', ['ai'], 9),
        createMaterial('m2', 'Good Article', ['tech'], 8),
        createMaterial('m3', 'Average Article', ['web'], 4),
      ];

      const task = createTask(materials);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { insights: string[] };
        expect(output.insights.some(i => i.includes('high-quality'))).toBe(true);
      }
    });

    it('should report unique source count', async () => {
      const m1 = createMaterial('m1', 'Article A', ['ai']);
      m1.source = 'source-a';
      const m2 = createMaterial('m2', 'Article B', ['tech']);
      m2.source = 'source-b';
      const m3 = createMaterial('m3', 'Article C', ['web']);
      m3.source = 'source-a';

      const task = createTask([m1, m2, m3]);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { insights: string[] };
        expect(output.insights.some(i => i.includes('2 unique sources'))).toBe(true);
      }
    });
  });
});
