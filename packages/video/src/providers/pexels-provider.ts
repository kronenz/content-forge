/**
 * Pexels stock provider — Pexels API wrapper for stock photo/video search
 * Supports photo search with pagination
 */

import { Ok, Err, type Result } from '@content-forge/core';
import {
  BaseStockProvider,
  type StockSearchResult,
  type StockItem,
  type VisualProviderError,
} from './base-visual-provider.js';

export interface PexelsConfig {
  apiKey: string;
}

const BASE_URL = 'https://api.pexels.com';

export class PexelsProvider extends BaseStockProvider {
  readonly source = 'pexels';
  private readonly apiKey: string;

  constructor(config: PexelsConfig) {
    super();
    this.apiKey = config.apiKey;
  }

  async search(
    query: string,
    page = 1,
    perPage = 15
  ): Promise<Result<StockSearchResult, VisualProviderError>> {
    const params = new URLSearchParams({
      query,
      per_page: String(perPage),
      page: String(page),
    });

    try {
      const response = await fetch(`${BASE_URL}/v1/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: this.apiKey,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return Err({
          message: `Pexels API error (${response.status}): ${errorBody}`,
          provider: this.source,
          retryable: response.status >= 500 || response.status === 429,
        });
      }

      const data = (await response.json()) as {
        total_results?: number;
        page?: number;
        photos?: Array<{
          id: number;
          width: number;
          height: number;
          alt: string;
          src: { original: string; medium: string };
        }>;
      };

      const photos = data.photos ?? [];
      const items: StockItem[] = photos.map((photo) => ({
        id: String(photo.id),
        url: photo.src.original,
        thumbnailUrl: photo.src.medium,
        width: photo.width,
        height: photo.height,
        description: photo.alt || '',
        source: this.source,
        license: 'Pexels License',
      }));

      return Ok({
        items,
        totalCount: data.total_results ?? 0,
        page: data.page ?? page,
      });
    } catch (error) {
      return Err({
        message: `Pexels request failed: ${error instanceof Error ? error.message : String(error)}`,
        provider: this.source,
        retryable: true,
      });
    }
  }
}
