/**
 * Newsletter publisher (Buttondown API)
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

export class NewsletterPublisher extends BasePublisher {
  constructor(config: PublisherConfig, logger?: Logger) {
    super({ ...config, channel: 'newsletter' }, logger);
  }

  async publish(content: ChannelContent): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('publish_start', {
      publisher: 'newsletter',
      title: content.title
    });

    // Validate content
    const validationResult = this.validateContent(content);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Publish with retry
    return this.withRetry(() => this.publishToNewsletter(content));
  }

  /**
   * Validate newsletter content requirements
   */
  private validateContent(content: ChannelContent): Result<void, PublishError> {
    const charCount = content.body.length;

    if (charCount < 1000) {
      return Err({
        publisher: 'newsletter',
        message: `Content too short: ${charCount} chars (minimum 1000)`,
        retryable: false
      });
    }

    if (charCount > 20000) {
      return Err({
        publisher: 'newsletter',
        message: `Content too long: ${charCount} chars (maximum 20000)`,
        retryable: false
      });
    }

    return Ok(undefined);
  }

  /**
   * Publish to Buttondown API (mocked for MVP)
   */
  private async publishToNewsletter(
    content: ChannelContent
  ): Promise<Result<PublishResult, PublishError>> {
    try {
      // For MVP: mock the Buttondown API call
      this.logger.info('mock_publish', {
        publisher: 'newsletter',
        title: content.title,
        charCount: content.body.length
      });

      // Simulate API delay
      await this.sleep(500);

      // Mock successful response
      const mockId = `newsletter-${Date.now()}`;
      const mockUrl = `https://buttondown.com/archive/${mockId}`;

      this.logger.info('publish_success', {
        publisher: 'newsletter',
        externalId: mockId,
        url: mockUrl
      });

      return Ok({
        channel: 'newsletter',
        externalUrl: mockUrl,
        externalId: mockId,
        publishedAt: new Date()
      });

    } catch (error) {
      this.logger.error('publish_error', {
        publisher: 'newsletter',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        publisher: 'newsletter',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
    }
  }
}
