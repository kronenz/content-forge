/**
 * Brunch publisher
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

export class BrunchPublisher extends BasePublisher {
  constructor(config: PublisherConfig, logger?: Logger) {
    super({ ...config, channel: 'brunch' }, logger);
  }

  async publish(content: ChannelContent): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('publish_start', {
      publisher: 'brunch',
      title: content.title
    });

    // Validate content
    const validationResult = this.validateContent(content);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Publish with retry
    return this.withRetry(() => this.publishToBrunch(content));
  }

  /**
   * Validate Brunch content requirements
   */
  private validateContent(content: ChannelContent): Result<void, PublishError> {
    const charCount = content.body.length;

    if (charCount < 2000) {
      return Err({
        publisher: 'brunch',
        message: `Content too short: ${charCount} chars (minimum 2000)`,
        retryable: false
      });
    }

    if (charCount > 5000) {
      return Err({
        publisher: 'brunch',
        message: `Content too long: ${charCount} chars (maximum 5000)`,
        retryable: false
      });
    }

    return Ok(undefined);
  }

  /**
   * Publish to Brunch API (mocked for MVP)
   */
  private async publishToBrunch(
    content: ChannelContent
  ): Promise<Result<PublishResult, PublishError>> {
    try {
      // For MVP: mock the API call
      this.logger.info('mock_publish', {
        publisher: 'brunch',
        title: content.title,
        charCount: content.body.length
      });

      // Simulate API delay
      await this.sleep(500);

      // Mock successful response
      const mockId = `brunch-${Date.now()}`;
      const mockUrl = `https://brunch.co.kr/@user/${mockId}`;

      this.logger.info('publish_success', {
        publisher: 'brunch',
        externalId: mockId,
        url: mockUrl
      });

      return Ok({
        channel: 'brunch',
        externalUrl: mockUrl,
        externalId: mockId,
        publishedAt: new Date()
      });

    } catch (error) {
      this.logger.error('publish_error', {
        publisher: 'brunch',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        publisher: 'brunch',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
    }
  }
}
