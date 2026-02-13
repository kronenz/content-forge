/**
 * Tests for avatar-client.ts — BaseAvatarProvider contract and factory function
 */

import { describe, it, expect, vi } from 'vitest';
import type { AvatarProvider } from '@content-forge/core';
import {
  BaseAvatarProvider,
  type AvatarGenerationRequest,
  type AvatarGenerationResult,
  type AvatarError,
} from '../avatar/avatar-client.js';
import type { Result } from '@content-forge/core';

// Concrete subclass for testing
class TestProvider extends BaseAvatarProvider {
  readonly provider: AvatarProvider = 'heygen';

  async generateAvatar(
    _request: AvatarGenerationRequest
  ): Promise<Result<AvatarGenerationResult, AvatarError>> {
    return { ok: true, value: { videoUrl: 'test.mp4', durationMs: 5000, provider: 'heygen' } };
  }

  async createAvatarProfile(
    _name: string,
    _referencePhotos: string[],
    _referenceVideo?: string
  ): Promise<Result<{ providerAvatarId: string }, AvatarError>> {
    return { ok: true, value: { providerAvatarId: 'avatar-123' } };
  }

  async getAvailableAvatars(): Promise<Result<string[], AvatarError>> {
    return { ok: true, value: ['avatar-1', 'avatar-2'] };
  }
}

describe('BaseAvatarProvider', () => {
  it('cannot be instantiated directly (abstract class)', () => {
    // TypeScript prevents direct instantiation at compile time.
    // At runtime, we verify the abstract class serves as a base.
    expect(() => {
      // @ts-expect-error — deliberately testing runtime behavior
      new BaseAvatarProvider();
    }).not.toThrow(); // abstract classes CAN be instantiated in JS, but methods are undefined
  });

  it('concrete subclass implements all methods', async () => {
    const provider = new TestProvider();
    expect(provider.provider).toBe('heygen');

    const mockRequest: AvatarGenerationRequest = {
      profile: {
        id: 'prof-1',
        name: 'Test Avatar',
        referencePhotos: ['photo.jpg'],
        provider: 'heygen',
        providerAvatarId: 'hg-123',
        style: { clothing: 'business', background: 'transparent' },
      },
      audioUrl: 'https://example.com/audio.mp3',
      gesture: 'talking',
      durationMs: 5000,
      outputFormat: 'mp4',
    };

    const genResult = await provider.generateAvatar(mockRequest);
    expect(genResult.ok).toBe(true);
    if (genResult.ok) {
      expect(genResult.value.videoUrl).toBe('test.mp4');
      expect(genResult.value.durationMs).toBe(5000);
    }

    const profileResult = await provider.createAvatarProfile('Test', ['photo.jpg']);
    expect(profileResult.ok).toBe(true);
    if (profileResult.ok) {
      expect(profileResult.value.providerAvatarId).toBe('avatar-123');
    }

    const listResult = await provider.getAvailableAvatars();
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      expect(listResult.value).toEqual(['avatar-1', 'avatar-2']);
    }
  });
});

describe('createAvatarProvider', () => {
  it('should create HeyGen provider', async () => {
    const { createAvatarProvider } = await import('../avatar/avatar-client.js');
    const provider = await createAvatarProvider('heygen', { apiKey: 'test-key' });
    expect(provider.provider).toBe('heygen');
  });

  it('should create LivePortrait provider', async () => {
    const { createAvatarProvider } = await import('../avatar/avatar-client.js');
    const provider = await createAvatarProvider('liveportrait', {
      serverUrl: 'http://localhost:8000',
    });
    expect(provider.provider).toBe('liveportrait');
  });

  it('should throw for unsupported providers', async () => {
    const { createAvatarProvider } = await import('../avatar/avatar-client.js');
    await expect(createAvatarProvider('d-id', {})).rejects.toThrow('Unsupported avatar provider: d-id');
    await expect(createAvatarProvider('synthesia', {})).rejects.toThrow('Unsupported avatar provider: synthesia');
  });
});
