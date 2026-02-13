/**
 * Google Trends collector
 */

import Parser from 'rss-parser';
import { Ok, Err, type Material } from '@content-forge/core';
import { BaseCollector, type CollectorConfig, type CollectorError, type Result } from './base-collector.js';

export interface TrendCollectorConfig extends CollectorConfig {
  geo?: string; // Country code (default: KR)
}

export class TrendCollector extends BaseCollector {
  private geo: string;
  private parser: Parser;

  constructor(config: TrendCollectorConfig) {
    super(config);
    this.geo = config.geo || 'KR';
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'ContentForge/1.0',
      },
    });
  }

  async collect(): Promise<Result<Material[], CollectorError>> {
    try {
      const feedUrl = `https://trends.google.com/trending/rss?geo=${this.geo}`;

      this.logger.info('collect_start', { geo: this.geo, feedUrl });

      const feed = await this.parser.parseURL(feedUrl);
      const materials = this.feedToMaterials(feed);

      const deduplicated = this.deduplicate(materials);

      this.logger.info('collect_complete', {
        itemCount: feed.items?.length || 0,
        materialCount: deduplicated.length,
      });

      return Ok(deduplicated);
    } catch (error) {
      this.logger.error('collect_failed', {
        geo: this.geo,
        error: error instanceof Error ? error.message : String(error),
      });

      return Err({
        collector: this.config.name,
        message: `Failed to collect trends for ${this.geo}`,
        cause: error,
      });
    }
  }

  private feedToMaterials(feed: Parser.Output<unknown>): Material[] {
    const materials: Material[] = [];

    for (const item of feed.items || []) {
      if (!item.link || !item.title) {
        continue;
      }

      // Extract traffic volume from description if available
      const traffic = this.extractTraffic(item);
      const score = this.calculateScore(traffic);

      const material: Material = {
        id: this.generateId(item.title, item.pubDate),
        source: this.config.source,
        url: item.link,
        title: item.title,
        content: this.extractContent(item),
        score,
        tags: ['trend', `geo:${this.geo}`],
        status: 'new',
        collectedAt: new Date(),
        createdAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      };

      materials.push(material);
    }

    return materials;
  }

  private extractContent(item: Parser.Item): string {
    const content = item.contentSnippet || item.content || item.summary || '';

    if (typeof content === 'string') {
      return this.stripHtml(content);
    }

    return '';
  }

  private extractTraffic(item: Parser.Item): number {
    // Try to extract traffic volume from description
    const desc = item.contentSnippet || item.content || '';

    if (typeof desc !== 'string') {
      return 0;
    }

    // Look for patterns like "50,000+ searches" or "100K+"
    const match = desc.match(/(\d+(?:,\d+)?)\s*(?:K|M|\+)?\s*searches/i);

    if (match && match[1]) {
      const num = parseInt(match[1].replace(/,/g, ''), 10);
      if (desc.includes('K')) return num * 1000;
      if (desc.includes('M')) return num * 1000000;
      return num;
    }

    return 0;
  }

  private calculateScore(traffic: number): number {
    // Simple logarithmic scoring based on traffic
    // 0 traffic = score 5 (default)
    // 1K traffic = score 6
    // 10K traffic = score 7
    // 100K traffic = score 8
    // 1M+ traffic = score 9-10

    if (traffic === 0) return 5;
    if (traffic < 1000) return 5;
    if (traffic < 10000) return 6;
    if (traffic < 100000) return 7;
    if (traffic < 500000) return 8;
    if (traffic < 1000000) return 9;
    return 10;
  }

  private stripHtml(html: string): string {
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

  private generateId(title: string, pubDate?: string): string {
    const input = `${title}-${pubDate || new Date().toISOString()}`;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `trend-${Math.abs(hash).toString(36)}`;
  }
}
