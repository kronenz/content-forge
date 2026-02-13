/**
 * Instagram single post publisher
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

export class IgSinglePublisher extends BasePublisher {
  constructor(config: PublisherConfig, logger?: Logger) {
    super({ ...config, channel: 'ig-single' }, logger);
  }

  async publish(content: ChannelContent): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('publish_start', {
      publisher: 'ig-single',
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
   * Validate Instagram single post content requirements
   */
  private validateContent(content: ChannelContent): Result<void, PublishError> {
    const charCount = content.body.length;

    if (charCount < 100) {
      return Err({
        publisher: 'ig-single',
        message: `Content too short: ${charCount} chars (minimum 100)`,
        retryable: false
      });
    }

    if (charCount > 2200) {
      return Err({
        publisher: 'ig-single',
        message: `Content too long: ${charCount} chars (maximum 2200)`,
        retryable: false
      });
    }

    return Ok(undefined);
  }

  /**
   * Publish to Instagram API (mocked for MVP)
   */
  private async publishToInstagram(
    content: ChannelContent
  ): Promise<Result<PublishResult, PublishError>> {
    try {
      // For MVP: mock the API call
      this.logger.info('mock_publish', {
        publisher: 'ig-single',
        title: content.title,
        charCount: content.body.length
      });

      // Simulate API delay
      await this.sleep(500);

      // Mock successful response
      const mockId = `ig-single-${Date.now()}`;
      const mockUrl = `https://www.instagram.com/p/${mockId}`;

      this.logger.info('publish_success', {
        publisher: 'ig-single',
        externalId: mockId,
        url: mockUrl
      });

      return Ok({
        channel: 'ig-single',
        externalUrl: mockUrl,
        externalId: mockId,
        publishedAt: new Date()
      });

    } catch (error) {
      this.logger.error('publish_error', {
        publisher: 'ig-single',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        publisher: 'ig-single',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
    }
  }
}
