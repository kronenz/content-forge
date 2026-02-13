/**
 * Medium publisher
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

interface MediumPost {
  title: string;
  contentFormat: 'markdown' | 'html';
  content: string;
  tags?: string[];
  publishStatus: 'public' | 'draft' | 'unlisted';
}

interface MediumApiResponse {
  data: {
    id: string;
    title: string;
    authorId: string;
    url: string;
    publishStatus: string;
    publishedAt: number;
  };
}

export class MediumPublisher extends BasePublisher {
  constructor(config: PublisherConfig, logger?: Logger) {
    super({ ...config, channel: 'medium' }, logger);
  }

  async publish(content: ChannelContent): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('publish_start', {
      publisher: 'medium',
      title: content.title
    });

    // Validate content
    const validationResult = this.validateContent(content);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Publish with retry
    return this.withRetry(() => this.publishToMedium(content));
  }

  /**
   * Validate Medium content requirements
   */
  private validateContent(content: ChannelContent): Result<void, PublishError> {
    const charCount = content.body.length;

    if (charCount < 2000) {
      return Err({
        publisher: 'medium',
        message: `Content too short: ${charCount} chars (minimum 2000)`,
        retryable: false
      });
    }

    if (charCount > 4000) {
      return Err({
        publisher: 'medium',
        message: `Content too long: ${charCount} chars (maximum 4000)`,
        retryable: false
      });
    }

    return Ok(undefined);
  }

  /**
   * Publish to Medium API
   */
  private async publishToMedium(
    content: ChannelContent
  ): Promise<Result<PublishResult, PublishError>> {
    try {
      if (!this.config.apiKey) {
        return Err({
          publisher: 'medium',
          message: 'API key not configured',
          retryable: false
        });
      }

      const post: MediumPost = {
        title: content.title,
        contentFormat: 'markdown',
        content: content.body,
        tags: (content.metadata.tags as string[] | undefined) ?? [],
        publishStatus: 'public'
      };

      const response = await fetch('https://api.medium.com/v1/users/@me/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(post)
      });

      const statusCode = response.status;

      if (!response.ok) {
        const errorText = await response.text();
        return Err({
          publisher: 'medium',
          message: `Medium API error: ${errorText}`,
          statusCode,
          retryable: this.isRetryableStatus(statusCode)
        });
      }

      const data = await response.json() as MediumApiResponse;

      this.logger.info('publish_success', {
        publisher: 'medium',
        externalId: data.data.id,
        url: data.data.url
      });

      return Ok({
        channel: 'medium',
        externalUrl: data.data.url,
        externalId: data.data.id,
        publishedAt: new Date(data.data.publishedAt)
      });

    } catch (error) {
      this.logger.error('publish_error', {
        publisher: 'medium',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        publisher: 'medium',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
    }
  }
}
