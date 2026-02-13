/**
 * ComfyUI image provider — self-hosted ComfyUI server wrapper
 * Submits workflow prompt and polls history for result
 */

import { Ok, Err, type Result } from '@content-forge/core';
import {
  BaseImageProvider,
  type VisualGenerationRequest,
  type ImageGenerationResult,
  type VisualProviderError,
} from './base-visual-provider.js';

export interface ComfyUIConfig {
  serverUrl: string;
  workflow?: string;
}

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 180000; // 3 minutes

export class ComfyUIProvider extends BaseImageProvider {
  readonly provider = 'comfyui';
  private readonly serverUrl: string;
  private readonly workflow: string;

  constructor(config: ComfyUIConfig) {
    super();
    this.serverUrl = config.serverUrl.replace(/\/+$/, '');
    this.workflow = config.workflow ?? 'default';
  }

  async generate(
    request: VisualGenerationRequest
  ): Promise<Result<ImageGenerationResult, VisualProviderError>> {
    const dimensions = this.getDimensions(request.aspectRatio);

    // 1. Submit prompt to ComfyUI
    let promptId: string;
    try {
      const response = await fetch(`${this.serverUrl}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: this.buildWorkflow(request.prompt, dimensions),
          client_id: 'content-forge',
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return Err({
          message: `ComfyUI API error (${response.status}): ${errorBody}`,
          provider: this.provider,
          retryable: response.status >= 500,
        });
      }

      const data = (await response.json()) as { prompt_id?: string };
      promptId = data.prompt_id ?? '';
      if (!promptId) {
        return Err({
          message: 'ComfyUI API returned no prompt_id',
          provider: this.provider,
          retryable: true,
        });
      }
    } catch (error) {
      return Err({
        message: `ComfyUI request failed: ${error instanceof Error ? error.message : String(error)}`,
        provider: this.provider,
        retryable: true,
      });
    }

    // 2. Poll history for result
    return this.pollHistory(promptId, dimensions);
  }

  private async pollHistory(
    promptId: string,
    dimensions: { width: number; height: number }
  ): Promise<Result<ImageGenerationResult, VisualProviderError>> {
    const startTime = Date.now();

    while (Date.now() - startTime < POLL_TIMEOUT_MS) {
      try {
        const response = await fetch(`${this.serverUrl}/history/${promptId}`, {
          method: 'GET',
        });

        if (!response.ok) {
          const errorBody = await response.text();
          return Err({
            message: `ComfyUI history error (${response.status}): ${errorBody}`,
            provider: this.provider,
            retryable: response.status >= 500,
          });
        }

        const data = (await response.json()) as Record<
          string,
          {
            status?: { completed?: boolean; error?: string };
            outputs?: Record<string, { images?: Array<{ filename: string }> }>;
          }
        >;

        const historyEntry = data[promptId];
        if (!historyEntry) {
          // Not ready yet
          await sleep(POLL_INTERVAL_MS);
          continue;
        }

        if (historyEntry.status?.error) {
          return Err({
            message: `ComfyUI generation failed: ${historyEntry.status.error}`,
            provider: this.provider,
            retryable: true,
          });
        }

        // Extract first image from outputs
        const outputs = historyEntry.outputs ?? {};
        for (const nodeOutput of Object.values(outputs)) {
          const images = nodeOutput.images ?? [];
          if (images.length > 0) {
            const filename = images[0].filename;
            return Ok({
              imageUrl: `${this.serverUrl}/view?filename=${encodeURIComponent(filename)}`,
              width: dimensions.width,
              height: dimensions.height,
              provider: this.provider,
            });
          }
        }

        // No images yet — might still be processing
        await sleep(POLL_INTERVAL_MS);
      } catch (error) {
        return Err({
          message: `ComfyUI polling failed: ${error instanceof Error ? error.message : String(error)}`,
          provider: this.provider,
          retryable: true,
        });
      }
    }

    return Err({
      message: `ComfyUI generation timed out after ${POLL_TIMEOUT_MS}ms`,
      provider: this.provider,
      retryable: true,
    });
  }

  private buildWorkflow(
    prompt: string,
    dimensions: { width: number; height: number }
  ): Record<string, unknown> {
    return {
      workflow: this.workflow,
      positive_prompt: prompt,
      width: dimensions.width,
      height: dimensions.height,
    };
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
