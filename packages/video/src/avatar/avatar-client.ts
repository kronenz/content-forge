/**
 * Base avatar provider abstraction for AI avatar generation
 * Supports multiple providers: HeyGen, D-ID, Synthesia, SadTalker, LivePortrait, MuseTalk
 */

import { type Result } from '@content-forge/core';
import type { AvatarProfile, AvatarProvider, PresenterGesture } from '@content-forge/core';

export interface AvatarGenerationRequest {
  profile: AvatarProfile;
  audioUrl: string;
  gesture: PresenterGesture;
  durationMs: number;
  outputFormat: 'mp4' | 'webm';
}

export interface AvatarGenerationResult {
  videoUrl: string;
  durationMs: number;
  provider: AvatarProvider;
}

export interface AvatarError {
  message: string;
  provider: AvatarProvider;
  retryable: boolean;
}

export abstract class BaseAvatarProvider {
  abstract readonly provider: AvatarProvider;

  abstract generateAvatar(
    request: AvatarGenerationRequest
  ): Promise<Result<AvatarGenerationResult, AvatarError>>;

  abstract createAvatarProfile(
    name: string,
    referencePhotos: string[],
    referenceVideo?: string
  ): Promise<Result<{ providerAvatarId: string }, AvatarError>>;

  abstract getAvailableAvatars(): Promise<Result<string[], AvatarError>>;
}

/**
 * Factory function to create an avatar provider by type
 * Uses dynamic imports to avoid circular dependencies
 */
export async function createAvatarProvider(
  provider: AvatarProvider,
  config: Record<string, string>
): Promise<BaseAvatarProvider> {
  switch (provider) {
    case 'heygen': {
      const { HeyGenProvider } = await import('./heygen-provider.js');
      return new HeyGenProvider({
        apiKey: config['apiKey'] ?? '',
        baseUrl: config['baseUrl'],
      });
    }
    case 'liveportrait': {
      const { LivePortraitProvider } = await import('./liveportrait-provider.js');
      return new LivePortraitProvider({
        serverUrl: config['serverUrl'] ?? 'http://localhost:8000',
        timeout: config['timeout'] ? Number(config['timeout']) : undefined,
      });
    }
    default:
      throw new Error(`Unsupported avatar provider: ${provider}`);
  }
}
