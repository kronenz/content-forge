/**
 * Base agent class - all agents extend this
 */

import { Ok, Err, type Result, type Task, type AgentConfig, createLogger, type Logger } from '@content-forge/core';
import type { AgentError, TaskOutput } from './types.js';
import { InMemoryLockManager } from './lock-manager.js';
import type { TaskRepository } from '@content-forge/db';

export abstract class BaseAgent {
  readonly id: string;
  readonly name: string;
  protected logger: Logger;
  private lockManager: InMemoryLockManager;
  private lockTtlMs: number;
  private taskRepo: TaskRepository | undefined;

  constructor(
    config: AgentConfig,
    lockManager?: InMemoryLockManager,
    lockTtlMs = 30000,
    taskRepo?: TaskRepository,
  ) {
    this.id = config.id;
    this.name = config.name;
    this.logger = createLogger({ agentId: config.id });
    this.lockManager = lockManager ?? new InMemoryLockManager();
    this.lockTtlMs = lockTtlMs;
    this.taskRepo = taskRepo;
  }

  /**
   * Template method: acquireLock → execute → releaseLock
   */
  async run(task: Task): Promise<Result<TaskOutput, AgentError>> {
    this.logger.info('agent.task.start', { taskId: task.id, taskType: task.type });

    // Record task start in DB (best-effort)
    await this.updateTaskDb(task.id, {
      status: 'running',
      startedAt: new Date(),
    });

    try {
      // Acquire lock
      const lockResult = await this.acquireLock(task);
      if (!lockResult.ok) {
        this.logger.warn('agent.task.lock_failed', {
          taskId: task.id,
          error: lockResult.error.message
        });

        const err: AgentError = {
          agent: this.name,
          message: lockResult.error.message,
          cause: lockResult.error,
        };

        await this.updateTaskDb(task.id, {
          status: 'failed',
          error: err.message,
          completedAt: new Date(),
        });

        return Err(err);
      }

      // Execute the task
      const result = await this.execute(task);

      // Release lock
      await this.releaseLock(task);

      if (result.ok) {
        this.logger.info('agent.task.complete', {
          taskId: task.id,
          success: true,
        });

        await this.updateTaskDb(task.id, {
          status: 'completed',
          output: result.value.result,
          completedAt: new Date(),
        });
      } else {
        this.logger.error('agent.task.complete', {
          taskId: task.id,
          success: false,
          error: result.error.message,
        });

        await this.updateTaskDb(task.id, {
          status: 'failed',
          error: result.error.message,
          completedAt: new Date(),
        });
      }

      return result;
    } catch (err) {
      this.logger.error('agent.task.error', {
        taskId: task.id,
        error: String(err)
      });

      // Try to release lock on error
      await this.releaseLock(task).catch(() => {
        // Ignore release errors in error handler
      });

      await this.updateTaskDb(task.id, {
        status: 'failed',
        error: String(err),
        completedAt: new Date(),
      });

      return Err({
        agent: this.name,
        message: String(err),
        cause: err,
      });
    }
  }

  /**
   * Subclasses implement this to perform their specific task
   */
  protected abstract execute(task: Task): Promise<Result<TaskOutput, AgentError>>;

  /**
   * Acquire a lock for the task
   */
  protected async acquireLock(task: Task): Promise<Result<void, AgentError>> {
    const lockKey = `task:${task.id}`;
    const owner = this.id;

    const result = await this.lockManager.acquire(lockKey, owner, this.lockTtlMs);

    if (!result.ok) {
      return Err({
        agent: this.name,
        message: `Failed to acquire lock: ${result.error.message}`,
        cause: result.error,
      });
    }

    return Ok(undefined);
  }

  /**
   * Release the lock for the task
   */
  protected async releaseLock(task: Task): Promise<void> {
    const lockKey = `task:${task.id}`;
    const owner = this.id;

    await this.lockManager.release(lockKey, owner);
  }

  /**
   * Best-effort DB update — failures are logged but never break business logic.
   */
  private async updateTaskDb(
    taskId: string,
    data: Partial<Omit<Task, 'id' | 'createdAt'>>,
  ): Promise<void> {
    if (!this.taskRepo) return;
    try {
      await this.taskRepo.update(taskId, data);
    } catch (error) {
      this.logger.warn('agent.task.db_update_failed', {
        taskId,
        error: String(error),
      });
    }
  }
}
