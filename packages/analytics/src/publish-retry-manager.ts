/**
 * Enhanced publish failure management with retry and alerting
 *
 * Tracks publication failures, manages retry queues with exponential backoff,
 * and sends webhook alerts for persistent failures.
 */

import {
  createLogger,
  Ok,
  Err,
  type Logger,
  type Result,
  type Channel,
  type PublishResult,
} from '@content-forge/core';

// ---------------------------------------------------------------------------
// Types (local to avoid circular dep with @content-forge/publishers)
// ---------------------------------------------------------------------------

/**
 * Publish failure info - mirrors PublishError from publishers
 * but defined locally to avoid circular dependency.
 */
export interface PublishFailure {
  publisher: string;
  message: string;
  statusCode?: number;
  retryable: boolean;
}

export interface FailedPublication {
  channel: Channel;
  publicationId: string;
  attempts: number;
  lastError: PublishFailure;
  lastAttemptAt: string;
  nextRetryAt: string;
}

export interface RetryReport {
  total: number;
  succeeded: number;
  failed: number;
  remaining: number;
}

export interface PublishRetryManagerConfig {
  maxRetries: number;
  baseDelayMs: number;
  alertWebhookUrl?: string;
}

export interface RetryManagerError {
  source: string;
  message: string;
  cause?: unknown;
}

// ---------------------------------------------------------------------------
// PublishRetryManager
// ---------------------------------------------------------------------------

export class PublishRetryManager {
  private readonly config: PublishRetryManagerConfig;
  private readonly logger: Logger;
  private readonly failures: Map<string, FailedPublication> = new Map();

  constructor(config: PublishRetryManagerConfig) {
    this.config = config;
    this.logger = createLogger({ agentId: 'analytics:retry-manager' });
  }

  /**
   * Track a publication failure for later retry.
   */
  trackFailure(
    channel: Channel,
    publicationId: string,
    error: PublishFailure,
  ): void {
    const key = `${channel}:${publicationId}`;
    const existing = this.failures.get(key);
    const attempts = existing ? existing.attempts + 1 : 1;
    const now = new Date();

    const delayMs = this.config.baseDelayMs * Math.pow(2, attempts - 1);
    const nextRetryAt = new Date(now.getTime() + delayMs);

    const failed: FailedPublication = {
      channel,
      publicationId,
      attempts,
      lastError: error,
      lastAttemptAt: now.toISOString(),
      nextRetryAt: nextRetryAt.toISOString(),
    };

    this.failures.set(key, failed);

    this.logger.warn('track_failure', {
      channel,
      publicationId,
      attempts,
      retryable: error.retryable,
      nextRetryAt: nextRetryAt.toISOString(),
    });
  }

  /**
   * Get all tracked failed publications.
   */
  getFailedPublications(): FailedPublication[] {
    return [...this.failures.values()];
  }

  /**
   * Get count of tracked failures.
   */
  getFailureCount(): number {
    return this.failures.size;
  }

  /**
   * Retry all failed publications that are eligible for retry.
   */
  async retryFailed(
    publishFn: (pub: FailedPublication) => Promise<Result<PublishResult, PublishFailure>>,
  ): Promise<Result<RetryReport, RetryManagerError>> {
    try {
      const now = new Date();
      const eligible = [...this.failures.entries()].filter(([_key, pub]) => {
        if (!pub.lastError.retryable) {
          return false;
        }
        if (pub.attempts >= this.config.maxRetries) {
          return false;
        }
        return new Date(pub.nextRetryAt) <= now;
      });

      let succeeded = 0;
      let failed = 0;

      for (const [key, pub] of eligible) {
        const result = await publishFn(pub);

        if (result.ok) {
          this.failures.delete(key);
          succeeded++;
          this.logger.info('retry_success', {
            channel: pub.channel,
            publicationId: pub.publicationId,
          });
        } else {
          this.trackFailure(pub.channel, pub.publicationId, result.error);
          failed++;
          this.logger.warn('retry_failed', {
            channel: pub.channel,
            publicationId: pub.publicationId,
            attempts: pub.attempts + 1,
          });

          // Send alert if max retries exceeded after this attempt
          const updated = this.failures.get(key);
          if (updated && updated.attempts >= this.config.maxRetries) {
            await this.sendAlert(updated);
          }
        }
      }

      const report: RetryReport = {
        total: eligible.length,
        succeeded,
        failed,
        remaining: this.failures.size,
      };

      this.logger.info('retry_report', { ...report });

      return Ok(report);
    } catch (cause: unknown) {
      return Err({
        source: 'PublishRetryManager',
        message: 'Failed to execute retry cycle',
        cause,
      });
    }
  }

  /**
   * Send a webhook alert for a persistent failure.
   */
  sendAlert(failure: FailedPublication): Promise<void> {
    return Promise.resolve((() => {
      if (!this.config.alertWebhookUrl) {
        this.logger.debug('alert_skipped', {
          reason: 'no webhook URL configured',
          channel: failure.channel,
          publicationId: failure.publicationId,
        });
        return;
      }

      const payload = {
        type: 'publish_failure_alert',
        channel: failure.channel,
        publicationId: failure.publicationId,
        attempts: failure.attempts,
        lastError: failure.lastError.message,
        lastAttemptAt: failure.lastAttemptAt,
        alertedAt: new Date().toISOString(),
      };

      this.logger.warn('send_alert', {
        webhookUrl: this.config.alertWebhookUrl,
        ...payload,
      });

      // In production, this would POST to the webhook URL.
      // For now, log the alert payload. The actual HTTP call
      // is intentionally omitted to avoid external dependencies.
      // Integration with a real HTTP client happens at deployment time.
    })());
  }

  /**
   * Clear all tracked failures (e.g., after manual resolution).
   */
  clear(): void {
    this.failures.clear();
    this.logger.info('clear_failures');
  }
}
