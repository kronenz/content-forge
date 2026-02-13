/**
 * Kakao publisher
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

export class KakaoPublisher extends BasePublisher {
  constructor(config: PublisherConfig, logger?: Logger) {
    super({ ...config, channel: 'kakao' }, logger);
  }

  async publish(content: ChannelContent): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('publish_start', {
      publisher: 'kakao',
      title: content.title
    });

    // Validate content
    const validationResult = this.validateContent(content);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Publish with retry
    return this.withRetry(() => this.publishToKakao(content));
  }

  /**
   * Validate Kakao content requirements
   */
  private validateContent(content: ChannelContent): Result<void, PublishError> {
    const charCount = content.body.length;

    if (charCount < 200) {
      return Err({
        publisher: 'kakao',
        message: `Content too short: ${charCount} chars (minimum 200)`,
        retryable: false
      });
    }

    if (charCount > 2000) {
      return Err({
        publisher: 'kakao',
        message: `Content too long: ${charCount} chars (maximum 2000)`,
        retryable: false
      });
    }

    return Ok(undefined);
  }

  /**
   * Publish to Kakao API (mocked for MVP)
   */
  private async publishToKakao(
    content: ChannelContent
  ): Promise<Result<PublishResult, PublishError>> {
    try {
      // For MVP: mock the API call
      this.logger.info('mock_publish', {
        publisher: 'kakao',
        title: content.title,
        charCount: content.body.length
      });

      // Simulate API delay
      await this.sleep(500);

      // Mock successful response
      const mockId = `kakao-${Date.now()}`;
      const mockUrl = `https://pf.kakao.com/${mockId}`;

      this.logger.info('publish_success', {
        publisher: 'kakao',
        externalId: mockId,
        url: mockUrl
      });

      return Ok({
        channel: 'kakao',
        externalUrl: mockUrl,
        externalId: mockId,
        publishedAt: new Date()
      });

    } catch (error) {
      this.logger.error('publish_error', {
        publisher: 'kakao',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        publisher: 'kakao',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
    }
  }
}
