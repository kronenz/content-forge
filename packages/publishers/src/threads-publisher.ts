/**
 * Threads publisher
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

export class ThreadsPublisher extends BasePublisher {
  constructor(config: PublisherConfig, logger?: Logger) {
    super({ ...config, channel: 'threads' }, logger);
  }

  async publish(content: ChannelContent): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('publish_start', {
      publisher: 'threads',
      title: content.title
    });

    // Validate content
    const validationResult = this.validateContent(content);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Publish with retry
    return this.withRetry(() => this.publishToThreads(content));
  }

  /**
   * Validate Threads content requirements
   */
  private validateContent(content: ChannelContent): Result<void, PublishError> {
    const charCount = content.body.length;

    if (charCount < 100) {
      return Err({
        publisher: 'threads',
        message: `Content too short: ${charCount} chars (minimum 100)`,
        retryable: false
      });
    }

    if (charCount > 500) {
      return Err({
        publisher: 'threads',
        message: `Content too long: ${charCount} chars (maximum 500)`,
        retryable: false
      });
    }

    return Ok(undefined);
  }

  /**
   * Publish to Threads API (mocked for MVP)
   */
  private async publishToThreads(
    content: ChannelContent
  ): Promise<Result<PublishResult, PublishError>> {
    try {
      // For MVP: mock the API call
      this.logger.info('mock_publish', {
        publisher: 'threads',
        title: content.title,
        charCount: content.body.length
      });

      // Simulate API delay
      await this.sleep(500);

      // Mock successful response
      const mockId = `threads-${Date.now()}`;
      const mockUrl = `https://www.threads.net/@user/post/${mockId}`;

      this.logger.info('publish_success', {
        publisher: 'threads',
        externalId: mockId,
        url: mockUrl
      });

      return Ok({
        channel: 'threads',
        externalUrl: mockUrl,
        externalId: mockId,
        publishedAt: new Date()
      });

    } catch (error) {
      this.logger.error('publish_error', {
        publisher: 'threads',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        publisher: 'threads',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
    }
  }
}
