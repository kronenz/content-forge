import { describe, it, expect, beforeEach } from 'vitest';
import { isOk, isErr } from '@content-forge/core';
import { InMemoryContentRepository } from '../repositories/in-memory/content-repository.js';
import type { Content, Channel } from '@content-forge/core';

function makeContent(overrides: Partial<Omit<Content, 'id' | 'createdAt'>> = {}): Omit<Content, 'id' | 'createdAt'> {
  return {
    materialId: 'mat-1',
    channel: 'medium',
    format: 'longform',
    body: 'Article body for Medium',
    metadata: {},
    status: 'draft',
    ...overrides,
  };
}

describe('InMemoryContentRepository', () => {
  let repo: InMemoryContentRepository;

  beforeEach(() => {
    repo = new InMemoryContentRepository();
  });

  it('creates content and assigns an id', async () => {
    const result = await repo.create(makeContent());
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.id).toBeDefined();
    expect(result.value.channel).toBe('medium');
  });

  it('finds content by id', async () => {
    const createResult = await repo.create(makeContent());
    if (!isOk(createResult)) return;

    const findResult = await repo.findById(createResult.value.id);
    expect(isOk(findResult)).toBe(true);
    if (!isOk(findResult)) return;
    expect(findResult.value).not.toBeNull();
    expect(findResult.value!.body).toBe('Article body for Medium');
  });

  it('returns null for non-existent id', async () => {
    const result = await repo.findById('does-not-exist');
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toBeNull();
  });

  it('updates content fields', async () => {
    const createResult = await repo.create(makeContent());
    if (!isOk(createResult)) return;

    const result = await repo.update(createResult.value.id, { body: 'Updated body' });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.body).toBe('Updated body');
  });

  it('returns error when updating non-existent content', async () => {
    const result = await repo.update('nope', { body: 'x' });
    expect(isErr(result)).toBe(true);
  });

  it('updates status', async () => {
    const createResult = await repo.create(makeContent());
    if (!isOk(createResult)) return;

    const result = await repo.updateStatus(createResult.value.id, 'approved');
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.status).toBe('approved');
  });

  it('filters by channel', async () => {
    await repo.create(makeContent({ channel: 'medium' }));
    await repo.create(makeContent({ channel: 'linkedin' }));
    await repo.create(makeContent({ channel: 'x-thread' }));

    const result = await repo.findAll({ channel: 'x-thread' });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data.length).toBe(1);
    expect(result.value.data[0]!.channel).toBe('x-thread');
  });

  it('filters by materialId', async () => {
    await repo.create(makeContent({ materialId: 'mat-1' }));
    await repo.create(makeContent({ materialId: 'mat-2' }));
    await repo.create(makeContent({ materialId: 'mat-1' }));

    const result = await repo.findAll({ materialId: 'mat-1' });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data.length).toBe(2);
  });

  it('paginates results', async () => {
    const channels: Channel[] = ['medium', 'linkedin', 'blog', 'brunch'];
    for (const ch of channels) {
      await repo.create(makeContent({ channel: ch }));
    }

    const result = await repo.findAll(undefined, { limit: 2, offset: 1 });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data.length).toBe(2);
    expect(result.value.total).toBe(4);
    expect(result.value.offset).toBe(1);
  });
});
