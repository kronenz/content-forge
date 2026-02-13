import { describe, it, expect, beforeEach } from 'vitest';
import { isOk } from '@content-forge/core';
import { InMemoryPublicationRepository } from '../repositories/in-memory/publication-repository.js';
import type { Publication } from '@content-forge/core';

function makePublication(overrides: Partial<Omit<Publication, 'id'>> = {}): Omit<Publication, 'id'> {
  return {
    contentId: 'cnt-1',
    channel: 'medium',
    externalUrl: 'https://medium.com/@user/article-123',
    externalId: 'article-123',
    publishedAt: new Date('2025-01-15T12:00:00.000Z'),
    metadata: {},
    ...overrides,
  };
}

describe('InMemoryPublicationRepository', () => {
  let repo: InMemoryPublicationRepository;

  beforeEach(() => {
    repo = new InMemoryPublicationRepository();
  });

  it('creates a publication and assigns an id', async () => {
    const result = await repo.create(makePublication());
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.id).toBeDefined();
    expect(result.value.channel).toBe('medium');
    expect(result.value.externalId).toBe('article-123');
  });

  it('finds a publication by id', async () => {
    const createResult = await repo.create(makePublication());
    if (!isOk(createResult)) return;

    const result = await repo.findById(createResult.value.id);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).not.toBeNull();
    expect(result.value!.externalUrl).toBe('https://medium.com/@user/article-123');
  });

  it('returns null for non-existent id', async () => {
    const result = await repo.findById('nope');
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toBeNull();
  });

  it('filters by channel', async () => {
    await repo.create(makePublication({ channel: 'medium' }));
    await repo.create(makePublication({ channel: 'linkedin' }));
    await repo.create(makePublication({ channel: 'ig-carousel' }));
    await repo.create(makePublication({ channel: 'medium' }));

    const result = await repo.findAll({ channel: 'medium' });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data.length).toBe(2);
  });

  it('filters by contentId', async () => {
    await repo.create(makePublication({ contentId: 'cnt-1' }));
    await repo.create(makePublication({ contentId: 'cnt-2' }));
    await repo.create(makePublication({ contentId: 'cnt-1' }));

    const result = await repo.findAll({ contentId: 'cnt-1' });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data.length).toBe(2);
  });

  it('paginates results', async () => {
    for (let i = 0; i < 6; i++) {
      await repo.create(makePublication({ externalId: `pub-${i}` }));
    }

    const result = await repo.findAll(undefined, { limit: 3, offset: 0 });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data.length).toBe(3);
    expect(result.value.total).toBe(6);
  });

  it('sorts by publishedAt descending', async () => {
    await repo.create(makePublication({
      externalId: 'early',
      publishedAt: new Date('2025-01-10T00:00:00.000Z'),
    }));
    await repo.create(makePublication({
      externalId: 'late',
      publishedAt: new Date('2025-01-20T00:00:00.000Z'),
    }));

    const result = await repo.findAll();
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data[0]!.externalId).toBe('late');
    expect(result.value.data[1]!.externalId).toBe('early');
  });
});
