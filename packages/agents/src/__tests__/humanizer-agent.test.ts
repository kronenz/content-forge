/**
 * Humanizer agent tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Task, ChannelContent, AgentConfig } from '@content-forge/core';
import { HumanizerAgent } from '../humanizer-agent.js';
import { InMemoryLockManager } from '../lock-manager.js';

describe('HumanizerAgent', () => {
  let agent: HumanizerAgent;
  let lockManager: InMemoryLockManager;

  const createContent = (body: string, title = 'Test Title', channel: 'medium' | 'linkedin' = 'medium'): ChannelContent => ({
    channel,
    title,
    body,
    metadata: {},
  });

  const createTask = (content: ChannelContent): Task => ({
    id: 'task-1',
    type: 'humanizer',
    status: 'pending',
    agentId: 'humanizer-1',
    input: { content },
    output: null,
    error: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
  });

  beforeEach(() => {
    const config: AgentConfig = {
      id: 'humanizer-1',
      name: 'Humanizer',
      type: 'humanizer',
    };
    lockManager = new InMemoryLockManager();
    agent = new HumanizerAgent(config, lockManager);
  });

  describe('execute', () => {
    it('should replace "In conclusion" with natural alternative', async () => {
      const content = createContent('In conclusion, this is a great article.');
      const task = createTask(content);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { content: ChannelContent; changes: string[] };
        expect(output.content.body).toContain('To wrap up');
        expect(output.content.body).not.toContain('In conclusion');
        expect(output.changes.some(c => c.includes('In conclusion'))).toBe(true);
      }
    });

    it('should replace multiple AI patterns', async () => {
      const content = createContent(
        'Furthermore, it is important. Delve into this topic. Leverage the tools available.'
      );
      const task = createTask(content);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { content: ChannelContent; changes: string[] };
        expect(output.content.body).toContain('Also');
        expect(output.content.body).toContain('Explore');
        expect(output.content.body).toContain('Use');
        expect(output.content.body).not.toContain('Furthermore');
        expect(output.content.body).not.toContain('Delve');
        expect(output.content.body).not.toContain('Leverage');
        expect(output.changes.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('should calculate AI pattern score', async () => {
      const content = createContent(
        'Furthermore, delve into this. In conclusion, leverage these tools. Utilize the platform.'
      );
      const task = createTask(content);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { aiPatternScore: number };
        // 4 patterns * 20 = 80
        expect(output.aiPatternScore).toBeGreaterThanOrEqual(60);
      }
    });

    it('should return score of 0 for clean human text', async () => {
      const content = createContent('This is a normal article with everyday language.');
      const task = createTask(content);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { aiPatternScore: number };
        expect(output.aiPatternScore).toBe(0);
      }
    });

    it('should detect low sentence variety', async () => {
      // All sentences have similar word counts (around 5 words each)
      const content = createContent(
        'The cat sat on mat. The dog ran in park. The bird flew over tree. The fish swam in lake.'
      );
      const task = createTask(content);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { changes: string[] };
        expect(output.changes.some(c => c.includes('sentence variety') || c.includes('Repetitive sentence start'))).toBe(true);
      }
    });

    it('should also process AI patterns in title', async () => {
      const content = createContent('Normal body text.', 'Furthermore, An Important Delve');
      const task = createTask(content);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { content: ChannelContent; changes: string[] };
        expect(output.content.title).not.toContain('Furthermore');
        expect(output.changes.some(c => c.startsWith('Title:'))).toBe(true);
      }
    });

    it('should not modify content without AI patterns', async () => {
      const body = 'This is a perfectly natural human-written article.';
      const content = createContent(body);
      const task = createTask(content);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { content: ChannelContent; changes: string[] };
        expect(output.content.body).toBe(body);
        // No body/title replacement changes (variety checks may still appear)
        const replacementChanges = output.changes.filter(c => c.includes('Replaced'));
        expect(replacementChanges).toHaveLength(0);
      }
    });

    it('should fail with missing content', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'humanizer',
        status: 'pending',
        agentId: 'humanizer-1',
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

    it('should replace "In order to" with "To"', async () => {
      const content = createContent('In order to succeed, you must work hard.');
      const task = createTask(content);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { content: ChannelContent };
        expect(output.content.body).toContain('To succeed');
        expect(output.content.body).not.toContain('In order to');
      }
    });

    it('should cap AI pattern score at 100', async () => {
      // Create content with many AI patterns
      const content = createContent(
        'Furthermore, delve into this. In conclusion, leverage tools. Utilize the platform. ' +
        'It is worth mentioning that in order to succeed due to the fact that it goes without saying.'
      );
      const task = createTask(content);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);

      if (result.ok) {
        const output = result.value.result as { aiPatternScore: number };
        expect(output.aiPatternScore).toBeLessThanOrEqual(100);
      }
    });
  });
});
