/**
 * Writer agent tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Task, Material, Channel, AgentConfig, ChannelContent } from '@content-forge/core';
import { WriterAgent } from '../writer-agent.js';
import { InMemoryLockManager } from '../lock-manager.js';

describe('WriterAgent', () => {
  let agent: WriterAgent;
  let lockManager: InMemoryLockManager;

  const createMaterial = (contentLength: number): Material => ({
    id: 'm1',
    source: 'test-source',
    url: 'https://example.com/article',
    title: 'Test Article Title',
    content: 'x'.repeat(contentLength),
    score: 8,
    tags: ['tech', 'ai'],
    status: 'new',
    collectedAt: new Date(),
    createdAt: new Date(),
  });

  const createTask = (material: Material, channel: Channel): Task => ({
    id: 'task-1',
    type: 'writer',
    status: 'pending',
    agentId: 'writer-1',
    input: { material, channel },
    output: null,
    error: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
  });

  beforeEach(() => {
    const config: AgentConfig = {
      id: 'writer-1',
      name: 'Writer',
      type: 'writer',
    };
    lockManager = new InMemoryLockManager();
    agent = new WriterAgent(config, lockManager);
  });

  describe('execute', () => {
    it('should transform content for medium', async () => {
      const material = createMaterial(500);
      const task = createTask(material, 'medium');
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { content: ChannelContent };
        expect(output.content.channel).toBe('medium');
        expect(output.content.title).toBe('Test Article Title');
        expect(output.content.body.length).toBeLessThanOrEqual(10000);
        expect(output.content.metadata.format).toBe('markdown');
      }
    });

    it('should truncate content for x-thread', async () => {
      const material = createMaterial(500);
      const task = createTask(material, 'x-thread');
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { content: ChannelContent };
        expect(output.content.channel).toBe('x-thread');
        expect(output.content.body.length).toBeLessThanOrEqual(280);
      }
    });

    it('should format content for ig-story (ultra-short)', async () => {
      const material = createMaterial(500);
      const task = createTask(material, 'ig-story');
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { content: ChannelContent };
        // ig-story extracts first sentence (split on '.')
        // With repeated 'x' characters and no periods, it should be very short
        expect(output.content.body.length).toBeLessThanOrEqual(100);
        expect(output.content.channel).toBe('ig-story');
      }
    });

    it('should truncate long title', async () => {
      const material = createMaterial(500);
      material.title = 'x'.repeat(150);

      const task = createTask(material, 'medium');
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { content: ChannelContent };
        expect(output.content.title.length).toBeLessThanOrEqual(100);
        expect(output.content.title).toContain('...');
      }
    });

    it('should include metadata', async () => {
      const material = createMaterial(500);
      const task = createTask(material, 'linkedin');
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { content: ChannelContent };
        expect(output.content.metadata.source).toBe('test-source');
        expect(output.content.metadata.sourceUrl).toBe('https://example.com/article');
        expect(output.content.metadata.tags).toEqual(['tech', 'ai']);
      }
    });

    it('should fail with missing material', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'writer',
        status: 'pending',
        agentId: 'writer-1',
        input: { channel: 'medium' },
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
      };

      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('material is required');
      }
    });

    it('should fail with missing channel', async () => {
      const material = createMaterial(500);
      const task: Task = {
        id: 'task-1',
        type: 'writer',
        status: 'pending',
        agentId: 'writer-1',
        input: { material },
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
      };

      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('channel is required');
      }
    });

    it('should handle different channels correctly', async () => {
      const material = createMaterial(5000);
      const channels: Channel[] = ['medium', 'linkedin', 'blog', 'newsletter'];

      for (const channel of channels) {
        const task = createTask(material, channel);
        const result = await agent.run(task);

        expect(result.ok).toBe(true);

        if (result.ok) {
          const output = result.value.result as { content: ChannelContent };
          expect(output.content.channel).toBe(channel);
        }
      }
    });
  });
});
