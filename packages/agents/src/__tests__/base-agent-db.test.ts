/**
 * BaseAgent DB integration tests — verifies task status persistence via TaskRepository
 */

import { describe, it, expect } from 'vitest';
import { Ok, Err, type Result, type Task, type AgentConfig } from '@content-forge/core';
import { BaseAgent } from '../base-agent.js';
import type { AgentError, TaskOutput } from '../types.js';
import { InMemoryLockManager } from '../lock-manager.js';
import { InMemoryTaskRepository } from '@content-forge/db/testing';

// Concrete agent for testing
class TestAgent extends BaseAgent {
  public shouldFail = false;
  public shouldThrow = false;

  protected async execute(task: Task): Promise<Result<TaskOutput, AgentError>> {
    if (this.shouldThrow) {
      throw new Error('Unexpected execution error');
    }

    if (this.shouldFail) {
      return Err({
        agent: this.name,
        message: 'Task execution failed',
      });
    }

    return Ok({
      agentId: this.id,
      taskId: task.id,
      result: { processed: true, items: 42 },
      completedAt: new Date(),
    });
  }
}

const agentConfig: AgentConfig = {
  id: 'test-agent-001',
  name: 'TestAgent',
  role: 'test',
  capabilities: [],
};

function createTask(id: string): Task {
  return {
    id,
    type: 'test-task',
    status: 'pending',
    agentId: agentConfig.id,
    input: { key: 'value' },
    output: null,
    error: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
  };
}

describe('BaseAgent with TaskRepository', () => {
  it('should persist completed status and output to DB on success', async () => {
    const taskRepo = new InMemoryTaskRepository();
    const lockManager = new InMemoryLockManager();
    const agent = new TestAgent(agentConfig, lockManager, 30000, taskRepo);

    // Create task in DB first
    const task = createTask('task-success');
    await taskRepo.create({
      type: task.type,
      status: task.status,
      agentId: task.agentId,
      input: task.input,
      output: null,
      error: null,
      startedAt: null,
      completedAt: null,
    });

    // Get the DB-assigned ID
    const allTasks = await taskRepo.findAll();
    expect(allTasks.ok).toBe(true);
    const dbTask = allTasks.ok ? allTasks.value.data[0] : null;
    expect(dbTask).not.toBeNull();

    // Run the agent with the DB task ID
    const taskWithDbId = { ...task, id: dbTask!.id };
    const result = await agent.run(taskWithDbId);

    expect(result.ok).toBe(true);

    // Verify DB was updated
    const dbResult = await taskRepo.findById(dbTask!.id);
    expect(dbResult.ok).toBe(true);
    if (dbResult.ok && dbResult.value) {
      expect(dbResult.value.status).toBe('completed');
      expect(dbResult.value.output).toEqual({ processed: true, items: 42 });
      expect(dbResult.value.completedAt).toBeInstanceOf(Date);
    }
  });

  it('should persist failed status and error to DB on failure', async () => {
    const taskRepo = new InMemoryTaskRepository();
    const lockManager = new InMemoryLockManager();
    const agent = new TestAgent(agentConfig, lockManager, 30000, taskRepo);
    agent.shouldFail = true;

    // Create task in DB
    const createResult = await taskRepo.create({
      type: 'test-task',
      status: 'pending',
      agentId: agentConfig.id,
      input: {},
      output: null,
      error: null,
      startedAt: null,
      completedAt: null,
    });
    const dbTaskId = createResult.ok ? createResult.value.id : '';

    const task = createTask(dbTaskId);
    const result = await agent.run(task);

    expect(result.ok).toBe(false);

    // Verify DB was updated with failure
    const dbResult = await taskRepo.findById(dbTaskId);
    expect(dbResult.ok).toBe(true);
    if (dbResult.ok && dbResult.value) {
      expect(dbResult.value.status).toBe('failed');
      expect(dbResult.value.error).toBe('Task execution failed');
      expect(dbResult.value.completedAt).toBeInstanceOf(Date);
    }
  });

  it('should persist failed status on unexpected throw', async () => {
    const taskRepo = new InMemoryTaskRepository();
    const lockManager = new InMemoryLockManager();
    const agent = new TestAgent(agentConfig, lockManager, 30000, taskRepo);
    agent.shouldThrow = true;

    const createResult = await taskRepo.create({
      type: 'test-task',
      status: 'pending',
      agentId: agentConfig.id,
      input: {},
      output: null,
      error: null,
      startedAt: null,
      completedAt: null,
    });
    const dbTaskId = createResult.ok ? createResult.value.id : '';

    const task = createTask(dbTaskId);
    const result = await agent.run(task);

    expect(result.ok).toBe(false);

    // Verify DB captured the error
    const dbResult = await taskRepo.findById(dbTaskId);
    expect(dbResult.ok).toBe(true);
    if (dbResult.ok && dbResult.value) {
      expect(dbResult.value.status).toBe('failed');
      expect(dbResult.value.error).toContain('Unexpected execution error');
    }
  });

  it('should work without taskRepo (backward compatible)', async () => {
    const lockManager = new InMemoryLockManager();
    // No taskRepo passed — 4th arg omitted
    const agent = new TestAgent(agentConfig, lockManager, 30000);

    const task = createTask('task-no-repo');
    const result = await agent.run(task);

    // Should succeed without DB
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.result).toEqual({ processed: true, items: 42 });
    }
  });

  it('should not break when taskRepo.update returns an error', async () => {
    const taskRepo = new InMemoryTaskRepository();
    const lockManager = new InMemoryLockManager();
    const agent = new TestAgent(agentConfig, lockManager, 30000, taskRepo);

    // Run with a task ID that doesn't exist in DB — update will return Err
    const task = createTask('nonexistent-task-id');
    const result = await agent.run(task);

    // Agent should still succeed despite DB update returning NOT_FOUND
    expect(result.ok).toBe(true);
  });
});
