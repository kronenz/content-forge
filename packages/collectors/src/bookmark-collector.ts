/**
 * Raindrop.io bookmark collector
 */

import { Ok, Err, type Material } from '@content-forge/core';
import { BaseCollector, type CollectorConfig, type CollectorError, type Result } from './base-collector.js';

export interface BookmarkCollectorConfig extends CollectorConfig {
  apiToken: string;
  collectionId?: number; // Optional collection ID, defaults to 0 (all)
}

interface RaindropItem {
  _id: number;
  link: string;
  title: string;
  excerpt: string;
  tags: string[];
  created: string;
  domain?: string;
}

interface RaindropResponse {
  result: boolean;
  items: RaindropItem[];
}

export class BookmarkCollector extends BaseCollector {
  private apiToken: string;
  private collectionId: number;
  private baseUrl = 'https://api.raindrop.io/rest/v1';

  constructor(config: BookmarkCollectorConfig) {
    super(config);
    this.apiToken = config.apiToken;
    this.collectionId = config.collectionId || 0;
  }

  async collect(): Promise<Result<Material[], CollectorError>> {
    try {
      this.logger.info('collect_start', { collectionId: this.collectionId });

      const url = `${this.baseUrl}/raindrops/${this.collectionId}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Raindrop API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as RaindropResponse;

      if (!data.result) {
        throw new Error('Raindrop API returned unsuccessful result');
      }

      const materials = this.itemsToMaterials(data.items);
      const deduplicated = this.deduplicate(materials);

      this.logger.info('collect_complete', {
        itemCount: data.items.length,
        materialCount: deduplicated.length,
      });

      return Ok(deduplicated);
    } catch (error) {
      this.logger.error('collect_failed', {
        collectionId: this.collectionId,
        error: error instanceof Error ? error.message : String(error),
      });

      return Err({
        collector: this.config.name,
        message: 'Failed to collect bookmarks from Raindrop.io',
        cause: error,
      });
    }
  }

  private itemsToMaterials(items: RaindropItem[]): Material[] {
    const materials: Material[] = [];

    for (const item of items) {
      if (!item.link || !item.title) {
        continue;
      }

      const material: Material = {
        id: this.generateId(item._id),
        source: this.config.source,
        url: item.link,
        title: item.title,
        content: item.excerpt || '',
        score: 0, // Will be scored separately
        tags: [...item.tags, ...(item.domain ? [`domain:${item.domain}`] : [])],
        status: 'new',
        collectedAt: new Date(),
        createdAt: new Date(item.created),
      };

      materials.push(material);
    }

    return materials;
  }

  private generateId(raindropId: number): string {
    return `bookmark-${raindropId}`;
  }
}
