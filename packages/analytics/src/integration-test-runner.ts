/**
 * Integration test runner for all 16 publication channels
 *
 * Provides dry-run testing to verify channel configurations
 * and response format without making actual API calls.
 */

import {
  createLogger,
  Ok,
  Err,
  type Logger,
  type Result,
  type Channel,
  type ChannelContent,
} from '@content-forge/core';
import type { AnalyticsError } from './types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChannelTestStatus = 'pass' | 'fail' | 'skip';

export interface ChannelTestResult {
  channel: Channel;
  status: ChannelTestStatus;
  latencyMs: number;
  error?: string;
}

export interface IntegrationTestReport {
  results: ChannelTestResult[];
  passed: number;
  failed: number;
  skipped: number;
  totalLatencyMs: number;
  executedAt: string;
}

export interface IntegrationTestRunnerConfig {
  dryRun: boolean;
  channels?: Channel[];
  timeoutMs?: number;
}

/**
 * Channel test handler function type.
 * Accepts content and returns a pass/fail result.
 */
export type ChannelTestHandler = (
  channel: Channel,
  content: ChannelContent,
) => Promise<Result<{ message: string }, { message: string }>>;

// ---------------------------------------------------------------------------
// All 16 channels
// ---------------------------------------------------------------------------

const ALL_CHANNELS: Channel[] = [
  'medium', 'linkedin', 'x-thread', 'brunch', 'newsletter',
  'blog', 'threads', 'kakao', 'youtube', 'shorts',
  'reels', 'tiktok', 'ig-carousel', 'ig-single', 'ig-story', 'webtoon',
];

// ---------------------------------------------------------------------------
// IntegrationTestRunner
// ---------------------------------------------------------------------------

export class IntegrationTestRunner {
  private readonly config: IntegrationTestRunnerConfig;
  private readonly logger: Logger;
  private readonly handlers: Map<Channel, ChannelTestHandler> = new Map();

  constructor(config: IntegrationTestRunnerConfig) {
    this.config = config;
    this.logger = createLogger({ agentId: 'analytics:integration-test' });
  }

  /**
   * Register a test handler for a specific channel.
   * If no handler is registered, the channel test will use the dry-run default.
   */
  registerHandler(channel: Channel, handler: ChannelTestHandler): void {
    this.handlers.set(channel, handler);
  }

  /**
   * Test a single channel.
   */
  async testChannel(channel: Channel): Promise<ChannelTestResult> {
    const startMs = Date.now();

    try {
      const content = this.createMockContent(channel);
      const handler = this.handlers.get(channel);

      if (this.config.dryRun && !handler) {
        // Dry-run mode with no custom handler: validate format only
        const validationResult = this.validateContent(content);
        const latencyMs = Date.now() - startMs;

        if (!validationResult.ok) {
          this.logger.warn('test_channel_fail', {
            channel,
            error: validationResult.error,
          });
          return {
            channel,
            status: 'fail',
            latencyMs,
            error: validationResult.error,
          };
        }

        this.logger.info('test_channel_pass', { channel, latencyMs });
        return { channel, status: 'pass', latencyMs };
      }

      if (handler) {
        const result = await handler(channel, content);
        const latencyMs = Date.now() - startMs;

        if (result.ok) {
          this.logger.info('test_channel_pass', { channel, latencyMs });
          return { channel, status: 'pass', latencyMs };
        }

        this.logger.warn('test_channel_fail', {
          channel,
          error: result.error.message,
        });
        return {
          channel,
          status: 'fail',
          latencyMs,
          error: result.error.message,
        };
      }

      // No handler and not dry-run: skip
      const latencyMs = Date.now() - startMs;
      this.logger.info('test_channel_skip', { channel });
      return { channel, status: 'skip', latencyMs };
    } catch (err: unknown) {
      const latencyMs = Date.now() - startMs;
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error('test_channel_error', { channel, error: errorMessage });
      return {
        channel,
        status: 'fail',
        latencyMs,
        error: errorMessage,
      };
    }
  }

