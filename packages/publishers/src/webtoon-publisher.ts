/**
 * Webtoon strip publisher - publishes webtoon strips to platform API
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
 * Webtoon-specific configuration
 */
export interface WebtoonPublishConfig {
  platformUrl: string;
  seriesId?: string;
  seriesTitle?: string;
}

/**
 * Episode metadata for webtoon publishing
 */
export interface WebtoonEpisodeMetadata {
  episodeNumber: number;
  seriesTitle: string;
  format: 'vertical-scroll';
  panelCount: number;
}

export class WebtoonPublisher extends BasePublisher {
  private webtoonConfig: WebtoonPublishConfig;

  constructor(config: PublisherConfig, webtoonConfig: WebtoonPublishConfig, logger?: Logger) {
    super({ ...config, channel: 'webtoon' }, logger);
    this.webtoonConfig = webtoonConfig;
  }

  async publish(content: ChannelContent): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('publish_start', {
      publisher: 'webtoon',
      title: content.title
    });

    // Validate content
    const validationResult = this.validateContent(content);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Publish with retry
    return this.withRetry(() => this.publishToWebtoonPlatform(content));
  }

  /**
   * Validate webtoon content requirements
   */
  private validateContent(content: ChannelContent): Result<void, PublishError> {
    if (!content.body || content.body.length === 0) {
      return Err({
        publisher: 'webtoon',
        message: 'Content body is empty',
        retryable: false
      });
    }

    if (!content.title || content.title.length === 0) {
      return Err({
        publisher: 'webtoon',
        message: 'Content title is required',
        retryable: false
      });
    }

    const panelCount = content.metadata.panelCount as number | undefined;
    if (panelCount !== undefined && (panelCount < 4 || panelCount > 8)) {
      return Err({
        publisher: 'webtoon',
        message: `Invalid panel count: ${panelCount} (must be 4-8)`,
        retryable: false
      });
    }

    const format = content.metadata.format as string | undefined;
    if (format && format !== 'vertical-scroll') {
      return Err({
        publisher: 'webtoon',
        message: `Unsupported format: ${format} (only vertical-scroll is supported)`,
        retryable: false
      });
    }

    return Ok(undefined);
  }

  /**
   * Publish strip data to webtoon platform API (mocked for MVP)
   */
  private async publishToWebtoonPlatform(
    content: ChannelContent
  ): Promise<Result<PublishResult, PublishError>> {
    try {
      const episodeNumber = (content.metadata.episodeNumber as number | undefined) ?? 1;
      const seriesTitle = this.webtoonConfig.seriesTitle ?? content.title;
      const panelCount = (content.metadata.panelCount as number | undefined) ?? 0;

      const episodeMetadata: WebtoonEpisodeMetadata = {
        episodeNumber,
        seriesTitle,
        format: 'vertical-scroll',
        panelCount
      };

      this.logger.info('mock_publish', {
        publisher: 'webtoon',
        title: content.title,
        platformUrl: this.webtoonConfig.platformUrl,
        episode: episodeMetadata
      });

      // Simulate API delay
      await this.sleep(500);

      // Mock successful response
      const seriesSlug = seriesTitle.toLowerCase().replace(/\s+/g, '-');
      const mockId = `webtoon-${Date.now()}`;
      const mockUrl = `${this.webtoonConfig.platformUrl}/series/${seriesSlug}/episode/${episodeNumber}`;

      this.logger.info('publish_success', {
        publisher: 'webtoon',
        externalId: mockId,
        url: mockUrl
      });

      return Ok({
        channel: 'webtoon',
        externalUrl: mockUrl,
        externalId: mockId,
        publishedAt: new Date()
      });

    } catch (error) {
      this.logger.error('publish_error', {
        publisher: 'webtoon',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        publisher: 'webtoon',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
    }
  }
}
