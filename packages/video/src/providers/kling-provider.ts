/**
 * Kling video provider — Kling AI video generation wrapper
 * Submits video generation request and polls for completion
 */

import { Ok, Err, type Result } from '@content-forge/core';
import {
  BaseVideoProvider,
  type VisualGenerationRequest,
  type VideoGenerationResult,
  type VisualProviderError,
} from './base-visual-provider.js';

export interface KlingConfig {
  apiKey: string;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://api.klingai.com';
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 300000; // 5 minutes

export class KlingProvider extends BaseVideoProvider {
  readonly provider = 'kling';
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: KlingConfig) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
  }

  async generate(
    request: VisualGenerationRequest & { durationMs?: number }
  ): Promise<Result<VideoGenerationResult, VisualProviderError>> {
    const dimensions = this.getDimensions(request.aspectRatio);
    const durationSeconds = Math.ceil((request.durationMs ?? 5000) / 1000);

    // 1. Submit generation request
    let taskId: string;
    try {
      const response = await fetch(`${this.baseUrl}/v1/videos/text2video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          prompt: request.prompt,
          duration: durationSeconds,
          aspect_ratio: request.aspectRatio,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return Err({
          message: `Kling API error (${response.status}): ${errorBody}`,
          provider: this.provider,
          retryable: response.status >= 500 || response.status === 429,
        });
      }

      const data = (await response.json()) as { data?: { task_id?: string } };
      taskId = data.data?.task_id ?? '';
      if (!taskId) {
        return Err({
          message: 'Kling API returned no task_id',
          provider: this.provider,
          retryable: true,
        });
      }
    } catch (error) {
      return Err({
        message: `Kling request failed: ${error instanceof Error ? error.message : String(error)}`,
        provider: this.provider,
        retryable: true,
      });
    }

    // 2. Poll for completion
    return this.pollTask(taskId, dimensions, request.durationMs ?? 5000);
  }

  private async pollTask(
    taskId: string,
    dimensions: { width: number; height: number },
    durationMs: number
  ): Promise<Result<VideoGenerationResult, VisualProviderError>> {
    const startTime = Date.now();

    while (Date.now() - startTime < POLL_TIMEOUT_MS) {
      try {
        const response = await fetch(`${this.baseUrl}/v1/videos/text2video/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });

        if (!response.ok) {
          const errorBody = await response.text();
          return Err({
            message: `Kling status check error (${response.status}): ${errorBody}`,
            provider: this.provider,
            retryable: response.status >= 500,
          });
        }

        const data = (await response.json()) as {
          data?: {
            task_status?: string;
            task_result?: { videos?: Array<{ url: string; duration: number }> };
            task_status_msg?: string;
          };
        };

        const status = data.data?.task_status;

        if (status === 'succeed') {
          const videoUrl = data.data?.task_result?.videos?.[0]?.url ?? '';
          if (!videoUrl) {
            return Err({
              message: 'Kling completed but returned no video URL',
              provider: this.provider,
              retryable: true,
            });
          }
          return Ok({
            videoUrl,
            durationMs,
            width: dimensions.width,
            height: dimensions.height,
            provider: this.provider,
          });
        }

        if (status === 'failed') {
          return Err({
            message: `Kling generation failed: ${data.data?.task_status_msg ?? 'unknown error'}`,
            provider: this.provider,
            retryable: true,
          });
        }

        // Still processing
        await sleep(POLL_INTERVAL_MS);
      } catch (error) {
        return Err({
          message: `Kling polling failed: ${error instanceof Error ? error.message : String(error)}`,
          provider: this.provider,
          retryable: true,
        });
      }
    }

    return Err({
      message: `Kling generation timed out after ${POLL_TIMEOUT_MS}ms`,
      provider: this.provider,
      retryable: true,
    });
  }

  private getDimensions(aspectRatio: '16:9' | '9:16'): { width: number; height: number } {
    return aspectRatio === '16:9'
      ? { width: 1920, height: 1080 }
      : { width: 1080, height: 1920 };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
