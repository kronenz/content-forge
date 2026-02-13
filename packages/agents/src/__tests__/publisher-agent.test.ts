/**
 * Publisher agent tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Task, ChannelContent, Channel, AgentConfig } from '@content-forge/core';
import { PublisherAgent } from '../publisher-agent.js';
import { InMemoryLockManager } from '../lock-manager.js';

describe('PublisherAgent', () => {
  let agent: PublisherAgent;
  let lockManager: InMemoryLockManager;

  const createContent = (channel: Channel, body = 'Test content body', title = 'Test Title'): ChannelContent => ({
    channel,
    title,
    body,
    metadata: {},
  });

  const createTask = (contents: ChannelContent[], channels: Channel[]): Task => ({
    id: 'task-1',
    type: 'publisher',
    status: 'pending',
    agentId: 'publisher-1',
    input: { contents, channels },
    output: null,
    error: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
  });

  beforeEach(() => {
    const config: AgentConfig = {
      id: 'publisher-1',
      name: 'Publisher',
      type: 'publisher',
    };
    lockManager = new InMemoryLockManager();
    agent = new PublisherAgent(config, lockManager);
  });

  describe('execute', () => {
    it('should publish to a single channel', async () => {
      const contents = [createContent('medium')];
      const task = createTask(contents, ['medium']);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { results: Array<{ channel: string; success: boolean; externalUrl?: string }>; successCount: number };
        expect(output.results).toHaveLength(1);
        expect(output.results[0]?.success).toBe(true);
        expect(output.results[0]?.externalUrl).toBeDefined();
        expect(output.successCount).toBe(1);
      }
    });

    it('should publish to multiple channels', async () => {
      const contents = [
        createContent('medium'),
        createContent('linkedin'),
        createContent('blog'),
      ];
      const task = createTask(contents, ['medium', 'linkedin', 'blog']);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { results: Array<{ channel: string; success: boolean }>; successCount: number };
        expect(output.results).toHaveLength(3);
        expect(output.successCount).toBe(3);
      }
    });

    it('should report failure when no content matches channel', async () => {
      const contents = [createContent('medium')];
      const task = createTask(contents, ['medium', 'linkedin']);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { results: Array<{ channel: string; success: boolean; error?: string }>; successCount: number; failureCount: number };
        expect(output.successCount).toBe(1);
        expect(output.failureCount).toBe(1);
        const failed = output.results.find(r => r.channel === 'linkedin');
        expect(failed?.success).toBe(false);
        expect(failed?.error).toContain('No content available');
      }
    });

    it('should reject content with empty body', async () => {
      const contents = [createContent('medium', '', 'Title')];
      const task = createTask(contents, ['medium']);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { results: Array<{ success: boolean; error?: string }>; failureCount: number };
        expect(output.failureCount).toBe(1);
        expect(output.results[0]?.success).toBe(false);
        expect(output.results[0]?.error).toContain('Empty content body');
      }
    });

    it('should reject content with empty title', async () => {
      const contents = [createContent('medium', 'Some body', '')];
      const task = createTask(contents, ['medium']);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { results: Array<{ success: boolean; error?: string }>; failureCount: number };
        expect(output.failureCount).toBe(1);
        expect(output.results[0]?.success).toBe(false);
        expect(output.results[0]?.error).toContain('Empty content title');
      }
    });

    it('should fail with invalid input (non-array contents)', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'publisher',
        status: 'pending',
        agentId: 'publisher-1',
        input: { contents: 'invalid', channels: ['medium'] },
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
      };

      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('contents array is required');
      }
    });

    it('should fail with invalid input (non-array channels)', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'publisher',
        status: 'pending',
        agentId: 'publisher-1',
        input: { contents: [], channels: 'invalid' },
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

    it('should fail with empty channels array', async () => {
      const contents = [createContent('medium')];
      const task = createTask(contents, []);
      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('channels array must not be empty');
      }
    });

    it('should generate external URLs for successful publishes', async () => {
      const contents = [createContent('medium'), createContent('blog')];
      const task = createTask(contents, ['medium', 'blog']);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { results: Array<{ channel: string; success: boolean; externalUrl?: string }> };
        for (const r of output.results) {
          expect(r.success).toBe(true);
          expect(r.externalUrl).toContain(r.channel);
        }
      }
    });

    it('should track both success and failure counts', async () => {
      const contents = [createContent('medium')];
      // medium will succeed, linkedin has no matching content
      const task = createTask(contents, ['medium', 'linkedin']);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { successCount: number; failureCount: number };
        expect(output.successCount).toBe(1);
        expect(output.failureCount).toBe(1);
      }
    });
  });
});
