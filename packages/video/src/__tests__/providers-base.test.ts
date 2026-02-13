/**
 * Tests for base-visual-provider.ts — Base class contracts
 * Verifies that abstract classes enforce correct provider interface
 */

import { describe, it, expect } from 'vitest';
import { Ok, Err, type Result } from '@content-forge/core';
import {
  BaseImageProvider,
  BaseVideoProvider,
  BaseStockProvider,
  type VisualGenerationRequest,
  type ImageGenerationResult,
  type VideoGenerationResult,
  type StockSearchResult,
  type VisualProviderError,
} from '../providers/base-visual-provider.js';

class TestImageProvider extends BaseImageProvider {
  readonly provider = 'test-image';

  async generate(
    request: VisualGenerationRequest
  ): Promise<Result<ImageGenerationResult, VisualProviderError>> {
    return Ok({
      imageUrl: `https://example.com/${request.prompt}.png`,
      width: 1920,
      height: 1080,
      provider: this.provider,
    });
  }
}

class TestVideoProvider extends BaseVideoProvider {
  readonly provider = 'test-video';

  async generate(
    request: VisualGenerationRequest & { durationMs?: number }
  ): Promise<Result<VideoGenerationResult, VisualProviderError>> {
    return Ok({
      videoUrl: `https://example.com/${request.prompt}.mp4`,
      durationMs: request.durationMs ?? 5000,
      width: 1920,
      height: 1080,
      provider: this.provider,
    });
  }
}

class TestStockProvider extends BaseStockProvider {
  readonly source = 'test-stock';

  async search(
    query: string,
    page = 1,
    _perPage = 10
  ): Promise<Result<StockSearchResult, VisualProviderError>> {
    return Ok({
      items: [
        {
          id: '1',
          url: `https://example.com/${query}.jpg`,
          thumbnailUrl: `https://example.com/${query}_thumb.jpg`,
          width: 1920,
          height: 1080,
          description: query,
          source: this.source,
          license: 'test',
        },
      ],
      totalCount: 1,
      page,
    });
  }
}

class FailingImageProvider extends BaseImageProvider {
  readonly provider = 'failing-image';

  async generate(
    _request: VisualGenerationRequest
  ): Promise<Result<ImageGenerationResult, VisualProviderError>> {
    return Err({
      message: 'Provider unavailable',
      provider: this.provider,
      retryable: false,
    });
  }
}

describe('BaseImageProvider', () => {
  it('should allow concrete implementations to return Ok results', async () => {
    const provider = new TestImageProvider();
    const result = await provider.generate({
      prompt: 'sunset',
      aspectRatio: '16:9',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.imageUrl).toBe('https://example.com/sunset.png');
      expect(result.value.provider).toBe('test-image');
      expect(result.value.width).toBe(1920);
      expect(result.value.height).toBe(1080);
    }
  });

  it('should allow concrete implementations to return Err results', async () => {
    const provider = new FailingImageProvider();
    const result = await provider.generate({
      prompt: 'anything',
      aspectRatio: '16:9',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('Provider unavailable');
      expect(result.error.provider).toBe('failing-image');
      expect(result.error.retryable).toBe(false);
    }
  });

  it('should expose provider name', () => {
    const provider = new TestImageProvider();
    expect(provider.provider).toBe('test-image');
  });
});

describe('BaseVideoProvider', () => {
  it('should allow concrete implementations to generate video', async () => {
    const provider = new TestVideoProvider();
    const result = await provider.generate({
      prompt: 'ocean waves',
      aspectRatio: '9:16',
      durationMs: 8000,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.videoUrl).toBe('https://example.com/ocean waves.mp4');
      expect(result.value.durationMs).toBe(8000);
      expect(result.value.provider).toBe('test-video');
    }
  });

  it('should use default duration when not specified', async () => {
    const provider = new TestVideoProvider();
    const result = await provider.generate({
      prompt: 'test',
      aspectRatio: '16:9',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.durationMs).toBe(5000);
    }
  });
});

describe('BaseStockProvider', () => {
  it('should allow concrete implementations to search stock', async () => {
    const provider = new TestStockProvider();
    const result = await provider.search('nature', 1, 10);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toHaveLength(1);
      expect(result.value.items[0].source).toBe('test-stock');
      expect(result.value.totalCount).toBe(1);
      expect(result.value.page).toBe(1);
    }
  });

  it('should expose source name', () => {
    const provider = new TestStockProvider();
    expect(provider.source).toBe('test-stock');
  });
});
