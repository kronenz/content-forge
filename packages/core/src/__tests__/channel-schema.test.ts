import { describe, it, expect } from 'vitest';
import {
  ChannelSchema,
  isCanonicalChannel,
  normalizeChannel,
  normalizeChannelSafe,
  channelToDb,
  dbToChannel,
  getAllChannels,
  getLegacyAliases,
} from '../channel-schema.js';

describe('Channel Schema', () => {
  // -------------------------------------------------------------------
  // isCanonicalChannel
  // -------------------------------------------------------------------
  describe('isCanonicalChannel', () => {
    const allChannels = [
      'medium', 'linkedin', 'x-thread', 'threads', 'brunch', 'newsletter',
      'blog', 'kakao', 'youtube', 'shorts', 'reels', 'tiktok',
      'ig-carousel', 'ig-single', 'ig-story', 'webtoon',
    ];

    it('should return true for all 16 canonical channels', () => {
      for (const ch of allChannels) {
        expect(isCanonicalChannel(ch)).toBe(true);
      }
    });

    it('should return false for legacy aliases', () => {
      expect(isCanonicalChannel('x')).toBe(false);
      expect(isCanonicalChannel('twitter')).toBe(false);
      expect(isCanonicalChannel('ig_carousel')).toBe(false);
    });

    it('should return false for unknown values', () => {
      expect(isCanonicalChannel('facebook')).toBe(false);
      expect(isCanonicalChannel('')).toBe(false);
      expect(isCanonicalChannel('MEDIUM')).toBe(false);
    });
  });

  // -------------------------------------------------------------------
  // normalizeChannel
  // -------------------------------------------------------------------
  describe('normalizeChannel', () => {
    it('should return canonical for exact match', () => {
      expect(normalizeChannel('medium')).toBe('medium');
      expect(normalizeChannel('linkedin')).toBe('linkedin');
      expect(normalizeChannel('ig-carousel')).toBe('ig-carousel');
    });

    it('should resolve "x" to "x-thread"', () => {
      expect(normalizeChannel('x')).toBe('x-thread');
    });

    it('should resolve "ig_carousel" to "ig-carousel"', () => {
      expect(normalizeChannel('ig_carousel')).toBe('ig-carousel');
    });

    it('should resolve "twitter" to "x-thread"', () => {
      expect(normalizeChannel('twitter')).toBe('x-thread');
    });

    it('should resolve "instagram-carousel" to "ig-carousel"', () => {
      expect(normalizeChannel('instagram-carousel')).toBe('ig-carousel');
    });

    it('should be case-insensitive', () => {
      expect(normalizeChannel('Medium')).toBe('medium');
      expect(normalizeChannel('X')).toBe('x-thread');
      expect(normalizeChannel('TWITTER')).toBe('x-thread');
    });

    it('should trim whitespace', () => {
      expect(normalizeChannel('  medium  ')).toBe('medium');
    });

    it('should throw for unknown channel', () => {
      expect(() => normalizeChannel('facebook')).toThrow('Unknown channel: "facebook"');
      expect(() => normalizeChannel('')).toThrow('Unknown channel: ""');
    });
  });

  // -------------------------------------------------------------------
  // normalizeChannelSafe
  // -------------------------------------------------------------------
  describe('normalizeChannelSafe', () => {
    it('should return ok for valid canonical channel', () => {
      const result = normalizeChannelSafe('medium');
      expect(result).toEqual({ ok: true, value: 'medium' });
    });

    it('should return ok for valid alias', () => {
      const result = normalizeChannelSafe('x');
      expect(result).toEqual({ ok: true, value: 'x-thread' });
    });

    it('should return error for invalid channel', () => {
      const result = normalizeChannelSafe('facebook');
      expect(result).toEqual({ ok: false, error: 'Unknown channel: "facebook"' });
    });
  });

  // -------------------------------------------------------------------
  // channelToDb
  // -------------------------------------------------------------------
  describe('channelToDb', () => {
    it('should map "x-thread" to "x_thread"', () => {
      expect(channelToDb('x-thread')).toBe('x_thread');
    });

    it('should map "ig-carousel" to "ig_carousel"', () => {
      expect(channelToDb('ig-carousel')).toBe('ig_carousel');
    });

    it('should map "ig-single" to "ig_single"', () => {
      expect(channelToDb('ig-single')).toBe('ig_single');
    });

    it('should map "ig-story" to "ig_story"', () => {
      expect(channelToDb('ig-story')).toBe('ig_story');
    });

    it('should return unchanged for channels without mapping', () => {
      expect(channelToDb('medium')).toBe('medium');
      expect(channelToDb('youtube')).toBe('youtube');
      expect(channelToDb('tiktok')).toBe('tiktok');
    });
  });

  // -------------------------------------------------------------------
  // dbToChannel
  // -------------------------------------------------------------------
  describe('dbToChannel', () => {
    it('should map "ig_carousel" to "ig-carousel"', () => {
      expect(dbToChannel('ig_carousel')).toBe('ig-carousel');
    });

    it('should map "x_thread" to "x-thread"', () => {
      expect(dbToChannel('x_thread')).toBe('x-thread');
    });

    it('should return canonical for unmapped DB values that are already canonical', () => {
      expect(dbToChannel('medium')).toBe('medium');
    });

    it('should throw for unknown DB values', () => {
      expect(() => dbToChannel('unknown_col')).toThrow('Unknown DB channel value: "unknown_col"');
    });
  });

  // -------------------------------------------------------------------
  // getAllChannels
  // -------------------------------------------------------------------
  describe('getAllChannels', () => {
    it('should return all 16 channels', () => {
      const channels = getAllChannels();
      expect(channels).toHaveLength(16);
    });

    it('should return a new array each time (not a reference)', () => {
      const a = getAllChannels();
      const b = getAllChannels();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  // -------------------------------------------------------------------
  // getLegacyAliases
  // -------------------------------------------------------------------
  describe('getLegacyAliases', () => {
    it('should return all legacy aliases', () => {
      const aliases = getLegacyAliases();
      expect(aliases['x']).toBe('x-thread');
      expect(aliases['twitter']).toBe('x-thread');
      expect(aliases['ig_carousel']).toBe('ig-carousel');
      expect(aliases['instagram-carousel']).toBe('ig-carousel');
      expect(aliases['ig_single']).toBe('ig-single');
      expect(aliases['ig_story']).toBe('ig-story');
      expect(aliases['instagram-single']).toBe('ig-single');
      expect(aliases['instagram-story']).toBe('ig-story');
      expect(Object.keys(aliases)).toHaveLength(8);
    });
  });

  // -------------------------------------------------------------------
  // ChannelSchema (Zod)
  // -------------------------------------------------------------------
  describe('ChannelSchema', () => {
    it('should validate all canonical channels', () => {
      const channels = [
        'medium', 'linkedin', 'x-thread', 'threads', 'brunch', 'newsletter',
        'blog', 'kakao', 'youtube', 'shorts', 'reels', 'tiktok',
        'ig-carousel', 'ig-single', 'ig-story', 'webtoon',
      ];
      for (const ch of channels) {
        expect(ChannelSchema.safeParse(ch).success).toBe(true);
      }
    });

    it('should reject invalid strings', () => {
      expect(ChannelSchema.safeParse('facebook').success).toBe(false);
      expect(ChannelSchema.safeParse('x').success).toBe(false);
      expect(ChannelSchema.safeParse('ig_carousel').success).toBe(false);
      expect(ChannelSchema.safeParse('').success).toBe(false);
    });
  });
});
