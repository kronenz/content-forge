/**
 * Guardian agent tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Task, ChannelContent, AgentConfig } from '@content-forge/core';
import { GuardianAgent } from '../guardian-agent.js';
import { InMemoryLockManager } from '../lock-manager.js';

describe('GuardianAgent', () => {
  let agent: GuardianAgent;
  let lockManager: InMemoryLockManager;

  const createContent = (channel: 'medium' | 'linkedin' | 'x-thread', bodyLength: number, title = 'Test Title'): ChannelContent => ({
    channel,
    title,
    body: 'x'.repeat(bodyLength),
    metadata: {},
  });

  const createTask = (content: ChannelContent): Task => ({
    id: 'task-1',
    type: 'guardian',
    status: 'pending',
    agentId: 'guardian-1',
    input: { content },
    output: null,
    error: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
  });

  beforeEach(() => {
    const config: AgentConfig = {
      id: 'guardian-1',
      name: 'Guardian',
      type: 'guardian',
    };
    lockManager = new InMemoryLockManager();
    agent = new GuardianAgent(config, lockManager);
  });

  describe('execute', () => {
    it('should approve valid medium content', async () => {
      const content = createContent('medium', 3000);
      const task = createTask(content);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { approved: boolean; feedback: string[] };
        expect(output.approved).toBe(true);
        expect(output.feedback).toContain('Content approved');
      }
    });

    it('should reject content that is too short', async () => {
      const content = createContent('medium', 100);
      const task = createTask(content);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { approved: boolean; feedback: string[] };
        expect(output.approved).toBe(false);
        expect(output.feedback.some(f => f.includes('too short'))).toBe(true);
      }
    });

    it('should reject content that is too long', async () => {
      const content = createContent('medium', 5000);
      const task = createTask(content);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { approved: boolean; feedback: string[] };
        expect(output.approved).toBe(false);
        expect(output.feedback.some(f => f.includes('too long'))).toBe(true);
      }
    });

    it('should validate linkedin length limits', async () => {
      const validContent = createContent('linkedin', 500);
      const tooShort = createContent('linkedin', 100);
      const tooLong = createContent('linkedin', 1000);

      const validResult = await agent.run(createTask(validContent));
      const shortResult = await agent.run(createTask(tooShort));
      const longResult = await agent.run(createTask(tooLong));

      expect(validResult.ok && (validResult.value.result as { approved: boolean }).approved).toBe(true);
      expect(shortResult.ok && (shortResult.value.result as { approved: boolean }).approved).toBe(false);
      expect(longResult.ok && (longResult.value.result as { approved: boolean }).approved).toBe(false);
    });

    it('should validate x-thread length limits', async () => {
      const validContent = createContent('x-thread', 200);
      const tooLong = createContent('x-thread', 300);

      const validResult = await agent.run(createTask(validContent));
      const longResult = await agent.run(createTask(tooLong));

      expect(validResult.ok && (validResult.value.result as { approved: boolean }).approved).toBe(true);
      expect(longResult.ok && (longResult.value.result as { approved: boolean }).approved).toBe(false);
    });

    it('should reject prohibited content', async () => {
      const content = createContent('medium', 3000);
      content.body = 'This is spam content that should be rejected';

      const task = createTask(content);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { approved: boolean; feedback: string[] };
        expect(output.approved).toBe(false);
        expect(output.feedback.some(f => f.includes('Prohibited'))).toBe(true);
      }
    });

    it('should reject prohibited content in title', async () => {
      const content = createContent('medium', 3000, 'This is a scam title');

      const task = createTask(content);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { approved: boolean; feedback: string[] };
        expect(output.approved).toBe(false);
        expect(output.feedback.some(f => f.includes('title'))).toBe(true);
      }
    });

    it('should reject empty body', async () => {
      const content = createContent('medium', 0);
      const task = createTask(content);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { approved: boolean; feedback: string[] };
        expect(output.approved).toBe(false);
        expect(output.feedback.some(f => f.includes('empty'))).toBe(true);
      }
    });

    it('should reject empty title', async () => {
      const content = createContent('medium', 3000, '');
      const task = createTask(content);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { approved: boolean; feedback: string[] };
        expect(output.approved).toBe(false);
        expect(output.feedback.some(f => f.includes('title') && f.includes('empty'))).toBe(true);
      }
    });

    it('should reject title that is too long', async () => {
      const content = createContent('medium', 3000, 'x'.repeat(250));
      const task = createTask(content);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { approved: boolean; feedback: string[] };
        expect(output.approved).toBe(false);
        expect(output.feedback.some(f => f.includes('Title too long'))).toBe(true);
      }
    });

    it('should fail with missing content', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'guardian',
        status: 'pending',
        agentId: 'guardian-1',
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
        expect(result.error.message).toContain('content is required');
      }
    });

    it('should return content in output', async () => {
      const content = createContent('medium', 3000);
      const task = createTask(content);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { content: ChannelContent };
        expect(output.content).toEqual(content);
      }
    });
  });
});
