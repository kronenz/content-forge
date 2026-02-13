/**
 * X (Twitter) thread publisher
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

export class XThreadPublisher extends BasePublisher {
  constructor(config: PublisherConfig, logger?: Logger) {
    super({ ...config, channel: 'x-thread' }, logger);
  }

  async publish(content: ChannelContent): Promise<Result<PublishResult, PublishError>> {
    this.logger.info('publish_start', {
      publisher: 'x-thread',
      title: content.title
    });

    // Validate thread format
    const validationResult = this.validateThread(content);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Publish with retry
    return this.withRetry(() => this.publishThread(content));
  }

  /**
   * Validate X thread requirements
   */
  private validateThread(content: ChannelContent): Result<void, PublishError> {
    // Parse tweets from body (separated by ---)
    const tweets = content.body.split(/\n\n---\n\n/).map(t => t.trim());

    if (tweets.length < 5) {
      return Err({
        publisher: 'x-thread',
        message: `Thread too short: ${tweets.length} tweets (minimum 5)`,
        retryable: false
      });
    }

    if (tweets.length > 15) {
      return Err({
        publisher: 'x-thread',
        message: `Thread too long: ${tweets.length} tweets (maximum 15)`,
        retryable: false
      });
    }

    // Validate each tweet length
    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];
      if (!tweet) {
        return Err({
          publisher: 'x-thread',
          message: `Empty tweet at position ${i + 1}`,
          retryable: false
        });
      }

      if (tweet.length > 280) {
        return Err({
          publisher: 'x-thread',
          message: `Tweet ${i + 1} too long: ${tweet.length} chars (maximum 280)`,
          retryable: false
        });
      }
    }

    return Ok(undefined);
  }

  /**
   * Publish thread to X API (mocked for MVP)
   */
  private async publishThread(
    content: ChannelContent
  ): Promise<Result<PublishResult, PublishError>> {
    try {
      const tweets = content.body.split(/\n\n---\n\n/).map(t => t.trim());

      // For MVP: mock the API call
      this.logger.info('mock_publish', {
        publisher: 'x-thread',
        title: content.title,
        tweetCount: tweets.length
      });

      // Simulate API delay
      await this.sleep(1000);

      // Mock successful response
      const mockId = `x-thread-${Date.now()}`;
      const mockUrl = `https://x.com/user/status/${mockId}`;

      this.logger.info('publish_success', {
        publisher: 'x-thread',
        externalId: mockId,
        url: mockUrl,
        tweetCount: tweets.length
      });

      return Ok({
        channel: 'x-thread',
        externalUrl: mockUrl,
        externalId: mockId,
        publishedAt: new Date()
      });

    } catch (error) {
      this.logger.error('publish_error', {
        publisher: 'x-thread',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        publisher: 'x-thread',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      });
    }
  }
}
