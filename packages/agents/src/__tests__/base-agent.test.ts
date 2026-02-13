/**
 * Base agent tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Ok, Err, type Result, type Task, type AgentConfig } from '@content-forge/core';
import { BaseAgent } from '../base-agent.js';
import type { AgentError, TaskOutput } from '../types.js';
import { InMemoryLockManager } from '../lock-manager.js';

// Concrete implementation for testing
class TestAgent extends BaseAgent {
  public executionCount = 0;
  public shouldFail = false;
  public shouldThrow = false;

  protected async execute(task: Task): Promise<Result<TaskOutput, AgentError>> {
    this.executionCount++;

    if (this.shouldThrow) {
      throw new Error('Test execution error');
    }

    if (this.shouldFail) {
      return Err({
        agent: this.name,
        message: 'Test failure',
      });
    }

    return Ok({
      agentId: this.id,
      taskId: task.id,
      result: { test: true },
      completedAt: new Date(),
    });
  }
}

describe('BaseAgent', () => {
  let agent: TestAgent;
  let lockManager: InMemoryLockManager;
  let config: AgentConfig;

  const createTask = (id: string): Task => ({
    id,
    type: 'test',
    status: 'pending',
    agentId: 'test-agent',
    input: {},
    output: null,
    error: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
  });

  beforeEach(() => {
    config = {
      id: 'test-agent-1',
      name: 'TestAgent',
      type: 'test',
    };
    lockManager = new InMemoryLockManager();
    agent = new TestAgent(config, lockManager);
  });

  describe('run', () => {
    it('should execute task successfully', async () => {
      const task = createTask('task-1');
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      expect(agent.executionCount).toBe(1);

      if (result.ok) {
        expect(result.value.agentId).toBe('test-agent-1');
        expect(result.value.taskId).toBe('task-1');
      }
    });

    it('should acquire and release lock', async () => {
      const task = createTask('task-1');
      await agent.run(task);

      // Lock should be released after execution
      expect(await lockManager.isLocked('task:task-1')).toBe(false);
    });

    it('should fail when lock is already held', async () => {
      const task = createTask('task-1');

      // Acquire lock manually
      await lockManager.acquire('task:task-1', 'other-agent', 30000);

      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      expect(agent.executionCount).toBe(0); // Should not execute

      if (!result.ok) {
        expect(result.error.message).toContain('lock');
      }
    });

    it('should handle execution failure', async () => {
      agent.shouldFail = true;
      const task = createTask('task-1');

      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      expect(agent.executionCount).toBe(1);

      // Lock should be released even on failure
      expect(await lockManager.isLocked('task:task-1')).toBe(false);
    });

    it('should handle execution exception', async () => {
      agent.shouldThrow = true;
      const task = createTask('task-1');

      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      expect(agent.executionCount).toBe(1);

      if (!result.ok) {
        expect(result.error.message).toContain('Test execution error');
      }

      // Lock should be released even on exception
      expect(await lockManager.isLocked('task:task-1')).toBe(false);
    });

    it('should prevent concurrent execution of same task', async () => {
      const task = createTask('task-1');

      // Start first execution (don't await)
      const promise1 = agent.run(task);

      // Try to start second execution
      const result2 = await agent.run(task);

      // Second should fail to acquire lock
      expect(result2.ok).toBe(false);

      // Wait for first to complete
      const result1 = await promise1;
      expect(result1.ok).toBe(true);
    });
  });

  describe('properties', () => {
    it('should have correct id and name', () => {
      expect(agent.id).toBe('test-agent-1');
      expect(agent.name).toBe('TestAgent');
    });

    it('should have logger', () => {
      expect(agent['logger']).toBeDefined();
    });
  });
});
