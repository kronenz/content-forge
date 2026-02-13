/**
 * Runway video provider — Runway Gen API wrapper
 * Submits video generation task and polls for completion
 */

import { Ok, Err, type Result } from '@content-forge/core';
import {
  BaseVideoProvider,
  type VisualGenerationRequest,
  type VideoGenerationResult,
  type VisualProviderError,
} from './base-visual-provider.js';

export interface RunwayConfig {
  apiKey: string;
}

const BASE_URL = 'https://api.dev.runwayml.com';
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 300000; // 5 minutes

export class RunwayProvider extends BaseVideoProvider {
  readonly provider = 'runway';
  private readonly apiKey: string;

  constructor(config: RunwayConfig) {
    super();
    this.apiKey = config.apiKey;
  }

  async generate(
    request: VisualGenerationRequest & { durationMs?: number }
  ): Promise<Result<VideoGenerationResult, VisualProviderError>> {
    const dimensions = this.getDimensions(request.aspectRatio);
    const durationSeconds = Math.ceil((request.durationMs ?? 4000) / 1000);

    // 1. Create generation task
    let taskId: string;
    try {
      const response = await fetch(`${BASE_URL}/v1/text_to_video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          prompt: request.prompt,
          duration: durationSeconds,
          ratio: request.aspectRatio === '16:9' ? '16:9' : '9:16',
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return Err({
          message: `Runway API error (${response.status}): ${errorBody}`,
          provider: this.provider,
          retryable: response.status >= 500 || response.status === 429,
        });
      }

      const data = (await response.json()) as { id?: string };
      taskId = data.id ?? '';
      if (!taskId) {
        return Err({
          message: 'Runway API returned no task id',
          provider: this.provider,
          retryable: true,
        });
      }
    } catch (error) {
      return Err({
        message: `Runway request failed: ${error instanceof Error ? error.message : String(error)}`,
        provider: this.provider,
        retryable: true,
      });
    }

    // 2. Poll for completion
    return this.pollTask(taskId, dimensions, request.durationMs ?? 4000);
  }

  private async pollTask(
    taskId: string,
    dimensions: { width: number; height: number },
    durationMs: number
  ): Promise<Result<VideoGenerationResult, VisualProviderError>> {
    const startTime = Date.now();

    while (Date.now() - startTime < POLL_TIMEOUT_MS) {
      try {
        const response = await fetch(`${BASE_URL}/v1/tasks/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });

        if (!response.ok) {
          const errorBody = await response.text();
          return Err({
            message: `Runway status check error (${response.status}): ${errorBody}`,
            provider: this.provider,
            retryable: response.status >= 500,
          });
        }

        const data = (await response.json()) as {
          status?: string;
          output?: string[];
          error?: string;
        };

        if (data.status === 'SUCCEEDED') {
          const videoUrl = data.output?.[0] ?? '';
          if (!videoUrl) {
            return Err({
              message: 'Runway completed but returned no output URL',
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

        if (data.status === 'FAILED') {
          return Err({
            message: `Runway generation failed: ${data.error ?? 'unknown error'}`,
            provider: this.provider,
            retryable: true,
          });
        }

        // Still processing
        await sleep(POLL_INTERVAL_MS);
      } catch (error) {
        return Err({
          message: `Runway polling failed: ${error instanceof Error ? error.message : String(error)}`,
          provider: this.provider,
          retryable: true,
        });
      }
    }

    return Err({
      message: `Runway generation timed out after ${POLL_TIMEOUT_MS}ms`,
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
