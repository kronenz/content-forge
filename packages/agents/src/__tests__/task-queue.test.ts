/**
 * Task queue tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryTaskQueue } from '../task-queue.js';
import type { Task } from '@content-forge/core';

describe('InMemoryTaskQueue', () => {
  let queue: InMemoryTaskQueue;

  const createTask = (id: string, status: 'pending' | 'running' | 'completed' | 'failed' = 'pending'): Task => ({
    id,
    type: 'test',
    status,
    agentId: 'test-agent',
    input: {},
    output: null,
    error: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
  });

  beforeEach(() => {
    queue = new InMemoryTaskQueue();
  });

  describe('enqueue', () => {
    it('should add task to queue', async () => {
      const task = createTask('task-1');
      await queue.enqueue(task);

      expect(await queue.size()).toBe(1);
    });

    it('should add multiple tasks', async () => {
      await queue.enqueue(createTask('task-1'));
      await queue.enqueue(createTask('task-2'));
      await queue.enqueue(createTask('task-3'));

      expect(await queue.size()).toBe(3);
    });
  });

  describe('dequeue', () => {
    it('should return null for empty queue', async () => {
      const task = await queue.dequeue();
      expect(task).toBeNull();
    });

    it('should return and remove first task', async () => {
      const task1 = createTask('task-1');
      const task2 = createTask('task-2');

      await queue.enqueue(task1);
      await queue.enqueue(task2);

      const dequeued = await queue.dequeue();
      expect(dequeued?.id).toBe('task-1');
      expect(await queue.size()).toBe(1);
    });

    it('should maintain FIFO order', async () => {
      await queue.enqueue(createTask('task-1'));
      await queue.enqueue(createTask('task-2'));
      await queue.enqueue(createTask('task-3'));

      expect((await queue.dequeue())?.id).toBe('task-1');
      expect((await queue.dequeue())?.id).toBe('task-2');
      expect((await queue.dequeue())?.id).toBe('task-3');
      expect(await queue.dequeue()).toBeNull();
    });
  });

  describe('peek', () => {
    it('should return null for empty queue', async () => {
      const task = await queue.peek();
      expect(task).toBeNull();
    });

    it('should return first task without removing it', async () => {
      const task1 = createTask('task-1');
      await queue.enqueue(task1);
      await queue.enqueue(createTask('task-2'));

      const peeked = await queue.peek();
      expect(peeked?.id).toBe('task-1');
      expect(await queue.size()).toBe(2);
    });
  });

  describe('size', () => {
    it('should return 0 for empty queue', async () => {
      expect(await queue.size()).toBe(0);
    });

    it('should return correct count', async () => {
      await queue.enqueue(createTask('task-1'));
      await queue.enqueue(createTask('task-2'));

      expect(await queue.size()).toBe(2);
    });
  });

  describe('getByStatus', () => {
    it('should return empty array when no tasks match', async () => {
      await queue.enqueue(createTask('task-1', 'pending'));

      const tasks = await queue.getByStatus('completed');
      expect(tasks).toHaveLength(0);
    });

    it('should return matching tasks', async () => {
      await queue.enqueue(createTask('task-1', 'pending'));
      await queue.enqueue(createTask('task-2', 'running'));
      await queue.enqueue(createTask('task-3', 'pending'));

      const tasks = await queue.getByStatus('pending');
      expect(tasks).toHaveLength(2);
      expect(tasks[0]?.id).toBe('task-1');
      expect(tasks[1]?.id).toBe('task-3');
    });
  });

  describe('clear', () => {
    it('should remove all tasks', async () => {
      await queue.enqueue(createTask('task-1'));
      await queue.enqueue(createTask('task-2'));

      await queue.clear();

      expect(await queue.size()).toBe(0);
    });
  });
});
