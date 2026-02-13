/**
 * Strategist agent tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Task, Material, AgentConfig } from '@content-forge/core';
import { StrategistAgent } from '../strategist-agent.js';
import { InMemoryLockManager } from '../lock-manager.js';

describe('StrategistAgent', () => {
  let agent: StrategistAgent;
  let lockManager: InMemoryLockManager;

  const createMaterial = (id: string, score: number, contentLength: number, tags: string[] = []): Material => ({
    id,
    source: 'test-source',
    url: `https://example.com/${id}`,
    title: `Test Material ${id}`,
    content: 'x'.repeat(contentLength),
    score,
    tags,
    status: 'new',
    collectedAt: new Date(),
    createdAt: new Date(),
  });

  const createTask = (materials: Material[], limit?: number): Task => ({
    id: 'task-1',
    type: 'strategist',
    status: 'pending',
    agentId: 'strategist-1',
    input: { materials, limit },
    output: null,
    error: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
  });

  beforeEach(() => {
    const config: AgentConfig = {
      id: 'strategist-1',
      name: 'Strategist',
      type: 'strategist',
    };
    lockManager = new InMemoryLockManager();
    agent = new StrategistAgent(config, lockManager);
  });

  describe('execute', () => {
    it('should select and rank materials', async () => {
      const materials = [
        createMaterial('m1', 7, 1000, ['ai', 'tech']),
        createMaterial('m2', 9, 500, ['web']),
        createMaterial('m3', 5, 2000, ['design']),
      ];

      const task = createTask(materials);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { selectedMaterials: Array<{ material: Material; pipeline: string }> };
        expect(output.selectedMaterials).toHaveLength(3);

        // Should be sorted by score (highest first)
        expect(output.selectedMaterials[0]?.material.id).toBe('m2');
        expect(output.selectedMaterials[1]?.material.id).toBe('m1');
        expect(output.selectedMaterials[2]?.material.id).toBe('m3');
      }
    });

    it('should respect limit parameter', async () => {
      const materials = [
        createMaterial('m1', 7, 1000),
        createMaterial('m2', 9, 500),
        createMaterial('m3', 5, 2000),
        createMaterial('m4', 8, 1500),
      ];

      const task = createTask(materials, 2);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { selectedMaterials: unknown[] };
        expect(output.selectedMaterials).toHaveLength(2);
      }
    });

    it('should assign pipeline based on content length', async () => {
      const materials = [
        createMaterial('m1', 5, 200),    // snackable
        createMaterial('m2', 5, 500),    // shortform
        createMaterial('m3', 5, 1500),   // thread
        createMaterial('m4', 5, 5000),   // longform
      ];

      const task = createTask(materials);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { selectedMaterials: Array<{ material: Material; pipeline: string }> };

        const m1Result = output.selectedMaterials.find(s => s.material.id === 'm1');
        const m2Result = output.selectedMaterials.find(s => s.material.id === 'm2');
        const m3Result = output.selectedMaterials.find(s => s.material.id === 'm3');
        const m4Result = output.selectedMaterials.find(s => s.material.id === 'm4');

        expect(m1Result?.pipeline).toBe('snackable');
        expect(m2Result?.pipeline).toBe('shortform');
        expect(m3Result?.pipeline).toBe('thread');
        expect(m4Result?.pipeline).toBe('longform');
      }
    });

    it('should fail with invalid input', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'strategist',
        status: 'pending',
        agentId: 'strategist-1',
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
        expect(result.error.message).toContain('Invalid input');
      }
    });

    it('should handle empty materials array', async () => {
      const task = createTask([]);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { selectedMaterials: unknown[] };
        expect(output.selectedMaterials).toHaveLength(0);
      }
    });

    it('should boost recent materials', async () => {
      const oldMaterial = createMaterial('m1', 5, 1000);
      oldMaterial.collectedAt = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago

      const recentMaterial = createMaterial('m2', 5, 1000);
      recentMaterial.collectedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

      const materials = [oldMaterial, recentMaterial];
      const task = createTask(materials);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { selectedMaterials: Array<{ material: Material }> };
        // Recent material should rank higher
        expect(output.selectedMaterials[0]?.material.id).toBe('m2');
      }
    });

    it('should boost materials with more tags', async () => {
      const materials = [
        createMaterial('m1', 5, 1000, ['tag1']),
        createMaterial('m2', 5, 1000, ['tag1', 'tag2', 'tag3']),
        createMaterial('m3', 5, 1000, []),
      ];

      const task = createTask(materials);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { selectedMaterials: Array<{ material: Material }> };
        // Material with most tags should rank highest
        expect(output.selectedMaterials[0]?.material.id).toBe('m2');
      }
    });
  });
});
