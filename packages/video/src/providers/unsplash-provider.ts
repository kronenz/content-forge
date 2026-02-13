/**
 * Unsplash stock provider — Unsplash API wrapper for stock photo search
 * Supports photo search with pagination
 */

import { Ok, Err, type Result } from '@content-forge/core';
import {
  BaseStockProvider,
  type StockSearchResult,
  type StockItem,
  type VisualProviderError,
} from './base-visual-provider.js';

export interface UnsplashConfig {
  apiKey: string;
}

const BASE_URL = 'https://api.unsplash.com';

export class UnsplashProvider extends BaseStockProvider {
  readonly source = 'unsplash';
  private readonly apiKey: string;

  constructor(config: UnsplashConfig) {
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
      const response = await fetch(`${BASE_URL}/search/photos?${params.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Client-ID ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return Err({
          message: `Unsplash API error (${response.status}): ${errorBody}`,
          provider: this.source,
          retryable: response.status >= 500 || response.status === 429,
        });
      }

      const data = (await response.json()) as {
        total?: number;
        results?: Array<{
          id: string;
          width: number;
          height: number;
          description: string | null;
          alt_description: string | null;
          urls: { raw: string; small: string };
        }>;
      };

      const results = data.results ?? [];
      const items: StockItem[] = results.map((photo) => ({
        id: photo.id,
        url: photo.urls.raw,
        thumbnailUrl: photo.urls.small,
        width: photo.width,
        height: photo.height,
        description: photo.description ?? photo.alt_description ?? '',
        source: this.source,
        license: 'Unsplash License',
      }));

      return Ok({
        items,
        totalCount: data.total ?? 0,
        page,
      });
    } catch (error) {
      return Err({
        message: `Unsplash request failed: ${error instanceof Error ? error.message : String(error)}`,
        provider: this.source,
        retryable: true,
      });
    }
  }
}
