/**
 * Channel schema utilities: validation, normalization, and DB mapping.
 *
 * Uses the canonical channel list from channel-config as the single source of truth.
 */

import { z } from 'zod';
import type { Channel } from './types.js';
import { CANONICAL_CHANNELS, LEGACY_ALIAS, DB_MAPPING } from './channel-config.js';

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

/** Zod schema that validates canonical channel strings */
export const ChannelSchema = z.enum(
  CANONICAL_CHANNELS as unknown as [string, ...string[]],
);

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

/** Returns `true` when `value` is one of the 16 canonical channel names. */
export function isCanonicalChannel(value: string): value is Channel {
  return (CANONICAL_CHANNELS as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Normalize
// ---------------------------------------------------------------------------

/**
 * Normalize any channel string (canonical, legacy alias, or DB column name)
 * to its canonical form. Throws for unknown inputs.
 */
export function normalizeChannel(input: string): Channel {
  const lower = input.toLowerCase().trim();
  if (isCanonicalChannel(lower)) return lower;
  const alias = LEGACY_ALIAS[lower];
  if (alias && isCanonicalChannel(alias)) return alias;
  throw new Error(`Unknown channel: "${input}"`);
}

/**
 * Safe version of `normalizeChannel` that returns a discriminated result
 * instead of throwing.
 */
export function normalizeChannelSafe(
  input: string,
): { ok: true; value: Channel } | { ok: false; error: string } {
  try {
    return { ok: true, value: normalizeChannel(input) };
  } catch {
    return { ok: false, error: `Unknown channel: "${input}"` };
  }
}

// ---------------------------------------------------------------------------
// DB mapping
// ---------------------------------------------------------------------------

/** Convert a canonical channel name to its DB column name. */
export function channelToDb(channel: Channel): string {
  return DB_MAPPING[channel] ?? channel;
}

/** Convert a DB column name back to its canonical channel name. */
export function dbToChannel(dbValue: string): Channel {
  for (const [canonical, db] of Object.entries(DB_MAPPING)) {
    if (db === dbValue) return canonical as Channel;
  }
  if (isCanonicalChannel(dbValue)) return dbValue;
  throw new Error(`Unknown DB channel value: "${dbValue}"`);
}

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

/** Return a copy of all 16 canonical channel names. */
export function getAllChannels(): Channel[] {
  return [...CANONICAL_CHANNELS] as Channel[];
}

/** Return a copy of all legacy alias mappings. */
export function getLegacyAliases(): Record<string, Channel> {
  return { ...LEGACY_ALIAS } as Record<string, Channel>;
}
