/**
 * Base publisher with retry logic
 */

import {
  Err,
  type Result,
  type Channel,
  type ChannelContent,
  type PublishResult,
  type Logger,
  createLogger
} from '@content-forge/core';

export interface PublisherConfig {
  channel: Channel;
  apiKey?: string;
  maxRetries: number; // default: 3
}

export interface PublishError {
  publisher: string;
  message: string;
  statusCode?: number;
  retryable: boolean;
}

export abstract class BasePublisher {
  protected config: PublisherConfig;
  protected logger: Logger;

  constructor(config: PublisherConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || createLogger({ agentId: 'publisher' });
  }

  abstract publish(content: ChannelContent): Promise<Result<PublishResult, PublishError>>;

  /**
   * Execute function with exponential backoff retry
   */
  protected async withRetry<T>(
    fn: () => Promise<Result<T, PublishError>>
  ): Promise<Result<T, PublishError>> {
    let lastError: PublishError | null = null;
    const baseDelayMs = 1000;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      if (attempt > 0) {
        // Calculate exponential backoff delay
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }

      const result = await fn();

      if (result.ok) {
        return result;
      }

      lastError = result.error;

      // Don't retry non-retryable errors
      if (!result.error.retryable) {
        this.logger.warn('non_retryable_error', {
          publisher: this.config.channel,
          error: result.error.message
        });
        return result;
      }

      // For rate limits, use longer backoff
      if (result.error.statusCode === 429 && attempt < this.config.maxRetries) {
        const rateLimitDelay = baseDelayMs * Math.pow(2, attempt + 2);
        this.logger.info('rate_limit_backoff', {
          publisher: this.config.channel,
          delay: rateLimitDelay
        });
        await this.sleep(rateLimitDelay);
      }

      this.logger.warn('retry_attempt', {
        publisher: this.config.channel,
        attempt: attempt + 1,
        maxRetries: this.config.maxRetries
      });
    }

    // All retries exhausted
    this.logger.error('max_retries_exceeded', {
      publisher: this.config.channel,
      error: lastError?.message
    });

    return Err(lastError || {
      publisher: this.config.channel,
      message: 'Max retries exceeded',
      retryable: false
    });
  }

  /**
   * Sleep for specified milliseconds
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if HTTP status code is retryable
   */
  protected isRetryableStatus(statusCode: number): boolean {
    // 5xx server errors are retryable
    if (statusCode >= 500) {
      return true;
    }

    // 429 rate limit is retryable
    if (statusCode === 429) {
      return true;
    }

    // 4xx client errors (except 429) are not retryable
    return false;
  }
}
