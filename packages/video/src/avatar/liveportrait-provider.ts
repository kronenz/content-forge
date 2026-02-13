/**
 * LivePortrait avatar provider — self-hosted wrapper for LivePortrait server
 * Handles local avatar generation via a self-hosted inference server
 */

import { Ok, Err, type Result } from '@content-forge/core';
import type { AvatarProvider } from '@content-forge/core';
import {
  BaseAvatarProvider,
  type AvatarGenerationRequest,
  type AvatarGenerationResult,
  type AvatarError,
} from './avatar-client.js';

export interface LivePortraitConfig {
  serverUrl: string;
  timeout?: number;
}

const DEFAULT_TIMEOUT_MS = 120000;
const POLL_INTERVAL_MS = 2000;

export class LivePortraitProvider extends BaseAvatarProvider {
  readonly provider: AvatarProvider = 'liveportrait';
  private readonly serverUrl: string;
  private readonly timeout: number;

  constructor(private config: LivePortraitConfig) {
    super();
    this.serverUrl = config.serverUrl.replace(/\/$/, '');
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
  }

  async generateAvatar(
    request: AvatarGenerationRequest
  ): Promise<Result<AvatarGenerationResult, AvatarError>> {
    const referencePhoto = request.profile.referencePhotos[0];
    if (!referencePhoto) {
      return Err({
        message: 'Avatar profile has no reference photos',
        provider: this.provider,
        retryable: false,
      });
    }

    // 1. Submit generation task
    let taskId: string;
    try {
      const response = await fetch(`${this.serverUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference_image: referencePhoto,
          audio_url: request.audioUrl,
          gesture: request.gesture,
          output_format: request.outputFormat,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return Err({
          message: `LivePortrait API error (${response.status}): ${errorBody}`,
          provider: this.provider,
          retryable: response.status >= 500,
        });
      }

      const data = (await response.json()) as { task_id?: string };
      taskId = data.task_id ?? '';
      if (!taskId) {
        return Err({
          message: 'LivePortrait API returned no task_id',
          provider: this.provider,
          retryable: true,
        });
      }
    } catch (error) {
      return Err({
        message: `LivePortrait request failed: ${error instanceof Error ? error.message : String(error)}`,
        provider: this.provider,
        retryable: true,
      });
    }

    // 2. Poll for completion
    const pollResult = await this.pollTaskStatus(taskId);
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
    referenceVideo?: string
  ): Promise<Result<{ providerAvatarId: string }, AvatarError>> {
    if (referencePhotos.length === 0) {
      return Err({
        message: 'At least one reference photo is required',
        provider: this.provider,
        retryable: false,
      });
    }

    try {
      const response = await fetch(`${this.serverUrl}/api/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          reference_photos: referencePhotos,
          reference_video: referenceVideo,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return Err({
          message: `LivePortrait create profile error (${response.status}): ${errorBody}`,
          provider: this.provider,
          retryable: response.status >= 500,
        });
      }

      const data = (await response.json()) as { profile_id?: string };
      const profileId = data.profile_id ?? '';
      if (!profileId) {
        return Err({
          message: 'LivePortrait API returned no profile_id',
          provider: this.provider,
          retryable: true,
        });
      }

      return Ok({ providerAvatarId: profileId });
    } catch (error) {
      return Err({
        message: `LivePortrait create profile failed: ${error instanceof Error ? error.message : String(error)}`,
        provider: this.provider,
        retryable: true,
      });
    }
  }

  async getAvailableAvatars(): Promise<Result<string[], AvatarError>> {
    try {
      const response = await fetch(`${this.serverUrl}/api/profiles`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return Err({
          message: `LivePortrait list profiles error (${response.status}): ${errorBody}`,
          provider: this.provider,
          retryable: response.status >= 500,
        });
      }

      const data = (await response.json()) as {
        profiles?: Array<{ id: string }>;
      };
      const profiles = data.profiles ?? [];
      return Ok(profiles.map((p) => p.id));
    } catch (error) {
      return Err({
        message: `LivePortrait list profiles failed: ${error instanceof Error ? error.message : String(error)}`,
        provider: this.provider,
        retryable: true,
      });
    }
  }

  private async pollTaskStatus(
    taskId: string
  ): Promise<Result<{ videoUrl: string }, AvatarError>> {
    const startTime = Date.now();

    while (Date.now() - startTime < this.timeout) {
      try {
        const response = await fetch(
          `${this.serverUrl}/api/status/${taskId}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (!response.ok) {
          const errorBody = await response.text();
          return Err({
            message: `LivePortrait status check error (${response.status}): ${errorBody}`,
            provider: this.provider,
            retryable: response.status >= 500,
          });
        }

        const data = (await response.json()) as {
          status?: string;
          error?: string;
        };

        if (data.status === 'completed') {
          const videoUrl = `${this.serverUrl}/api/result/${taskId}`;
          return Ok({ videoUrl });
        }

        if (data.status === 'failed') {
          return Err({
            message: `LivePortrait generation failed: ${data.error ?? 'unknown error'}`,
            provider: this.provider,
            retryable: true,
          });
        }

        // Still processing — wait before next poll
        await sleep(POLL_INTERVAL_MS);
      } catch (error) {
        return Err({
          message: `LivePortrait polling failed: ${error instanceof Error ? error.message : String(error)}`,
          provider: this.provider,
          retryable: true,
        });
      }
    }

    return Err({
      message: `LivePortrait generation timed out after ${this.timeout}ms`,
      provider: this.provider,
      retryable: true,
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
