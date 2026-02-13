import { describe, it, expect } from 'vitest';
import { scoreMaterial, scoreMaterials, type ScoringCriteria } from '../scorer.js';
import type { Material } from '@content-forge/core';

function makeMaterial(overrides: Partial<Material> = {}): Material {
  return {
    id: 'test-1',
    source: 'test',
    url: 'https://example.com/article',
    title: 'Test Article about AI and Machine Learning',
    content: 'This is a long article about artificial intelligence and machine learning techniques used in production systems.',
    score: 0,
    tags: ['ai', 'ml'],
    status: 'new',
    collectedAt: new Date(),
    createdAt: new Date(),
    ...overrides,
  };
}

const defaultCriteria: ScoringCriteria = {
  relevanceKeywords: ['ai', 'machine learning', 'artificial intelligence'],
  minLength: 50,
  preferredSources: ['techblog', 'arxiv'],
};

describe('scoreMaterial', () => {
  it('should return a score between 1 and 10', async () => {
    const material = makeMaterial();
    const result = await scoreMaterial(material, defaultCriteria);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeGreaterThanOrEqual(1);
      expect(result.value).toBeLessThanOrEqual(10);
    }
  });

  it('should score higher with keyword matches', async () => {
    const withKeywords = makeMaterial({
      title: 'AI and Machine Learning Guide',
      content: 'Artificial intelligence is transforming machine learning applications.',
    });
    const withoutKeywords = makeMaterial({
      title: 'Cooking Recipe',
      content: 'How to make pasta at home.',
    });

    const resultWith = await scoreMaterial(withKeywords, defaultCriteria);
    const resultWithout = await scoreMaterial(withoutKeywords, defaultCriteria);

    expect(resultWith.ok).toBe(true);
    expect(resultWithout.ok).toBe(true);
    if (resultWith.ok && resultWithout.ok) {
      expect(resultWith.value).toBeGreaterThan(resultWithout.value);
    }
  });

  it('should score higher for preferred sources', async () => {
    const preferred = makeMaterial({ source: 'techblog' });
    const nonPreferred = makeMaterial({ source: 'random-blog' });

    const resultPreferred = await scoreMaterial(preferred, defaultCriteria);
    const resultNon = await scoreMaterial(nonPreferred, defaultCriteria);

    expect(resultPreferred.ok).toBe(true);
    expect(resultNon.ok).toBe(true);
    if (resultPreferred.ok && resultNon.ok) {
      expect(resultPreferred.value).toBeGreaterThanOrEqual(resultNon.value);
    }
  });

  it('should score higher for longer content', async () => {
    const longContent = makeMaterial({ content: 'a'.repeat(200) });
    const shortContent = makeMaterial({ content: 'short' });

    const criteria: ScoringCriteria = {
      relevanceKeywords: [],
      minLength: 100,
      preferredSources: [],
    };

    const resultLong = await scoreMaterial(longContent, criteria);
    const resultShort = await scoreMaterial(shortContent, criteria);

    expect(resultLong.ok).toBe(true);
    expect(resultShort.ok).toBe(true);
    if (resultLong.ok && resultShort.ok) {
      expect(resultLong.value).toBeGreaterThanOrEqual(resultShort.value);
    }
  });

  it('should handle empty criteria gracefully', async () => {
    const material = makeMaterial();
    const emptyCriteria: ScoringCriteria = {
      relevanceKeywords: [],
      minLength: 0,
      preferredSources: [],
    };

    const result = await scoreMaterial(material, emptyCriteria);
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Base 5 + length bonus (content > 0 >= minLength*2=0)
      expect(result.value).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('scoreMaterials', () => {
  it('should score multiple materials', async () => {
    const materials = [makeMaterial({ id: '1' }), makeMaterial({ id: '2' })];
    const result = await scoreMaterials(materials, defaultCriteria);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0]!.status).toBe('scored');
      expect(result.value[1]!.status).toBe('scored');
    }
  });

  it('should handle empty array', async () => {
    const result = await scoreMaterials([], defaultCriteria);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(0);
    }
  });
});
