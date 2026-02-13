/**
 * In-memory task queue for MVP
 * TODO: Replace with Redis-based queue in production
 */

import type { Task, TaskStatus } from '@content-forge/core';

export class InMemoryTaskQueue {
  private queue: Task[] = [];

  /**
   * Add a task to the queue
   */
  enqueue(task: Task): Promise<void> {
    this.queue.push(task);
    return Promise.resolve();
  }

  /**
   * Remove and return the next task from the queue
   */
  dequeue(): Promise<Task | null> {
    const task = this.queue.shift();
    return Promise.resolve(task ?? null);
  }

  /**
   * View the next task without removing it
   */
  peek(): Promise<Task | null> {
    const task = this.queue[0];
    return Promise.resolve(task ?? null);
  }

  /**
   * Get the number of tasks in the queue
   */
  size(): Promise<number> {
    return Promise.resolve(this.queue.length);
  }

  /**
   * Get all tasks with a specific status
   */
  getByStatus(status: TaskStatus): Promise<Task[]> {
    return Promise.resolve(this.queue.filter(task => task.status === status));
  }

  /**
   * Clear all tasks (for testing)
   */
  clear(): Promise<void> {
    this.queue = [];
    return Promise.resolve();
  }
}
