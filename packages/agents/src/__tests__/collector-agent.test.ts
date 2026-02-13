/**
 * Collector agent tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Task, AgentConfig } from '@content-forge/core';
import { CollectorAgent } from '../collector-agent.js';
import { InMemoryLockManager } from '../lock-manager.js';

describe('CollectorAgent', () => {
  let agent: CollectorAgent;
  let lockManager: InMemoryLockManager;

  const createTask = (sources: string[], keywords?: string[], maxItems?: number): Task => ({
    id: 'task-1',
    type: 'collector',
    status: 'pending',
    agentId: 'collector-1',
    input: { sources, keywords, maxItems },
    output: null,
    error: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
  });

  beforeEach(() => {
    const config: AgentConfig = {
      id: 'collector-1',
      name: 'Collector',
      type: 'collector',
    };
    lockManager = new InMemoryLockManager();
    agent = new CollectorAgent(config, lockManager);
  });

  describe('execute', () => {
    it('should collect materials from RSS sources', async () => {
      const task = createTask(['rss-feed.example.com']);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { materials: unknown[]; totalCollected: number };
        expect(output.materials.length).toBeGreaterThan(0);
        expect(output.totalCollected).toBeGreaterThan(0);
      }
    });

    it('should collect materials from multiple sources', async () => {
      const task = createTask(['rss-feed.example.com', 'trends.example.com', 'bookmarks.example.com']);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { materials: unknown[]; totalCollected: number };
        expect(output.materials.length).toBeGreaterThan(3);
        expect(output.totalCollected).toBeGreaterThan(3);
      }
    });

    it('should respect maxItems limit', async () => {
      const task = createTask(['rss-feed.example.com', 'trends.example.com'], undefined, 3);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { materials: unknown[] };
        expect(output.materials.length).toBeLessThanOrEqual(3);
      }
    });

    it('should apply keywords as tags to collected materials', async () => {
      const task = createTask(['rss-feed.example.com'], ['ai', 'tech']);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { materials: Array<{ tags: string[] }> };
        for (const material of output.materials) {
          expect(material.tags).toContain('ai');
          expect(material.tags).toContain('tech');
        }
      }
    });

    it('should deduplicate materials by URL', async () => {
      // Using the same source twice should produce duplicates that get removed
      const task = createTask(['rss-feed.example.com', 'rss-feed.example.com']);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { materials: unknown[]; totalCollected: number; duplicatesRemoved: number };
        expect(output.duplicatesRemoved).toBeGreaterThan(0);
        expect(output.materials.length).toBeLessThan(output.totalCollected);
      }
    });

    it('should fail with invalid input (non-array sources)', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'collector',
        status: 'pending',
        agentId: 'collector-1',
        input: { sources: 'invalid' },
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
      };

      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('sources array is required');
      }
    });

    it('should fail with empty sources array', async () => {
      const task = createTask([]);
      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('must not be empty');
      }
    });

    it('should assign scores based on source type', async () => {
      const task = createTask(['trends.example.com']);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { materials: Array<{ score: number; source: string }> };
        // Trends should have score of 7
        for (const material of output.materials) {
          expect(material.score).toBe(7);
        }
      }
    });

    it('should set material status to new', async () => {
      const task = createTask(['rss-feed.example.com']);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { materials: Array<{ status: string }> };
        for (const material of output.materials) {
          expect(material.status).toBe('new');
        }
      }
    });

    it('should fail with missing sources field', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'collector',
        status: 'pending',
        agentId: 'collector-1',
        input: {},
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
      };

      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('sources array is required');
      }
    });
  });
});
