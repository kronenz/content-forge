/**
 * Canonical channel configuration for ContentForge.
 *
 * Single source of truth for channel names, legacy aliases, and DB column mappings.
 */

/** All canonical channel identifiers */
export const CANONICAL_CHANNELS = [
  'medium', 'linkedin', 'x-thread', 'threads', 'brunch', 'newsletter',
  'blog', 'kakao', 'youtube', 'shorts', 'reels', 'tiktok',
  'ig-carousel', 'ig-single', 'ig-story', 'webtoon',
] as const;

/** Map legacy / alternative names to canonical channel names */
export const LEGACY_ALIAS: Record<string, string> = {
  'x': 'x-thread',
  'ig_carousel': 'ig-carousel',
  'ig_single': 'ig-single',
  'ig_story': 'ig-story',
  'instagram-carousel': 'ig-carousel',
  'instagram-single': 'ig-single',
  'instagram-story': 'ig-story',
  'twitter': 'x-thread',
};

/** Map canonical channel names to DB column names (only entries that differ) */
export const DB_MAPPING: Record<string, string> = {
  'x-thread': 'x_thread',
  'ig-carousel': 'ig_carousel',
  'ig-single': 'ig_single',
  'ig-story': 'ig_story',
};
