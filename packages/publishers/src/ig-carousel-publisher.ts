/**
 * Instagram carousel publisher
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

export class IgCarouselPublisher extends BasePublisher {
  constructor(config: PublisherConfig, logger?: Logger) {
    super({ ...config, channel: 'ig-carousel' }, logger);
  }

  async publish(content: ChannelContent): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('publish_start', {
      publisher: 'ig-carousel',
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
   * Validate Instagram carousel content requirements
   */
  private validateContent(content: ChannelContent): Result<void, PublishError> {
    const charCount = content.body.length;

    if (charCount < 300) {
      return Err({
        publisher: 'ig-carousel',
        message: `Content too short: ${charCount} chars (minimum 300)`,
        retryable: false
      });
    }

    if (charCount > 2200) {
      return Err({
        publisher: 'ig-carousel',
        message: `Content too long: ${charCount} chars (maximum 2200)`,
        retryable: false
      });
    }

    // Validate slide count from metadata
    const slideCount = content.metadata.slideCount as number | undefined;
    if (slideCount !== undefined) {
      if (slideCount < 1) {
        return Err({
          publisher: 'ig-carousel',
          message: `Too few slides: ${slideCount} (minimum 1)`,
          retryable: false
        });
      }

      if (slideCount > 10) {
        return Err({
          publisher: 'ig-carousel',
          message: `Too many slides: ${slideCount} (maximum 10)`,
          retryable: false
        });
      }
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
        publisher: 'ig-carousel',
        title: content.title,
        charCount: content.body.length
      });

      // Simulate API delay
      await this.sleep(500);

      // Mock successful response
      const mockId = `ig-carousel-${Date.now()}`;
      const mockUrl = `https://www.instagram.com/p/${mockId}`;

      this.logger.info('publish_success', {
        publisher: 'ig-carousel',
        externalId: mockId,
        url: mockUrl
      });

      return Ok({
        channel: 'ig-carousel',
        externalUrl: mockUrl,
        externalId: mockId,
        publishedAt: new Date()
      });

    } catch (error) {
      this.logger.error('publish_error', {
        publisher: 'ig-carousel',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        publisher: 'ig-carousel',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
    }
  }
}
