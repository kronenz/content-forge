/**
 * Blog publisher
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

export class BlogPublisher extends BasePublisher {
  constructor(config: PublisherConfig, logger?: Logger) {
    super({ ...config, channel: 'blog' }, logger);
  }

  async publish(content: ChannelContent): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('publish_start', {
      publisher: 'blog',
      title: content.title
    });

    // Validate content
    const validationResult = this.validateContent(content);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Publish with retry
    return this.withRetry(() => this.publishToBlog(content));
  }

  /**
   * Validate blog content requirements
   */
  private validateContent(content: ChannelContent): Result<void, PublishError> {
    const charCount = content.body.length;

    if (charCount < 1500) {
      return Err({
        publisher: 'blog',
        message: `Content too short: ${charCount} chars (minimum 1500)`,
        retryable: false
      });
    }

    if (charCount > 15000) {
      return Err({
        publisher: 'blog',
        message: `Content too long: ${charCount} chars (maximum 15000)`,
        retryable: false
      });
    }

    return Ok(undefined);
  }

  /**
   * Publish to blog API (mocked for MVP)
   */
  private async publishToBlog(
    content: ChannelContent
  ): Promise<Result<PublishResult, PublishError>> {
    try {
      // For MVP: mock the API call
      this.logger.info('mock_publish', {
        publisher: 'blog',
        title: content.title,
        charCount: content.body.length
      });

      // Simulate API delay
      await this.sleep(500);

      // Mock successful response
      const mockId = `blog-${Date.now()}`;
      const mockUrl = `https://blog.example.com/posts/${mockId}`;

      this.logger.info('publish_success', {
        publisher: 'blog',
        externalId: mockId,
        url: mockUrl
      });

      return Ok({
        channel: 'blog',
        externalUrl: mockUrl,
        externalId: mockId,
        publishedAt: new Date()
      });

    } catch (error) {
      this.logger.error('publish_error', {
        publisher: 'blog',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        publisher: 'blog',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
    }
  }
}
