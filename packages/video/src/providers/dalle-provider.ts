/**
 * DALL-E image provider — OpenAI DALL-E API wrapper for image generation
 * Supports DALL-E 3 with HD quality output
 */

import { Ok, Err, type Result } from '@content-forge/core';
import {
  BaseImageProvider,
  type VisualGenerationRequest,
  type ImageGenerationResult,
  type VisualProviderError,
} from './base-visual-provider.js';

export interface DalleConfig {
  apiKey: string;
  model?: string;
}

const DEFAULT_MODEL = 'dall-e-3';

export class DalleProvider extends BaseImageProvider {
  readonly provider = 'dalle';
  private readonly apiKey: string;
  private readonly model: string;

  constructor(config: DalleConfig) {
    super();
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_MODEL;
  }

  async generate(
    request: VisualGenerationRequest
  ): Promise<Result<ImageGenerationResult, VisualProviderError>> {
    const size = request.aspectRatio === '16:9' ? '1792x1024' : '1024x1792';
    const [width, height] = size.split('x').map(Number) as [number, number];

    let prompt = request.prompt;
    if (request.style) {
      prompt = `${request.style} style: ${prompt}`;
    }
    if (request.negativePrompt) {
      prompt = `${prompt}. Avoid: ${request.negativePrompt}`;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          size,
          quality: 'hd',
          response_format: 'url',
          n: 1,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return Err({
          message: `DALL-E API error (${response.status}): ${errorBody}`,
          provider: this.provider,
          retryable: response.status >= 500 || response.status === 429,
        });
      }

      const data = (await response.json()) as {
        data?: Array<{ url?: string }>;
      };

      const imageUrl = data.data?.[0]?.url ?? '';
      if (!imageUrl) {
        return Err({
          message: 'DALL-E API returned no image URL',
          provider: this.provider,
          retryable: true,
        });
      }

      return Ok({
        imageUrl,
        width,
        height,
        provider: this.provider,
      });
    } catch (error) {
      return Err({
        message: `DALL-E request failed: ${error instanceof Error ? error.message : String(error)}`,
        provider: this.provider,
        retryable: true,
      });
    }
  }
}
