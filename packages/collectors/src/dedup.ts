/**
 * Material deduplication utilities
 */

import type { Material } from '@content-forge/core';

/**
 * Deduplicate materials by URL and title similarity
 */
export function deduplicateMaterials(materials: Material[]): Material[] {
  const seen = new Map<string, Material>();

  for (const material of materials) {
    const normalizedUrl = normalizeUrl(material.url);

    // Check exact URL match
    if (seen.has(normalizedUrl)) {
      continue;
    }

    // Check title similarity with existing materials
    let isDuplicate = false;
    for (const existing of seen.values()) {
      if (areTitlesSimilar(material.title, existing.title)) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.set(normalizedUrl, material);
    }
  }

  return Array.from(seen.values());
}

/**
 * Normalize URL for comparison
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slash, convert to lowercase, remove common tracking params
    const searchParams = new URLSearchParams(parsed.search);

    // Remove common tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'source'];
    for (const param of trackingParams) {
      searchParams.delete(param);
    }

    parsed.search = searchParams.toString();

    return parsed.href.toLowerCase().replace(/\/$/, '');
  } catch {
    return url.toLowerCase().trim();
  }
}

/**
 * Check if two titles are similar enough to be considered duplicates
 */
function areTitlesSimilar(title1: string, title2: string): boolean {
  const normalized1 = normalizeTitle(title1);
  const normalized2 = normalizeTitle(title2);

  // Exact match
  if (normalized1 === normalized2) {
    return true;
  }

  // Check if one is a substring of the other (with reasonable length)
  if (normalized1.length >= 20 && normalized2.length >= 20) {
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return true;
    }
  }

  // Calculate similarity using Levenshtein-like simple comparison
  const similarity = calculateSimilarity(normalized1, normalized2);
  return similarity > 0.85; // 85% similarity threshold
}

/**
 * Normalize title for comparison
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, '') // Remove punctuation, keep alphanumeric and Korean
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate simple similarity ratio between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  // Count matching characters in sequence
  let matches = 0;
  let i = 0;
  let j = 0;

  while (i < shorter.length && j < longer.length) {
    if (shorter[i] === longer[j]) {
      matches++;
      i++;
      j++;
    } else {
      j++;
    }
  }

  return matches / longer.length;
}

/**
 * Deduplicate materials by URL only (faster, less aggressive)
 */
export function deduplicateByUrl(materials: Material[]): Material[] {
  const seen = new Set<string>();
  const deduplicated: Material[] = [];

  for (const material of materials) {
    const normalizedUrl = normalizeUrl(material.url);

    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      deduplicated.push(material);
    }
  }

  return deduplicated;
}

/**
 * Deduplicate materials by title only
 */
export function deduplicateByTitle(materials: Material[]): Material[] {
  const deduplicated: Material[] = [];

  for (const material of materials) {
    let isDuplicate = false;

    for (const existing of deduplicated) {
      if (areTitlesSimilar(material.title, existing.title)) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      deduplicated.push(material);
    }
  }

  return deduplicated;
}
