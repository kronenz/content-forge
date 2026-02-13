/**
 * Scheduled publishing with channel-optimal times
 *
 * Manages publication scheduling based on known platform-specific
 * optimal posting windows for maximum engagement.
 */

import {
  createLogger,
  Ok,
  Err,
  type Logger,
  type Result,
  type Channel,
} from '@content-forge/core';
import type { AnalyticsError } from './types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A recurring time slot for publishing on a given channel.
 */
export interface ScheduleSlot {
  channel: Channel;
  /** 0 = Sunday, 6 = Saturday */
  dayOfWeek: number;
  /** 0-23 */
  hour: number;
  /** 0-59 */
  minute: number;
}

/**
 * A scheduled publication entry.
 */
export interface ScheduledPublication {
  id: string;
  channel: Channel;
  contentId: string;
  scheduledAt: Date;
  status: 'pending' | 'published' | 'failed' | 'cancelled';
  createdAt: Date;
}

/**
 * Configuration for the PublishScheduler.
 */
export interface PublishSchedulerConfig {
  /** IANA timezone string (e.g. 'Asia/Seoul') */
  timezone: string;
  /** Override default slots per channel */
  defaultSlots?: ScheduleSlot[];
}

// ---------------------------------------------------------------------------
// Default optimal slots per channel
// ---------------------------------------------------------------------------

const DEFAULT_OPTIMAL_SLOTS: ScheduleSlot[] = [
  // LinkedIn: Tue/Wed 9am KST
  { channel: 'linkedin', dayOfWeek: 2, hour: 9, minute: 0 },
  { channel: 'linkedin', dayOfWeek: 3, hour: 9, minute: 0 },

  // Medium: weekday mornings
  { channel: 'medium', dayOfWeek: 1, hour: 8, minute: 0 },
  { channel: 'medium', dayOfWeek: 2, hour: 8, minute: 0 },
  { channel: 'medium', dayOfWeek: 3, hour: 8, minute: 0 },
  { channel: 'medium', dayOfWeek: 4, hour: 8, minute: 0 },

  // X-thread: weekday lunch / evening
  { channel: 'x-thread', dayOfWeek: 1, hour: 12, minute: 0 },
  { channel: 'x-thread', dayOfWeek: 3, hour: 18, minute: 0 },
  { channel: 'x-thread', dayOfWeek: 5, hour: 12, minute: 0 },

  // Blog: Tue/Thu morning
  { channel: 'blog', dayOfWeek: 2, hour: 10, minute: 0 },
  { channel: 'blog', dayOfWeek: 4, hour: 10, minute: 0 },

  // Newsletter: weekday morning
  { channel: 'newsletter', dayOfWeek: 2, hour: 7, minute: 30 },
  { channel: 'newsletter', dayOfWeek: 4, hour: 7, minute: 30 },

  // Brunch: weekend morning
  { channel: 'brunch', dayOfWeek: 0, hour: 9, minute: 0 },
  { channel: 'brunch', dayOfWeek: 6, hour: 9, minute: 0 },

  // Threads: weekday evening
  { channel: 'threads', dayOfWeek: 1, hour: 19, minute: 0 },
  { channel: 'threads', dayOfWeek: 3, hour: 19, minute: 0 },
  { channel: 'threads', dayOfWeek: 5, hour: 19, minute: 0 },

  // Kakao: daily evening
  { channel: 'kakao', dayOfWeek: 1, hour: 20, minute: 0 },
  { channel: 'kakao', dayOfWeek: 3, hour: 20, minute: 0 },
  { channel: 'kakao', dayOfWeek: 5, hour: 20, minute: 0 },

  // YouTube: Sat morning
  { channel: 'youtube', dayOfWeek: 6, hour: 10, minute: 0 },
  { channel: 'youtube', dayOfWeek: 3, hour: 17, minute: 0 },

  // Shorts: daily evening
  { channel: 'shorts', dayOfWeek: 1, hour: 18, minute: 0 },
  { channel: 'shorts', dayOfWeek: 3, hour: 18, minute: 0 },
  { channel: 'shorts', dayOfWeek: 5, hour: 18, minute: 0 },

  // Reels: daily evening
  { channel: 'reels', dayOfWeek: 2, hour: 19, minute: 0 },
  { channel: 'reels', dayOfWeek: 4, hour: 19, minute: 0 },
  { channel: 'reels', dayOfWeek: 6, hour: 19, minute: 0 },

  // TikTok: daily evening/night
  { channel: 'tiktok', dayOfWeek: 1, hour: 21, minute: 0 },
  { channel: 'tiktok', dayOfWeek: 3, hour: 21, minute: 0 },
  { channel: 'tiktok', dayOfWeek: 5, hour: 21, minute: 0 },

  // IG carousel: Tue/Thu
  { channel: 'ig-carousel', dayOfWeek: 2, hour: 11, minute: 0 },
  { channel: 'ig-carousel', dayOfWeek: 4, hour: 11, minute: 0 },

  // IG single: Mon/Wed/Fri
  { channel: 'ig-single', dayOfWeek: 1, hour: 12, minute: 0 },
  { channel: 'ig-single', dayOfWeek: 3, hour: 12, minute: 0 },
  { channel: 'ig-single', dayOfWeek: 5, hour: 12, minute: 0 },

  // IG story: daily
  { channel: 'ig-story', dayOfWeek: 1, hour: 8, minute: 0 },
  { channel: 'ig-story', dayOfWeek: 3, hour: 8, minute: 0 },
  { channel: 'ig-story', dayOfWeek: 5, hour: 8, minute: 0 },

  // Webtoon: weekend
  { channel: 'webtoon', dayOfWeek: 6, hour: 11, minute: 0 },
  { channel: 'webtoon', dayOfWeek: 0, hour: 11, minute: 0 },
];

