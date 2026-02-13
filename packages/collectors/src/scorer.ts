/**
 * Material scoring utilities
 */

import { Ok, Err, type Material } from '@content-forge/core';
import type { Result } from './base-collector.js';

export interface ScoringCriteria {
  relevanceKeywords: string[];
  minLength: number;
  preferredSources: string[];
}

export interface ScorerError {
  message: string;
  cause?: unknown;
}

/**
 * Score a material based on criteria (1-10 scale)
 */
export function scoreMaterial(
  material: Material,
  criteria: ScoringCriteria
): Result<number, ScorerError> {
  try {
    let score = 5; // Base score

    // Keyword relevance scoring (up to +3 points)
    const keywordScore = calculateKeywordScore(material, criteria.relevanceKeywords);
    score += keywordScore;

    // Length scoring (up to +1 point)
    const lengthScore = calculateLengthScore(material, criteria.minLength);
    score += lengthScore;

    // Source preference scoring (up to +1 point)
    const sourceScore = calculateSourceScore(material, criteria.preferredSources);
    score += sourceScore;

    // Clamp to 1-10 range
    score = Math.max(1, Math.min(10, score));

    return Ok(score);
  } catch (error) {
    return Err({
      message: 'Failed to score material',
      cause: error,
    });
  }
}

/**
 * Calculate keyword relevance score (0-3 points)
 */
function calculateKeywordScore(material: Material, keywords: string[]): number {
  if (keywords.length === 0) {
    return 0;
  }

  const text = `${material.title} ${material.content}`.toLowerCase();
  const matchedKeywords = keywords.filter(keyword =>
    text.includes(keyword.toLowerCase())
  );

  const matchRatio = matchedKeywords.length / keywords.length;

  if (matchRatio >= 0.5) return 3;
  if (matchRatio >= 0.3) return 2;
  if (matchRatio >= 0.1) return 1;
  return 0;
}

/**
 * Calculate length score (0-1 point)
 */
function calculateLengthScore(material: Material, minLength: number): number {
  const contentLength = material.content.length;

  if (contentLength >= minLength * 2) return 1;
  if (contentLength >= minLength) return 0.5;
  return 0;
}

/**
 * Calculate source preference score (0-1 point)
 */
function calculateSourceScore(material: Material, preferredSources: string[]): number {
  if (preferredSources.length === 0) {
    return 0;
  }

  const materialSource = material.source.toLowerCase();
  const isPreferred = preferredSources.some(source =>
    materialSource.includes(source.toLowerCase())
  );

  return isPreferred ? 1 : 0;
}

/**
 * Batch score multiple materials
 */
export function scoreMaterials(
  materials: Material[],
  criteria: ScoringCriteria
): Result<Material[], ScorerError> {
  try {
    const scoredMaterials: Material[] = [];

    for (const material of materials) {
      const result = scoreMaterial(material, criteria);

      if (result.ok) {
        scoredMaterials.push({
          ...material,
          score: result.value,
          status: 'scored',
        });
      } else {
        // Keep original material if scoring fails
        scoredMaterials.push(material);
      }
    }

    return Ok(scoredMaterials);
  } catch (error) {
    return Err({
      message: 'Failed to score materials',
      cause: error,
    });
  }
}
