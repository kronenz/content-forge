/**
 * HeyGen avatar provider — API wrapper for HeyGen video generation
 * Handles avatar creation, video generation with lip-sync, and status polling
 */

import { Ok, Err, type Result } from '@content-forge/core';
import type { AvatarProvider } from '@content-forge/core';
import {
  BaseAvatarProvider,
  type AvatarGenerationRequest,
  type AvatarGenerationResult,
  type AvatarError,
} from './avatar-client.js';

export interface HeyGenConfig {
  apiKey: string;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://api.heygen.com';
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 300000; // 5 minutes

export class HeyGenProvider extends BaseAvatarProvider {
  readonly provider: AvatarProvider = 'heygen';
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private config: HeyGenConfig) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  }

  async generateAvatar(
    request: AvatarGenerationRequest
  ): Promise<Result<AvatarGenerationResult, AvatarError>> {
    const avatarId = request.profile.providerAvatarId;
    if (!avatarId) {
      return Err({
        message: 'Avatar profile does not have a HeyGen avatar ID (providerAvatarId)',
        provider: this.provider,
        retryable: false,
      });
    }

    // 1. Create video generation task
    let videoId: string;
    try {
      const response = await fetch(`${this.baseUrl}/v2/video/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          video_inputs: [
            {
              character: {
                type: 'avatar',
                avatar_id: avatarId,
                avatar_style: request.gesture,
              },
              voice: {
                type: 'audio',
                audio_url: request.audioUrl,
              },
            },
          ],
          dimension: { width: 1920, height: 1080 },
          output_format: request.outputFormat,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return Err({
          message: `HeyGen API error (${response.status}): ${errorBody}`,
          provider: this.provider,
          retryable: response.status >= 500,
        });
      }

      const data = (await response.json()) as { data?: { video_id?: string } };
      videoId = data.data?.video_id ?? '';
      if (!videoId) {
        return Err({
          message: 'HeyGen API returned no video_id',
          provider: this.provider,
          retryable: true,
        });
      }
    } catch (error) {
      return Err({
        message: `HeyGen request failed: ${error instanceof Error ? error.message : String(error)}`,
        provider: this.provider,
        retryable: true,
      });
    }

    // 2. Poll for completion
    const pollResult = await this.pollVideoStatus(videoId);
    if (!pollResult.ok) {
      return pollResult;
    }

    return Ok({
      videoUrl: pollResult.value.videoUrl,
      durationMs: request.durationMs,
      provider: this.provider,
    });
  }

  async createAvatarProfile(
    name: string,
    referencePhotos: string[],
    _referenceVideo?: string
  ): Promise<Result<{ providerAvatarId: string }, AvatarError>> {
    if (referencePhotos.length === 0) {
      return Err({
        message: 'At least one reference photo is required',
        provider: this.provider,
        retryable: false,
      });
    }

    try {
      const response = await fetch(`${this.baseUrl}/v2/photo_avatar/photo_avatar`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          name,
          image_url: referencePhotos[0],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return Err({
          message: `HeyGen create avatar error (${response.status}): ${errorBody}`,
          provider: this.provider,
          retryable: response.status >= 500,
        });
      }

      const data = (await response.json()) as { data?: { avatar_id?: string } };
      const avatarId = data.data?.avatar_id ?? '';
      if (!avatarId) {
        return Err({
          message: 'HeyGen API returned no avatar_id',
          provider: this.provider,
          retryable: true,
        });
      }

      return Ok({ providerAvatarId: avatarId });
    } catch (error) {
      return Err({
        message: `HeyGen create avatar failed: ${error instanceof Error ? error.message : String(error)}`,
        provider: this.provider,
        retryable: true,
      });
    }
  }

  async getAvailableAvatars(): Promise<Result<string[], AvatarError>> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/avatars`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return Err({
          message: `HeyGen list avatars error (${response.status}): ${errorBody}`,
          provider: this.provider,
          retryable: response.status >= 500,
        });
      }

      const data = (await response.json()) as {
        data?: { avatars?: Array<{ avatar_id: string }> };
      };
      const avatars = data.data?.avatars ?? [];
      return Ok(avatars.map((a) => a.avatar_id));
    } catch (error) {
      return Err({
        message: `HeyGen list avatars failed: ${error instanceof Error ? error.message : String(error)}`,
        provider: this.provider,
        retryable: true,
      });
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Api-Key': this.apiKey,
    };
  }

  private async pollVideoStatus(
    videoId: string
  ): Promise<Result<{ videoUrl: string }, AvatarError>> {
    const startTime = Date.now();

    while (Date.now() - startTime < POLL_TIMEOUT_MS) {
      try {
        const response = await fetch(
          `${this.baseUrl}/v1/video_status.get?video_id=${videoId}`,
          {
            method: 'GET',
            headers: this.getHeaders(),
          }
        );

        if (!response.ok) {
          const errorBody = await response.text();
          return Err({
            message: `HeyGen status check error (${response.status}): ${errorBody}`,
            provider: this.provider,
            retryable: response.status >= 500,
          });
        }

        const data = (await response.json()) as {
          data?: { status?: string; video_url?: string; error?: string };
        };

        const status = data.data?.status;

        if (status === 'completed') {
          const videoUrl = data.data?.video_url ?? '';
          if (!videoUrl) {
            return Err({
              message: 'HeyGen completed but returned no video_url',
              provider: this.provider,
              retryable: true,
            });
          }
          return Ok({ videoUrl });
        }

        if (status === 'failed') {
          return Err({
            message: `HeyGen video generation failed: ${data.data?.error ?? 'unknown error'}`,
            provider: this.provider,
            retryable: true,
          });
        }

        // Still processing — wait before next poll
        await sleep(POLL_INTERVAL_MS);
      } catch (error) {
        return Err({
          message: `HeyGen polling failed: ${error instanceof Error ? error.message : String(error)}`,
          provider: this.provider,
          retryable: true,
        });
      }
    }

    return Err({
      message: `HeyGen video generation timed out after ${POLL_TIMEOUT_MS}ms`,
      provider: this.provider,
      retryable: true,
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
