/**
 * LinkedIn publisher
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

export class LinkedInPublisher extends BasePublisher {
  constructor(config: PublisherConfig, logger?: Logger) {
    super({ ...config, channel: 'linkedin' }, logger);
  }

  async publish(content: ChannelContent): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('publish_start', {
      publisher: 'linkedin',
      title: content.title
    });

    // Validate content
    const validationResult = this.validateContent(content);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Publish with retry
    return this.withRetry(() => this.publishToLinkedIn(content));
  }

  /**
   * Validate LinkedIn content requirements
   */
  private validateContent(content: ChannelContent): Result<void, PublishError> {
    const charCount = content.body.length;

    if (charCount < 300) {
      return Err({
        publisher: 'linkedin',
        message: `Content too short: ${charCount} chars (minimum 300)`,
        retryable: false
      });
    }

    if (charCount > 800) {
      return Err({
        publisher: 'linkedin',
        message: `Content too long: ${charCount} chars (maximum 800)`,
        retryable: false
      });
    }

    return Ok(undefined);
  }

  /**
   * Publish to LinkedIn API (mocked for MVP)
   */
  private async publishToLinkedIn(
    content: ChannelContent
  ): Promise<Result<PublishResult, PublishError>> {
    try {
      // For MVP: mock the API call
      this.logger.info('mock_publish', {
        publisher: 'linkedin',
        title: content.title,
        charCount: content.body.length
      });

      // Simulate API delay
      await this.sleep(500);

      // Mock successful response
      const mockId = `linkedin-${Date.now()}`;
      const mockUrl = `https://www.linkedin.com/feed/update/${mockId}`;

      this.logger.info('publish_success', {
        publisher: 'linkedin',
        externalId: mockId,
        url: mockUrl
      });

      return Ok({
        channel: 'linkedin',
        externalUrl: mockUrl,
        externalId: mockId,
        publishedAt: new Date()
      });

    } catch (error) {
      this.logger.error('publish_error', {
        publisher: 'linkedin',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        publisher: 'linkedin',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
    }
  }
}
