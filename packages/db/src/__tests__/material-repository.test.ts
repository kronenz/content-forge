import { describe, it, expect, beforeEach } from 'vitest';
import { isOk, isErr } from '@content-forge/core';
import { InMemoryMaterialRepository } from '../repositories/in-memory/material-repository.js';
import type { Material } from '@content-forge/core';

function makeMaterial(overrides: Partial<Omit<Material, 'id' | 'createdAt'>> = {}): Omit<Material, 'id' | 'createdAt'> {
  return {
    source: 'rss',
    url: 'https://example.com/article',
    title: 'Test Article',
    content: 'Article body content',
    score: 7,
    tags: ['tech'],
    status: 'new',
    collectedAt: new Date('2025-01-15T10:00:00.000Z'),
    ...overrides,
  };
}

describe('InMemoryMaterialRepository', () => {
  let repo: InMemoryMaterialRepository;

  beforeEach(() => {
    repo = new InMemoryMaterialRepository();
  });

  it('creates a material and assigns an id', async () => {
    const result = await repo.create(makeMaterial());
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.id).toBeDefined();
    expect(result.value.title).toBe('Test Article');
    expect(result.value.createdAt).toBeInstanceOf(Date);
  });

  it('finds a material by id', async () => {
    const createResult = await repo.create(makeMaterial());
    if (!isOk(createResult)) return;

    const findResult = await repo.findById(createResult.value.id);
    expect(isOk(findResult)).toBe(true);
    if (!isOk(findResult)) return;
    expect(findResult.value).not.toBeNull();
    expect(findResult.value!.id).toBe(createResult.value.id);
  });

  it('returns null for non-existent id', async () => {
    const result = await repo.findById('non-existent');
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toBeNull();
  });

  it('updates a material', async () => {
    const createResult = await repo.create(makeMaterial());
    if (!isOk(createResult)) return;

    const updateResult = await repo.update(createResult.value.id, { score: 9, title: 'Updated' });
    expect(isOk(updateResult)).toBe(true);
    if (!isOk(updateResult)) return;
    expect(updateResult.value.score).toBe(9);
    expect(updateResult.value.title).toBe('Updated');
  });

  it('returns error when updating non-existent material', async () => {
    const result = await repo.update('non-existent', { score: 5 });
    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('updates status', async () => {
    const createResult = await repo.create(makeMaterial());
    if (!isOk(createResult)) return;

    const result = await repo.updateStatus(createResult.value.id, 'scored');
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.status).toBe('scored');
  });

  it('filters by status', async () => {
    await repo.create(makeMaterial({ status: 'new' }));
    await repo.create(makeMaterial({ status: 'scored' }));
    await repo.create(makeMaterial({ status: 'new' }));

    const result = await repo.findAll({ status: 'new' });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data.length).toBe(2);
    expect(result.value.total).toBe(2);
  });

  it('filters by source and minScore', async () => {
    await repo.create(makeMaterial({ source: 'rss', score: 3 }));
    await repo.create(makeMaterial({ source: 'rss', score: 8 }));
    await repo.create(makeMaterial({ source: 'trend', score: 9 }));

    const result = await repo.findAll({ source: 'rss', minScore: 5 });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data.length).toBe(1);
    expect(result.value.data[0]!.score).toBe(8);
  });

  it('paginates results', async () => {
    for (let i = 0; i < 5; i++) {
      await repo.create(makeMaterial({ title: `Article ${i}` }));
    }

    const page1 = await repo.findAll(undefined, { limit: 2, offset: 0 });
    expect(isOk(page1)).toBe(true);
    if (!isOk(page1)) return;
    expect(page1.value.data.length).toBe(2);
    expect(page1.value.total).toBe(5);

    const page2 = await repo.findAll(undefined, { limit: 2, offset: 2 });
    expect(isOk(page2)).toBe(true);
    if (!isOk(page2)) return;
    expect(page2.value.data.length).toBe(2);
    expect(page2.value.offset).toBe(2);
  });

  it('counts by status', async () => {
    await repo.create(makeMaterial({ status: 'new' }));
    await repo.create(makeMaterial({ status: 'new' }));
    await repo.create(makeMaterial({ status: 'scored' }));
    await repo.create(makeMaterial({ status: 'processed' }));

    const result = await repo.countByStatus();
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.new).toBe(2);
    expect(result.value.scored).toBe(1);
    expect(result.value.assigned).toBe(0);
    expect(result.value.processed).toBe(1);
  });
});
