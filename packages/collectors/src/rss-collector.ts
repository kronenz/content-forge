/**
 * RSS feed collector
 */

import Parser from 'rss-parser';
import { Ok, Err, type Material } from '@content-forge/core';
import { BaseCollector, type CollectorConfig, type CollectorError, type Result } from './base-collector.js';

export interface RssCollectorConfig extends CollectorConfig {
  feedUrls: string[];
}

export class RssCollector extends BaseCollector {
  private feedUrls: string[];
  private parser: Parser;

  constructor(config: RssCollectorConfig) {
    super(config);
    this.feedUrls = config.feedUrls;
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'ContentForge/1.0',
      },
    });
  }

  async collect(): Promise<Result<Material[], CollectorError>> {
    try {
      this.logger.info('collect_start', { feedCount: this.feedUrls.length });

      const allMaterials: Material[] = [];

      for (const feedUrl of this.feedUrls) {
        try {
          const feed = await this.parser.parseURL(feedUrl);
          const materials = this.feedToMaterials(feed);
          allMaterials.push(...materials);

          this.logger.info('feed_parsed', {
            feedUrl,
            itemCount: feed.items?.length || 0,
            materialCount: materials.length,
          });
        } catch (error) {
          this.logger.warn('feed_parse_failed', {
            feedUrl,
            error: error instanceof Error ? error.message : String(error),
          });
          // Continue with other feeds
        }
      }

      const deduplicated = this.deduplicate(allMaterials);

      this.logger.info('collect_complete', {
        totalMaterials: deduplicated.length,
      });

      return Ok(deduplicated);
    } catch (error) {
      this.logger.error('collect_failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      return Err({
        collector: this.config.name,
        message: 'Failed to collect RSS feeds',
        cause: error,
      });
    }
  }

  private feedToMaterials(feed: Parser.Output<Record<string, unknown>>): Material[] {
    const materials: Material[] = [];

    for (const item of feed.items || []) {
      if (!item.link || !item.title) {
        continue;
      }

      const material: Material = {
        id: this.generateId(item.link),
        source: this.config.source,
        url: item.link,
        title: item.title,
        content: this.extractContent(item),
        score: 0, // Will be scored separately
        tags: this.extractTags(item),
        status: 'new',
        collectedAt: new Date(),
        createdAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      };

      materials.push(material);
    }

    return materials;
  }

  private extractContent(item: Parser.Item): string {
    // Prefer content:encoded, then content, then summary, then description
    const encoded = (item as Record<string, unknown>)['content:encoded'];
    const content = (typeof encoded === 'string' ? encoded : '') || item.content || item.summary || item.contentSnippet || '';

    if (typeof content === 'string') {
      return this.stripHtml(content);
    }

    return '';
  }

  private extractTags(item: Parser.Item): string[] {
    const tags: string[] = [];

    if (item.categories) {
      tags.push(...item.categories);
    }

    return tags;
  }

  private stripHtml(html: string): string {
    // Simple HTML tag removal
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  private generateId(url: string): string {
    // Simple hash function for ID generation
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `rss-${Math.abs(hash).toString(36)}`;
  }
}
