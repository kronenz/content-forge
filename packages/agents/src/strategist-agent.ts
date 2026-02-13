/**
 * Strategist Agent - selects materials and assigns pipelines
 */

import { Ok, Err, type Result, type Task, type Material, type PipelineType } from '@content-forge/core';
import { BaseAgent } from './base-agent.js';
import type { AgentError, TaskOutput } from './types.js';

interface StrategistInput {
  materials: Material[];
  limit?: number;
}

interface SelectedMaterial {
  material: Material;
  pipeline: PipelineType;
}

interface StrategistOutput {
  selectedMaterials: SelectedMaterial[];
}

export class StrategistAgent extends BaseAgent {
  /**
   * Execute material selection and pipeline assignment
   */
  protected async execute(task: Task): Promise<Result<TaskOutput, AgentError>> {
    await Promise.resolve();
    try {
      // Validate input
      const input = task.input as unknown as StrategistInput;

      if (!input.materials || !Array.isArray(input.materials)) {
        return Err({
          agent: this.name,
          message: 'Invalid input: materials array is required',
        });
      }

      const limit = input.limit ?? 10;

      // Score and rank materials
      const scoredMaterials = this.scoreMaterials(input.materials);

      // Select top materials
      const selectedMaterials = scoredMaterials
        .slice(0, limit)
        .map(material => ({
          material,
          pipeline: this.assignPipeline(material),
        }));

      const output: StrategistOutput = {
        selectedMaterials,
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
   * Score and rank materials by relevance
   */
  private scoreMaterials(materials: Material[]): Material[] {
    return materials
      .map(material => ({
        ...material,
        // Calculate composite score
        compositeScore: this.calculateScore(material),
      }))
      .sort((a, b) => b.compositeScore - a.compositeScore);
  }

  /**
   * Calculate composite score for a material
   */
  private calculateScore(material: Material): number {
    let score = material.score; // Base score from material (1-10)

    // Bonus for recent content (up to +2)
    const daysSinceCollected = (Date.now() - material.collectedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCollected < 7) {
      score += 2;
    } else if (daysSinceCollected < 30) {
      score += 1;
    }

    // Bonus for rich tags (up to +1)
    if (material.tags.length >= 3) {
      score += 1;
    } else if (material.tags.length >= 1) {
      score += 0.5;
    }

    return score;
  }

  /**
   * Assign pipeline type based on material characteristics
   */
  private assignPipeline(material: Material): PipelineType {
    const contentLength = material.content.length;

    // Longform for detailed content
    if (contentLength > 3000) {
      return 'longform';
    }

    // Thread for medium-length, structured content
    if (contentLength > 1000) {
      return 'thread';
    }

    // Shortform for concise content
    if (contentLength > 300) {
      return 'shortform';
    }

    // Snackable for very short content
    return 'snackable';
  }
}
