import { describe, it, expect } from 'vitest';
import { deduplicateMaterials, deduplicateByUrl, deduplicateByTitle } from '../dedup.js';
import type { Material } from '@content-forge/core';

function makeMaterial(overrides: Partial<Material> = {}): Material {
  return {
    id: 'test-1',
    source: 'test',
    url: 'https://example.com/article-1',
    title: 'Test Article One',
    content: 'Content of article one.',
    score: 0,
    tags: [],
    status: 'new',
    collectedAt: new Date(),
    createdAt: new Date(),
    ...overrides,
  };
}

describe('deduplicateMaterials', () => {
  it('should remove exact URL duplicates', () => {
    const materials = [
      makeMaterial({ id: '1', url: 'https://example.com/a' }),
      makeMaterial({ id: '2', url: 'https://example.com/a', title: 'Different Title' }),
    ];

    const result = deduplicateMaterials(materials);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('1');
  });

  it('should remove URL duplicates with trailing slash difference', () => {
    const materials = [
      makeMaterial({ id: '1', url: 'https://example.com/a' }),
      makeMaterial({ id: '2', url: 'https://example.com/a/' }),
    ];

    const result = deduplicateMaterials(materials);
    expect(result).toHaveLength(1);
  });

  it('should remove title-similar duplicates', () => {
    const materials = [
      makeMaterial({ id: '1', url: 'https://a.com/x', title: 'Introduction to Machine Learning Basics' }),
      makeMaterial({ id: '2', url: 'https://b.com/y', title: 'Introduction to Machine Learning Basics' }),
    ];

    const result = deduplicateMaterials(materials);
    expect(result).toHaveLength(1);
  });

  it('should keep materials with different URLs and titles', () => {
    const materials = [
      makeMaterial({ id: '1', url: 'https://a.com/x', title: 'AI Article' }),
      makeMaterial({ id: '2', url: 'https://b.com/y', title: 'Cooking Recipe' }),
    ];

    const result = deduplicateMaterials(materials);
    expect(result).toHaveLength(2);
  });

  it('should handle empty array', () => {
    const result = deduplicateMaterials([]);
    expect(result).toHaveLength(0);
  });

  it('should handle single item', () => {
    const result = deduplicateMaterials([makeMaterial()]);
    expect(result).toHaveLength(1);
  });

  it('should strip UTM params for URL comparison', () => {
    const materials = [
      makeMaterial({ id: '1', url: 'https://example.com/a' }),
      makeMaterial({ id: '2', url: 'https://example.com/a?utm_source=twitter&utm_medium=social' }),
    ];

    const result = deduplicateMaterials(materials);
    expect(result).toHaveLength(1);
  });
});

describe('deduplicateByUrl', () => {
  it('should remove only URL duplicates', () => {
    const materials = [
      makeMaterial({ id: '1', url: 'https://a.com/x', title: 'Same Title' }),
      makeMaterial({ id: '2', url: 'https://b.com/y', title: 'Same Title' }),
      makeMaterial({ id: '3', url: 'https://a.com/x', title: 'Different' }),
    ];

    const result = deduplicateByUrl(materials);
    expect(result).toHaveLength(2);
  });
});

describe('deduplicateByTitle', () => {
  it('should remove only title duplicates', () => {
    const materials = [
      makeMaterial({ id: '1', url: 'https://a.com/x', title: 'Unique Article About Technology' }),
      makeMaterial({ id: '2', url: 'https://b.com/y', title: 'Unique Article About Technology' }),
      makeMaterial({ id: '3', url: 'https://c.com/z', title: 'Completely Different Topic Here' }),
    ];

    const result = deduplicateByTitle(materials);
    expect(result).toHaveLength(2);
  });
});
