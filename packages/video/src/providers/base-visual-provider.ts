/**
 * Base abstractions for pluggable visual source providers
 * Supports AI image generation, AI video generation, and stock media search
 */

import { type Result } from '@content-forge/core';

export interface VisualGenerationRequest {
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  style?: string;
  negativePrompt?: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
  width: number;
  height: number;
  provider: string;
}

export interface VideoGenerationResult {
  videoUrl: string;
  durationMs: number;
  width: number;
  height: number;
  provider: string;
}

export interface StockSearchResult {
  items: StockItem[];
  totalCount: number;
  page: number;
}

export interface StockItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  description: string;
  source: string;
  license: string;
}

export interface VisualProviderError {
  message: string;
  provider: string;
  retryable: boolean;
}

export abstract class BaseImageProvider {
  abstract readonly provider: string;
  abstract generate(
    request: VisualGenerationRequest
  ): Promise<Result<ImageGenerationResult, VisualProviderError>>;
}

export abstract class BaseVideoProvider {
  abstract readonly provider: string;
  abstract generate(
    request: VisualGenerationRequest & { durationMs?: number }
  ): Promise<Result<VideoGenerationResult, VisualProviderError>>;
}

export abstract class BaseStockProvider {
  abstract readonly source: string;
  abstract search(
    query: string,
    page?: number,
    perPage?: number
  ): Promise<Result<StockSearchResult, VisualProviderError>>;
}