// ---------------------------------------------------------------------------
// PublishScheduler
// ---------------------------------------------------------------------------

let idCounter = 0;

function generateScheduleId(): string {
  idCounter++;
  return `sched-${Date.now()}-${idCounter}`;
}

export class PublishScheduler {
  private readonly logger: Logger;
  private readonly schedules: Map<string, ScheduledPublication> = new Map();
  private readonly slots: ScheduleSlot[];

  constructor(config: PublishSchedulerConfig) {
    this.logger = createLogger({ agentId: 'analytics:publish-scheduler' });
    this.slots = config.defaultSlots ?? DEFAULT_OPTIMAL_SLOTS;
  }

  /**
   * Return the optimal time slots for a given channel.
   */
  getOptimalSlots(channel: Channel): ScheduleSlot[] {
    return this.slots.filter((s) => s.channel === channel);
  }

  /**
   * Schedule a publication for the given channel and content.
   * If no preferredTime is given, the next optimal slot is used.
   */
  schedulePublication(
    channel: Channel,
    contentId: string,
    preferredTime?: Date,
  ): Result<ScheduledPublication, AnalyticsError> {
    try {
      const scheduledAt = preferredTime ?? this.getNextOptimalTime(channel);

      if (!scheduledAt) {
        return Err({
          source: 'PublishScheduler',
          message: `No optimal slots configured for channel: ${channel}`,
        });
      }

      if (scheduledAt <= new Date()) {
        return Err({
          source: 'PublishScheduler',
          message: 'Scheduled time must be in the future',
        });
      }

      const publication: ScheduledPublication = {
        id: generateScheduleId(),
        channel,
        contentId,
        scheduledAt,
        status: 'pending',
        createdAt: new Date(),
      };

      this.schedules.set(publication.id, publication);

      this.logger.info('schedule_publication', {
        id: publication.id,
        channel,
        contentId,
        scheduledAt: scheduledAt.toISOString(),
      });

      return Ok(publication);
    } catch (cause: unknown) {
      return Err({
        source: 'PublishScheduler',
        message: 'Failed to schedule publication',
        cause,
      });
    }
  }

  /**
   * Get upcoming scheduled publications sorted by scheduledAt ascending.
   */
  getUpcoming(limit?: number): ScheduledPublication[] {
    const now = new Date();
    const upcoming = [...this.schedules.values()]
      .filter((s) => s.status === 'pending' && s.scheduledAt > now)
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

    return limit !== undefined ? upcoming.slice(0, limit) : upcoming;
  }

  /**
   * Cancel a scheduled publication by its ID.
   */
  cancelScheduled(scheduleId: string): Result<void, AnalyticsError> {
    const publication = this.schedules.get(scheduleId);

    if (!publication) {
      return Err({
        source: 'PublishScheduler',
        message: `Scheduled publication not found: ${scheduleId}`,
      });
    }

    if (publication.status !== 'pending') {
      return Err({
        source: 'PublishScheduler',
        message: `Cannot cancel publication with status: ${publication.status}`,
      });
    }

    publication.status = 'cancelled';

    this.logger.info('cancel_scheduled', {
      id: scheduleId,
      channel: publication.channel,
      contentId: publication.contentId,
    });

    return Ok(undefined);
  }

  /**
   * Get the next optimal time for a given channel (future only).
   */
  private getNextOptimalTime(channel: Channel): Date | null {
    const channelSlots = this.getOptimalSlots(channel);

    if (channelSlots.length === 0) {
      return null;
    }

    const now = new Date();
    const candidates: Date[] = [];

    for (const slot of channelSlots) {
      // Try this week and next week
      for (let weekOffset = 0; weekOffset <= 1; weekOffset++) {
        const candidate = new Date(now);
        const currentDay = candidate.getDay();
        const daysUntil = (slot.dayOfWeek - currentDay + 7) % 7 + weekOffset * 7;

        candidate.setDate(candidate.getDate() + daysUntil);
        candidate.setHours(slot.hour, slot.minute, 0, 0);

        if (candidate > now) {
          candidates.push(candidate);
        }
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    // Return the soonest future candidate
    candidates.sort((a, b) => a.getTime() - b.getTime());
    return candidates[0] ?? null;
  }
}
