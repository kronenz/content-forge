/**
 * Flux image provider — Flux API wrapper with async polling
 * Submits generation request and polls for result
 */

import { Ok, Err, type Result } from '@content-forge/core';
import {
  BaseImageProvider,
  type VisualGenerationRequest,
  type ImageGenerationResult,
  type VisualProviderError,
} from './base-visual-provider.js';

export interface FluxConfig {
  apiKey: string;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://api.flux.ai';
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120000; // 2 minutes

export class FluxProvider extends BaseImageProvider {
  readonly provider = 'flux';
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: FluxConfig) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
  }

  async generate(
    request: VisualGenerationRequest
  ): Promise<Result<ImageGenerationResult, VisualProviderError>> {
    const dimensions = this.getDimensions(request.aspectRatio);

    // 1. Submit generation request
    let taskId: string;
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          prompt: request.prompt,
          width: dimensions.width,
          height: dimensions.height,
          num_inference_steps: 30,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return Err({
          message: `Flux API error (${response.status}): ${errorBody}`,
          provider: this.provider,
          retryable: response.status >= 500 || response.status === 429,
        });
      }

      const data = (await response.json()) as { task_id?: string };
      taskId = data.task_id ?? '';
      if (!taskId) {
        return Err({
          message: 'Flux API returned no task_id',
          provider: this.provider,
          retryable: true,
        });
      }
    } catch (error) {
      return Err({
        message: `Flux request failed: ${error instanceof Error ? error.message : String(error)}`,
        provider: this.provider,
        retryable: true,
      });
    }

    // 2. Poll for result
    return this.pollResult(taskId, dimensions);
  }

  private async pollResult(
    taskId: string,
    dimensions: { width: number; height: number }
  ): Promise<Result<ImageGenerationResult, VisualProviderError>> {
    const startTime = Date.now();

    while (Date.now() - startTime < POLL_TIMEOUT_MS) {
      try {
        const response = await fetch(`${this.baseUrl}/api/status/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });

        if (!response.ok) {
          const errorBody = await response.text();
          return Err({
            message: `Flux status check error (${response.status}): ${errorBody}`,
            provider: this.provider,
            retryable: response.status >= 500,
          });
        }

        const data = (await response.json()) as {
          status?: string;
          image_url?: string;
          error?: string;
        };

        if (data.status === 'completed') {
          const imageUrl = data.image_url ?? '';
          if (!imageUrl) {
            return Err({
              message: 'Flux completed but returned no image_url',
              provider: this.provider,
              retryable: true,
            });
          }
          return Ok({
            imageUrl,
            width: dimensions.width,
            height: dimensions.height,
            provider: this.provider,
          });
        }

        if (data.status === 'failed') {
          return Err({
            message: `Flux generation failed: ${data.error ?? 'unknown error'}`,
            provider: this.provider,
            retryable: true,
          });
        }

        // Still processing
        await sleep(POLL_INTERVAL_MS);
      } catch (error) {
        return Err({
          message: `Flux polling failed: ${error instanceof Error ? error.message : String(error)}`,
          provider: this.provider,
          retryable: true,
        });
      }
    }

    return Err({
      message: `Flux generation timed out after ${POLL_TIMEOUT_MS}ms`,
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