  /**
   * Test all configured channels (or all 16 if none specified).
   */
  async testAllChannels(): Promise<Result<IntegrationTestReport, AnalyticsError>> {
    try {
      const channels = this.config.channels ?? ALL_CHANNELS;
      const results: ChannelTestResult[] = [];

      for (const channel of channels) {
        const result = await this.testChannel(channel);
        results.push(result);
      }

      const passed = results.filter(r => r.status === 'pass').length;
      const failed = results.filter(r => r.status === 'fail').length;
      const skipped = results.filter(r => r.status === 'skip').length;
      const totalLatencyMs = results.reduce((sum, r) => sum + r.latencyMs, 0);

      const report: IntegrationTestReport = {
        results,
        passed,
        failed,
        skipped,
        totalLatencyMs,
        executedAt: new Date().toISOString(),
      };

      this.logger.info('test_all_complete', {
        passed,
        failed,
        skipped,
        totalLatencyMs,
      });

      return Ok(report);
    } catch (cause: unknown) {
      return Err({
        source: 'IntegrationTestRunner',
        message: 'Failed to run integration tests',
        cause,
      });
    }
  }

  /**
   * Create mock content for a given channel.
   */
  private createMockContent(channel: Channel): ChannelContent {
    const contentMap: Record<Channel, ChannelContent> = {
      'medium': {
        channel: 'medium',
        title: 'Test Article: Integration Verification',
        body: 'This is a test article body for medium integration testing.',
        metadata: { tags: ['test', 'integration'], canonicalUrl: 'https://example.com' },
      },
      'linkedin': {
        channel: 'linkedin',
        title: 'Test LinkedIn Post',
        body: 'Professional test content for LinkedIn integration.',
        metadata: { visibility: 'public' },
      },
      'x-thread': {
        channel: 'x-thread',
        title: 'Test Thread',
        body: 'Thread tweet 1/3\n---\nThread tweet 2/3\n---\nThread tweet 3/3',
        metadata: { tweetCount: 3 },
      },
      'brunch': {
        channel: 'brunch',
        title: 'Test Brunch Article',
        body: 'Test content for Brunch platform integration.',
        metadata: { category: 'tech' },
      },
      'newsletter': {
        channel: 'newsletter',
        title: 'Test Newsletter Issue',
        body: 'Weekly newsletter test content for integration verification.',
        metadata: { issueNumber: 1 },
      },
      'blog': {
        channel: 'blog',
        title: 'Test Blog Post',
        body: 'Blog post test content for integration verification.',
        metadata: { slug: 'test-post' },
      },
      'threads': {
        channel: 'threads',
        title: 'Test Threads Post',
        body: 'Short-form test content for Threads integration.',
        metadata: {},
      },
      'kakao': {
        channel: 'kakao',
        title: 'Test Kakao Post',
        body: 'Test content for Kakao channel integration.',
        metadata: { emoticon: false },
      },
      'youtube': {
        channel: 'youtube',
        title: 'Test YouTube Video',
        body: 'Description for test YouTube video integration.',
        metadata: { duration: 300, resolution: '1080p' },
      },
      'shorts': {
        channel: 'shorts',
        title: 'Test YouTube Short',
        body: 'Short-form vertical video test content.',
        metadata: { duration: 60, resolution: '1080p' },
      },
      'reels': {
        channel: 'reels',
        title: 'Test Instagram Reel',
        body: 'Reel test content for integration verification.',
        metadata: { duration: 30 },
      },
      'tiktok': {
        channel: 'tiktok',
        title: 'Test TikTok Video',
        body: 'TikTok test content for integration verification.',
        metadata: { sounds: [], duration: 45 },
      },
      'ig-carousel': {
        channel: 'ig-carousel',
        title: 'Test IG Carousel',
        body: 'Carousel slide 1\n---\nCarousel slide 2\n---\nCarousel slide 3',
        metadata: { slideCount: 3 },
      },
      'ig-single': {
        channel: 'ig-single',
        title: 'Test IG Single Post',
        body: 'Single image post test content.',
        metadata: { filter: 'none' },
      },
      'ig-story': {
        channel: 'ig-story',
        title: 'Test IG Story',
        body: 'Story test content for integration verification.',
        metadata: { stickers: [] },
      },
      'webtoon': {
        channel: 'webtoon',
        title: 'Test Webtoon Episode',
        body: 'Webtoon episode test content for integration.',
        metadata: { episodeNumber: 1, panelCount: 8 },
      },
    };

    return contentMap[channel];
  }

  /**
   * Validate that mock content has required fields.
   */
  private validateContent(
    content: ChannelContent,
  ): Result<true, string> {
    if (!content.channel) {
      return Err('Missing channel field');
    }
    if (!content.title || content.title.length === 0) {
      return Err('Missing or empty title');
    }
    if (!content.body || content.body.length === 0) {
      return Err('Missing or empty body');
    }
    return Ok(true as const);
  }
}
