/**
 * Guardian Agent - validates content for tone and compliance
 */

import { Ok, Err, type Result, type Task, type ChannelContent, type Channel } from '@content-forge/core';
import { BaseAgent } from './base-agent.js';
import type { AgentError, TaskOutput } from './types.js';

interface GuardianInput {
  content: ChannelContent;
}

interface GuardianOutput {
  approved: boolean;
  feedback: string[];
  content: ChannelContent;
}

// Channel content length limits
const CHANNEL_LIMITS: Record<Channel, { min: number; max: number }> = {
  'medium': { min: 2000, max: 4000 },
  'linkedin': { min: 300, max: 800 },
  'x-thread': { min: 50, max: 280 },
  'brunch': { min: 2000, max: 5000 },
  'newsletter': { min: 1000, max: 20000 },
  'blog': { min: 1500, max: 15000 },
  'threads': { min: 100, max: 500 },
  'kakao': { min: 200, max: 2000 },
  'youtube': { min: 500, max: 5000 },
  'shorts': { min: 50, max: 500 },
  'reels': { min: 50, max: 500 },
  'tiktok': { min: 50, max: 500 },
  'ig-carousel': { min: 300, max: 2200 },
  'ig-single': { min: 100, max: 2200 },
  'ig-story': { min: 10, max: 100 },
  'webtoon': { min: 500, max: 1000 },
};

// Prohibited patterns (basic validation)
const PROHIBITED_PATTERNS = [
  /\b(spam|scam|fake)\b/i,
  /\b(hate|violence|abuse)\b/i,
  /\b(illegal|fraud)\b/i,
];

export class GuardianAgent extends BaseAgent {
  /**
   * Execute content validation
   */
  protected async execute(task: Task): Promise<Result<TaskOutput, AgentError>> {
    await Promise.resolve();
    try {
      // Validate input
      const input = task.input as unknown as GuardianInput;

      if (!input.content) {
        return Err({
          agent: this.name,
          message: 'Invalid input: content is required',
        });
      }

      // Validate the content
      const validation = this.validateContent(input.content);

      const output: GuardianOutput = {
        approved: validation.approved,
        feedback: validation.feedback,
        content: input.content,
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
   * Validate content against channel requirements and policies
   */
  private validateContent(content: ChannelContent): { approved: boolean; feedback: string[] } {
    const feedback: string[] = [];
    let approved = true;

    // Check length constraints
    const limits = CHANNEL_LIMITS[content.channel];
    const bodyLength = content.body.length;

    if (bodyLength < limits.min) {
      feedback.push(`Content too short: ${bodyLength} chars (minimum ${limits.min})`);
      approved = false;
    }

    if (bodyLength > limits.max) {
      feedback.push(`Content too long: ${bodyLength} chars (maximum ${limits.max})`);
      approved = false;
    }

    // Check for prohibited patterns
    for (const pattern of PROHIBITED_PATTERNS) {
      if (pattern.test(content.body)) {
        feedback.push(`Prohibited content detected: ${pattern.source}`);
        approved = false;
      }
      if (pattern.test(content.title)) {
        feedback.push(`Prohibited content in title: ${pattern.source}`);
        approved = false;
      }
    }

    // Check for empty content
    if (!content.body.trim()) {
      feedback.push('Content body is empty');
      approved = false;
    }

    if (!content.title.trim()) {
      feedback.push('Content title is empty');
      approved = false;
    }

    // Check title length
    if (content.title.length > 200) {
      feedback.push(`Title too long: ${content.title.length} chars (maximum 200)`);
      approved = false;
    }

    // If all checks pass
    if (approved) {
      feedback.push('Content approved');
    }

    return { approved, feedback };
  }
}
