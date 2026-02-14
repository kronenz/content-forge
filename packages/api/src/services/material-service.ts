/**
 * Material service — orchestrates collectors, dedup, scoring, and DB persistence.
 */

import { Ok, Err, createLogger } from '@content-forge/core';
import type { Material } from '@content-forge/core';
import type { Result } from '@content-forge/core';
import type { Repositories, DbError } from '@content-forge/db';
import type { AppConfig } from '../config.js';
import {
  RssCollector,
  TrendCollector,
  BookmarkCollector,
  deduplicateMaterials,
  scoreMaterials as scoreWithCriteria,
} from '@content-forge/collectors';
import type { ScoringCriteria } from '@content-forge/collectors';

const logger = createLogger({ agentId: 'material-service' });

export class MaterialService {
  private readonly repos: Repositories;
  private readonly config: AppConfig;

  constructor(repos: Repositories, config: AppConfig) {
    this.repos = repos;
    this.config = config;
  }

  async collectMaterials(sources?: readonly string[]): Promise<Result<Material[], DbError>> {
    const requested = sources && sources.length > 0
      ? sources
      : ['rss', 'trend', 'bookmark'];

    const collectors = this.createCollectors(requested);

    if (collectors.length === 0) {
      return Ok([]);
    }

    // Collect in parallel
    const results = await Promise.allSettled(
      collectors.map((c) => c.collect()),
    );

    const allMaterials: Material[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.ok) {
        allMaterials.push(...result.value.value);
      } else if (result.status === 'fulfilled' && !result.value.ok) {
        logger.warn('collector_error', { error: result.value.error.message });
      } else if (result.status === 'rejected') {
        logger.warn('collector_rejected', { error: String(result.reason) });
      }
    }

    // Deduplicate across all sources
    const deduplicated = deduplicateMaterials(allMaterials);

    // Persist to DB
    const saved: Material[] = [];
    for (const material of deduplicated) {
      const createResult = await this.repos.materials.create({
        source: material.source,
        url: material.url,
        title: material.title,
        content: material.content,
        score: material.score,
        tags: material.tags,
        status: material.status,
        collectedAt: material.collectedAt,
      });

      if (createResult.ok) {
        saved.push(createResult.value);
      } else {
        logger.warn('material_save_failed', {
          url: material.url,
          error: createResult.error.message,
        });
      }
    }

    logger.info('collect_complete', {
      requested: requested.length,
      collected: allMaterials.length,
      deduplicated: deduplicated.length,
      saved: saved.length,
    });

    return Ok(saved);
  }

  async scoreMaterials(materialIds?: readonly string[]): Promise<Result<Material[], DbError>> {
    // Fetch materials to score
    let materials: Material[];

    if (materialIds && materialIds.length > 0) {
      const fetched: Material[] = [];
      for (const id of materialIds) {
        const result = await this.repos.materials.findById(id);
        if (result.ok && result.value !== null) {
          fetched.push(result.value);
        }
      }
      materials = fetched;
    } else {
      const result = await this.repos.materials.findAll({ status: 'new' });
      if (!result.ok) {
        return Err(result.error);
      }
      materials = result.value.data;
    }

    if (materials.length === 0) {
      return Ok([]);
    }

    // Build scoring criteria from config
    const criteria: ScoringCriteria = {
      relevanceKeywords: this.config.SCORING_KEYWORDS
        ? this.config.SCORING_KEYWORDS.split(',').map((k) => k.trim()).filter(Boolean)
        : [],
      minLength: 100,
      preferredSources: ['rss', 'bookmark'],
    };

    // Score materials
    const scoreResult = scoreWithCriteria(materials, criteria);
    if (!scoreResult.ok) {
      return Err({ code: 'SCORING_FAILED', message: scoreResult.error.message });
    }

    // Persist scored materials to DB
    const updated: Material[] = [];
    for (const scored of scoreResult.value) {
      const updateResult = await this.repos.materials.update(scored.id, {
        score: scored.score,
        status: scored.status,
      });

      if (updateResult.ok) {
        updated.push(updateResult.value);
      } else {
        logger.warn('material_update_failed', {
          id: scored.id,
          error: updateResult.error.message,
        });
      }
    }

    logger.info('score_complete', {
      total: materials.length,
      updated: updated.length,
    });

    return Ok(updated);
  }

  private createCollectors(sources: readonly string[]) {
    const collectors = [];

    for (const source of sources) {
      switch (source) {
        case 'rss': {
          const feedUrls = this.config.RSS_FEED_URLS
            ? this.config.RSS_FEED_URLS.split(',').map((u) => u.trim()).filter(Boolean)
            : [];
          if (feedUrls.length > 0) {
            collectors.push(new RssCollector({
              name: 'rss',
              source: 'rss',
              intervalMs: 0,
              feedUrls,
            }));
          }
          break;
        }
        case 'trend': {
          collectors.push(new TrendCollector({
            name: 'trend',
            source: 'trend',
            intervalMs: 0,
            geo: this.config.TREND_GEO,
          }));
          break;
        }
        case 'bookmark': {
          if (this.config.RAINDROP_API_KEY) {
            collectors.push(new BookmarkCollector({
              name: 'bookmark',
              source: 'bookmark',
              intervalMs: 0,
              apiToken: this.config.RAINDROP_API_KEY,
            }));
          }
          break;
        }
        default:
          logger.warn('unknown_source', { source });
      }
    }

    return collectors;
  }
}
