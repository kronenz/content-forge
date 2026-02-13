/**
 * Infographic publisher - uploads infographic images to platform
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

/**
 * Infographic-specific configuration
 */
export interface InfographicPublishConfig {
  platformUrl: string;
}

/**
 * Infographic content metadata
 */
export interface InfographicMetadata {
  dimensions: { width: number; height: number };
  format: 'png' | 'jpg' | 'webp';
  altText: string;
}

export class InfographicPublisher extends BasePublisher {
  private infographicConfig: InfographicPublishConfig;

  constructor(config: PublisherConfig, infographicConfig: InfographicPublishConfig, logger?: Logger) {
    super({ ...config, channel: 'ig-single' }, logger);
    this.infographicConfig = infographicConfig;
  }

  async publish(content: ChannelContent): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('publish_start', {
      publisher: 'infographic',
      title: content.title
    });

    // Validate content
    const validationResult = this.validateContent(content);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Publish with retry
    return this.withRetry(() => this.uploadInfographic(content));
  }

  /**
   * Validate infographic content requirements
   */
  private validateContent(content: ChannelContent): Result<void, PublishError> {
    if (!content.body || content.body.length === 0) {
      return Err({
        publisher: 'infographic',
        message: 'Content body is empty',
        retryable: false
      });
    }

    if (!content.title || content.title.length === 0) {
      return Err({
        publisher: 'infographic',
        message: 'Content title is required',
        retryable: false
      });
    }

    const dimensions = content.metadata.dimensions as { width: number; height: number } | undefined;
    if (dimensions) {
      if (dimensions.width <= 0 || dimensions.height <= 0) {
        return Err({
          publisher: 'infographic',
          message: `Invalid dimensions: ${dimensions.width}x${dimensions.height}`,
          retryable: false
        });
      }
    }

    const format = content.metadata.format as string | undefined;
    const validFormats = ['png', 'jpg', 'webp'];
    if (format && !validFormats.includes(format)) {
      return Err({
        publisher: 'infographic',
        message: `Unsupported image format: ${format} (supported: ${validFormats.join(', ')})`,
        retryable: false
      });
    }

    return Ok(undefined);
  }

  /**
   * Upload infographic image to platform (mocked for MVP)
   */
  private async uploadInfographic(
    content: ChannelContent
  ): Promise<Result<PublishResult, PublishError>> {
    try {
      const dimensions = (content.metadata.dimensions as { width: number; height: number } | undefined) ?? { width: 1080, height: 1080 };
      const format = (content.metadata.format as string | undefined) ?? 'png';
      const altText = (content.metadata.altText as string | undefined) ?? content.title;

      this.logger.info('mock_upload', {
        publisher: 'infographic',
        title: content.title,
        dimensions,
        format,
        altText
      });

      // Simulate API delay
      await this.sleep(500);

      // Mock successful response
      const mockId = `infographic-${Date.now()}`;
      const slug = content.title.toLowerCase().replace(/\s+/g, '-');
      const mockUrl = `${this.infographicConfig.platformUrl}/infographic/${slug}`;

      this.logger.info('publish_success', {
        publisher: 'infographic',
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
        publisher: 'infographic',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        publisher: 'infographic',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
    }
  }
}
