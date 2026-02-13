/**
 * Base collector abstract class
 */

import { createLogger, type Logger, type Material } from '@content-forge/core';

export interface CollectorConfig {
  name: string;
  source: string;
  intervalMs: number;
}

export interface CollectorError {
  collector: string;
  message: string;
  cause?: unknown;
}

export abstract class BaseCollector {
  protected config: CollectorConfig;
  protected logger: Logger;

  constructor(config: CollectorConfig) {
    this.config = config;
    this.logger = createLogger({ agentId: `collector:${config.name}` });
  }

  /**
   * Collect materials from the source
   */
  abstract collect(): Promise<Result<Material[], CollectorError>>;

  /**
   * Deduplicate materials by URL
   */
  protected deduplicate(materials: Material[]): Material[] {
    const seen = new Set<string>();
    const deduplicated: Material[] = [];

    for (const material of materials) {
      const normalizedUrl = this.normalizeUrl(material.url);
      if (!seen.has(normalizedUrl)) {
        seen.add(normalizedUrl);
        deduplicated.push(material);
      }
    }

    this.logger.info('deduplicate', {
      before: materials.length,
      after: deduplicated.length,
      removed: materials.length - deduplicated.length,
    });

    return deduplicated;
  }

  /**
   * Normalize URL for comparison
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove trailing slash, convert to lowercase
      return parsed.href.toLowerCase().replace(/\/$/, '');
    } catch {
      return url.toLowerCase();
    }
  }
}

// Re-export Result type for convenience
import type { Result } from '@content-forge/core';
export type { Result };
