import { describe, it, expect, beforeEach } from 'vitest';
import { isOk, isErr } from '@content-forge/core';
import { InMemoryTaskRepository } from '../repositories/in-memory/task-repository.js';
import type { Task } from '@content-forge/core';

function makeTask(overrides: Partial<Omit<Task, 'id' | 'createdAt'>> = {}): Omit<Task, 'id' | 'createdAt'> {
  return {
    type: 'write',
    status: 'pending',
    agentId: 'writer-agent',
    input: { materialId: 'mat-1' },
    output: null,
    error: null,
    startedAt: null,
    completedAt: null,
    ...overrides,
  };
}

describe('InMemoryTaskRepository', () => {
  let repo: InMemoryTaskRepository;

  beforeEach(() => {
    repo = new InMemoryTaskRepository();
  });

  it('creates a task and assigns an id', async () => {
    const result = await repo.create(makeTask());
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.id).toBeDefined();
    expect(result.value.type).toBe('write');
    expect(result.value.status).toBe('pending');
  });

  it('finds a task by id', async () => {
    const createResult = await repo.create(makeTask());
    if (!isOk(createResult)) return;

    const result = await repo.findById(createResult.value.id);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).not.toBeNull();
    expect(result.value!.agentId).toBe('writer-agent');
  });

  it('returns null for non-existent task', async () => {
    const result = await repo.findById('ghost');
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toBeNull();
  });

  it('updates task fields', async () => {
    const createResult = await repo.create(makeTask());
    if (!isOk(createResult)) return;

    const now = new Date();
    const result = await repo.update(createResult.value.id, {
      status: 'running',
      startedAt: now,
    });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.status).toBe('running');
    expect(result.value.startedAt).toEqual(now);
  });

  it('returns error when updating non-existent task', async () => {
    const result = await repo.update('nope', { status: 'running' });
    expect(isErr(result)).toBe(true);
  });

  it('updates status', async () => {
    const createResult = await repo.create(makeTask());
    if (!isOk(createResult)) return;

    const result = await repo.updateStatus(createResult.value.id, 'completed');
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.status).toBe('completed');
  });

  it('filters by status and agentId', async () => {
    await repo.create(makeTask({ status: 'pending', agentId: 'writer' }));
    await repo.create(makeTask({ status: 'running', agentId: 'writer' }));
    await repo.create(makeTask({ status: 'pending', agentId: 'collector' }));

    const result = await repo.findAll({ status: 'pending', agentId: 'writer' });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data.length).toBe(1);
  });

  it('filters by type', async () => {
    await repo.create(makeTask({ type: 'write' }));
    await repo.create(makeTask({ type: 'collect' }));
    await repo.create(makeTask({ type: 'write' }));

    const result = await repo.findAll({ type: 'write' });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data.length).toBe(2);
  });
});
