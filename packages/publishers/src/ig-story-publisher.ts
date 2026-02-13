/**
 * Instagram story publisher
 */

import {
  Ok,
  Err,
  type Result,
  type ChannelContent,
  type PublishResult,
  type Logger
} from '@content-forge/core';
import { BasePublisher, type PublisherConfig, type PublishError } from './base-publisher.js';

export class IgStoryPublisher extends BasePublisher {
  constructor(config: PublisherConfig, logger?: Logger) {
    super({ ...config, channel: 'ig-story' }, logger);
  }

  async publish(content: ChannelContent): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('publish_start', {
      publisher: 'ig-story',
      title: content.title
    });

    // Validate content
    const validationResult = this.validateContent(content);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Publish with retry
    return this.withRetry(() => this.publishToInstagram(content));
  }

  /**
   * Validate Instagram story content requirements
   */
  private validateContent(content: ChannelContent): Result<void, PublishError> {
    // Parse frames from body (hook + frames separated by ---)
    const parts = content.body.split(/\n\n---\n\n/).map(p => p.trim());

    // First part is the hook, rest are frames
    const hook = parts[0];
    const frames = parts.slice(1);

    if (hook) {
      if (hook.length < 10) {
        return Err({
          publisher: 'ig-story',
          message: `Hook too short: ${hook.length} chars (minimum 10)`,
          retryable: false
        });
      }

      if (hook.length > 100) {
        return Err({
          publisher: 'ig-story',
          message: `Hook too long: ${hook.length} chars (maximum 100)`,
          retryable: false
        });
      }
    }

    // Validate frame count from metadata
    const frameCount = content.metadata.frameCount as number | undefined;
    if (frameCount !== undefined) {
      if (frameCount < 3) {
        return Err({
          publisher: 'ig-story',
          message: `Too few frames: ${frameCount} (minimum 3)`,
          retryable: false
        });
      }

      if (frameCount > 5) {
        return Err({
          publisher: 'ig-story',
          message: `Too many frames: ${frameCount} (maximum 5)`,
          retryable: false
        });
      }
    }

    // Validate each frame length
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      if (!frame) continue;

      if (frame.length < 10) {
        return Err({
          publisher: 'ig-story',
          message: `Frame ${i + 1} too short: ${frame.length} chars (minimum 10)`,
          retryable: false
        });
      }

      if (frame.length > 100) {
        return Err({
          publisher: 'ig-story',
          message: `Frame ${i + 1} too long: ${frame.length} chars (maximum 100)`,
          retryable: false
        });
      }
    }

    return Ok(undefined);
  }

  /**
   * Publish to Instagram Stories API (mocked for MVP)
   */
  private async publishToInstagram(
    content: ChannelContent
  ): Promise<Result<PublishResult, PublishError>> {
    try {
      // For MVP: mock the API call
      this.logger.info('mock_publish', {
        publisher: 'ig-story',
        title: content.title
      });

      // Simulate API delay
      await this.sleep(500);

      // Mock successful response
      const mockId = `ig-story-${Date.now()}`;
      const mockUser = 'contentforge';
      const mockUrl = `https://www.instagram.com/stories/${mockUser}/${mockId}`;

      this.logger.info('publish_success', {
        publisher: 'ig-story',
        externalId: mockId,
        url: mockUrl
      });

      return Ok({
        channel: 'ig-story',
        externalUrl: mockUrl,
        externalId: mockId,
        publishedAt: new Date()
      });

    } catch (error) {
      this.logger.error('publish_error', {
        publisher: 'ig-story',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        publisher: 'ig-story',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
    }
  }
}
