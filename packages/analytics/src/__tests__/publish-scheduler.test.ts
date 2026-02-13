import { describe, it, expect, beforeEach } from 'vitest';
import { PublishScheduler } from '../publish-scheduler.js';
import type { Channel } from '@content-forge/core';
import type { ScheduleSlot, PublishSchedulerConfig } from '../publish-scheduler.js';

function makeConfig(overrides: Partial<PublishSchedulerConfig> = {}): PublishSchedulerConfig {
  return {
    timezone: 'Asia/Seoul',
    ...overrides,
  };
}

function futureDate(hoursFromNow: number): Date {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
}

function pastDate(hoursAgo: number): Date {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
}

describe('PublishScheduler', () => {
  let scheduler: PublishScheduler;

  beforeEach(() => {
    scheduler = new PublishScheduler(makeConfig());
  });

  describe('getOptimalSlots', () => {
    it('should return default optimal slots for linkedin', () => {
      const slots = scheduler.getOptimalSlots('linkedin');
      expect(slots.length).toBeGreaterThan(0);
      expect(slots.every((s) => s.channel === 'linkedin')).toBe(true);
    });

    it('should return default optimal slots for medium', () => {
      const slots = scheduler.getOptimalSlots('medium');
      expect(slots.length).toBeGreaterThan(0);
      expect(slots.every((s) => s.channel === 'medium')).toBe(true);
    });

    it('should return slots for all 16 channels', () => {
      const channels: Channel[] = [
        'medium', 'linkedin', 'x-thread', 'brunch', 'newsletter',
        'blog', 'threads', 'kakao', 'youtube', 'shorts',
        'reels', 'tiktok', 'ig-carousel', 'ig-single', 'ig-story', 'webtoon',
      ];

      for (const channel of channels) {
        const slots = scheduler.getOptimalSlots(channel);
        expect(slots.length).toBeGreaterThan(0);
      }
    });

    it('should use custom slots when provided in config', () => {
      const customSlots: ScheduleSlot[] = [
        { channel: 'medium', dayOfWeek: 1, hour: 14, minute: 30 },
      ];
      const customScheduler = new PublishScheduler(makeConfig({ defaultSlots: customSlots }));

      const slots = customScheduler.getOptimalSlots('medium');
      expect(slots).toHaveLength(1);
      expect(slots[0]!.hour).toBe(14);
      expect(slots[0]!.minute).toBe(30);
    });

    it('should return empty array for channel without custom slots', () => {
      const customSlots: ScheduleSlot[] = [
        { channel: 'medium', dayOfWeek: 1, hour: 14, minute: 30 },
      ];
      const customScheduler = new PublishScheduler(makeConfig({ defaultSlots: customSlots }));

      const slots = customScheduler.getOptimalSlots('linkedin');
      expect(slots).toHaveLength(0);
    });

    it('should have valid dayOfWeek (0-6) and hour (0-23) in default slots', () => {
      const allSlots = scheduler.getOptimalSlots('medium')
        .concat(scheduler.getOptimalSlots('linkedin'))
        .concat(scheduler.getOptimalSlots('youtube'));

      for (const slot of allSlots) {
        expect(slot.dayOfWeek).toBeGreaterThanOrEqual(0);
        expect(slot.dayOfWeek).toBeLessThanOrEqual(6);
        expect(slot.hour).toBeGreaterThanOrEqual(0);
        expect(slot.hour).toBeLessThanOrEqual(23);
        expect(slot.minute).toBeGreaterThanOrEqual(0);
        expect(slot.minute).toBeLessThanOrEqual(59);
      }
    });
  });

  describe('schedulePublication', () => {
    it('should schedule a publication with preferred time', () => {
      const preferred = futureDate(24);
      const result = scheduler.schedulePublication('medium', 'content-1', preferred);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('medium');
        expect(result.value.contentId).toBe('content-1');
        expect(result.value.scheduledAt).toEqual(preferred);
        expect(result.value.status).toBe('pending');
        expect(result.value.id).toBeTruthy();
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
    });

    it('should schedule a publication without preferred time using optimal slot', () => {
      const result = scheduler.schedulePublication('medium', 'content-2');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('medium');
        expect(result.value.contentId).toBe('content-2');
        expect(result.value.scheduledAt).toBeInstanceOf(Date);
        expect(result.value.scheduledAt.getTime()).toBeGreaterThan(Date.now());
      }
    });

    it('should error when preferred time is in the past', () => {
      const past = pastDate(1);
      const result = scheduler.schedulePublication('medium', 'content-3', past);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.source).toBe('PublishScheduler');
        expect(result.error.message).toContain('future');
      }
    });

    it('should error when no optimal slots for channel with custom empty slots', () => {
      const emptyScheduler = new PublishScheduler(makeConfig({ defaultSlots: [] }));
      const result = emptyScheduler.schedulePublication('medium', 'content-4');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('No optimal slots');
      }
    });

    it('should assign unique IDs to each scheduled publication', () => {
      const time1 = futureDate(24);
      const time2 = futureDate(48);

      const result1 = scheduler.schedulePublication('medium', 'content-1', time1);
      const result2 = scheduler.schedulePublication('linkedin', 'content-2', time2);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.id).not.toBe(result2.value.id);
      }
    });
  });

  describe('getUpcoming', () => {
    it('should return upcoming pending publications sorted by time', () => {
      const time1 = futureDate(48);
      const time2 = futureDate(24);

      scheduler.schedulePublication('medium', 'content-1', time1);
      scheduler.schedulePublication('linkedin', 'content-2', time2);

      const upcoming = scheduler.getUpcoming();
      expect(upcoming).toHaveLength(2);
      // content-2 is sooner
      expect(upcoming[0]!.contentId).toBe('content-2');
      expect(upcoming[1]!.contentId).toBe('content-1');
    });

    it('should respect the limit parameter', () => {
      scheduler.schedulePublication('medium', 'c-1', futureDate(24));
      scheduler.schedulePublication('linkedin', 'c-2', futureDate(48));
      scheduler.schedulePublication('blog', 'c-3', futureDate(72));

      const upcoming = scheduler.getUpcoming(2);
      expect(upcoming).toHaveLength(2);
    });

    it('should return empty array when no publications', () => {
      const upcoming = scheduler.getUpcoming();
      expect(upcoming).toHaveLength(0);
    });

    it('should not include cancelled publications', () => {
      const result = scheduler.schedulePublication('medium', 'c-1', futureDate(24));
      expect(result.ok).toBe(true);
      if (result.ok) {
        scheduler.cancelScheduled(result.value.id);
      }

      const upcoming = scheduler.getUpcoming();
      expect(upcoming).toHaveLength(0);
    });
  });

  describe('cancelScheduled', () => {
    it('should cancel a pending publication', () => {
      const result = scheduler.schedulePublication('medium', 'c-1', futureDate(24));
      expect(result.ok).toBe(true);
      if (result.ok) {
        const cancelResult = scheduler.cancelScheduled(result.value.id);
        expect(cancelResult.ok).toBe(true);
      }
    });

    it('should error when publication not found', () => {
      const result = scheduler.cancelScheduled('nonexistent-id');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('should error when publication is already cancelled', () => {
      const schedResult = scheduler.schedulePublication('medium', 'c-1', futureDate(24));
      expect(schedResult.ok).toBe(true);
      if (schedResult.ok) {
        scheduler.cancelScheduled(schedResult.value.id);
        const secondCancel = scheduler.cancelScheduled(schedResult.value.id);
        expect(secondCancel.ok).toBe(false);
        if (!secondCancel.ok) {
          expect(secondCancel.error.message).toContain('cancelled');
        }
      }
    });
  });
});
