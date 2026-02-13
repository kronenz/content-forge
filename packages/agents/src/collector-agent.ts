/**
 * Collector Agent - schedule-based auto-collection manager
 */

import { Ok, Err, type Result, type Task, type Material } from '@content-forge/core';
import { BaseAgent } from './base-agent.js';
import type { AgentError, TaskOutput } from './types.js';

interface CollectorInput {
  sources: string[];
  keywords?: string[];
  maxItems?: number;
}

interface CollectorOutput {
  materials: Material[];
  totalCollected: number;
  duplicatesRemoved: number;
}

export class CollectorAgent extends BaseAgent {
  /**
   * Execute material collection from multiple sources
   */
  protected async execute(task: Task): Promise<Result<TaskOutput, AgentError>> {
    await Promise.resolve();
    try {
      // Validate input
      const input = task.input as unknown as CollectorInput;

      if (!input.sources || !Array.isArray(input.sources)) {
        return Err({
          agent: this.name,
          message: 'Invalid input: sources array is required',
        });
      }

      if (input.sources.length === 0) {
        return Err({
          agent: this.name,
          message: 'Invalid input: sources array must not be empty',
        });
      }

      const maxItems = input.maxItems ?? 50;
      const keywords = input.keywords ?? [];

      // Collect materials from all sources
      const allMaterials = this.collectFromSources(input.sources, keywords);

      // Deduplicate by URL
      const { unique, duplicatesRemoved } = this.deduplicateMaterials(allMaterials);

      // Apply limit
      const limited = unique.slice(0, maxItems);

      const output: CollectorOutput = {
        materials: limited,
        totalCollected: allMaterials.length,
        duplicatesRemoved,
      };

      return Promise.resolve(Ok({
        agentId: this.id,
        taskId: task.id,
        result: output as unknown as Record<string, unknown>,
        completedAt: new Date(),
      }));
    } catch (err) {
      return Promise.resolve(Err({
        agent: this.name,
        message: `Execution failed: ${String(err)}`,
        cause: err,
      }));
    }
  }

  /**
   * Simulate collecting materials from multiple sources
   */
  private collectFromSources(sources: string[], keywords: string[]): Material[] {
    const materials: Material[] = [];
    const now = new Date();

    for (const source of sources) {
      const sourceMaterials = this.simulateSourceFetch(source, keywords, now);
      materials.push(...sourceMaterials);
    }

    return materials;
  }

  /**
   * Simulate fetching materials from a single source
   */
  private simulateSourceFetch(source: string, keywords: string[], now: Date): Material[] {
    const materials: Material[] = [];
    const sourceType = this.detectSourceType(source);
    const itemCount = sourceType === 'rss' ? 5 : sourceType === 'trends' ? 3 : 2;

    for (let i = 0; i < itemCount; i++) {
      const id = `${source}-${i}`;
      const tags = keywords.length > 0
        ? keywords.slice(0, Math.min(keywords.length, 3))
        : [sourceType];

      materials.push({
        id,
        source,
        url: `https://${source}/item-${i}`,
        title: `Item ${i} from ${source}`,
        content: `Content collected from ${source} (${sourceType}), item ${i}`,
        score: this.calculateInitialScore(sourceType),
        tags,
        status: 'new',
        collectedAt: now,
        createdAt: now,
      });
    }

    return materials;
  }

  /**
   * Detect source type from source string
   */
  private detectSourceType(source: string): 'rss' | 'trends' | 'bookmarks' {
    if (source.includes('rss') || source.includes('feed')) {
      return 'rss';
    }
    if (source.includes('trend')) {
      return 'trends';
    }
    return 'bookmarks';
  }

  /**
   * Calculate initial score based on source type
   */
  private calculateInitialScore(sourceType: string): number {
    switch (sourceType) {
      case 'trends':
        return 7;
      case 'rss':
        return 5;
      case 'bookmarks':
        return 6;
      default:
        return 5;
    }
  }

  /**
   * Remove duplicate materials based on URL
   */
  private deduplicateMaterials(materials: Material[]): { unique: Material[]; duplicatesRemoved: number } {
    const seen = new Set<string>();
    const unique: Material[] = [];

    for (const material of materials) {
      if (!seen.has(material.url)) {
        seen.add(material.url);
        unique.push(material);
      }
    }

    return {
      unique,
      duplicatesRemoved: materials.length - unique.length,
    };
  }
}
