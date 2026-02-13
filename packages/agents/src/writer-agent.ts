/**
 * Writer Agent - transforms content for specific channels
 */

import { Ok, Err, type Result, type Task, type Material, type Channel, type ChannelContent } from '@content-forge/core';
import { BaseAgent } from './base-agent.js';
import type { AgentError, TaskOutput } from './types.js';

interface WriterInput {
  material: Material;
  channel: Channel;
}

interface WriterOutput {
  content: ChannelContent;
}

// Channel specifications
const CHANNEL_SPECS: Record<Channel, { maxLength: number; format: string }> = {
  'medium': { maxLength: 10000, format: 'markdown' },
  'linkedin': { maxLength: 3000, format: 'text' },
  'x-thread': { maxLength: 280, format: 'text' },
  'brunch': { maxLength: 10000, format: 'markdown' },
  'newsletter': { maxLength: 20000, format: 'html' },
  'blog': { maxLength: 15000, format: 'markdown' },
  'threads': { maxLength: 500, format: 'text' },
  'kakao': { maxLength: 2000, format: 'text' },
  'youtube': { maxLength: 5000, format: 'text' },
  'shorts': { maxLength: 500, format: 'text' },
  'reels': { maxLength: 500, format: 'text' },
  'tiktok': { maxLength: 500, format: 'text' },
  'ig-carousel': { maxLength: 2200, format: 'text' },
  'ig-single': { maxLength: 2200, format: 'text' },
  'ig-story': { maxLength: 100, format: 'text' },
  'webtoon': { maxLength: 1000, format: 'script' },
};

export class WriterAgent extends BaseAgent {
  /**
   * Execute content transformation for a channel
   */
  protected async execute(task: Task): Promise<Result<TaskOutput, AgentError>> {
    await Promise.resolve();
    try {
      // Validate input
      const input = task.input as unknown as WriterInput;

      if (!input.material) {
        return Err({
          agent: this.name,
          message: 'Invalid input: material is required',
        });
      }

      if (!input.channel) {
        return Err({
          agent: this.name,
          message: 'Invalid input: channel is required',
        });
      }

      // Transform content for the channel
      const content = this.transformContent(input.material, input.channel);

      const output: WriterOutput = {
        content,
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
   * Transform material content for a specific channel
   */
  private transformContent(material: Material, channel: Channel): ChannelContent {
    const spec = CHANNEL_SPECS[channel];

    // Generate title (truncate if needed)
    let title = material.title;
    if (title.length > 100) {
      title = title.substring(0, 97) + '...';
    }

    // Transform body based on channel
    let body = material.content;

    // Truncate if needed
    if (body.length > spec.maxLength) {
      body = body.substring(0, spec.maxLength - 3) + '...';
    }

    // Apply channel-specific formatting
    body = this.applyChannelFormatting(body, channel, spec.format);

    // Generate metadata
    const metadata: Record<string, unknown> = {
      source: material.source,
      sourceUrl: material.url,
      tags: material.tags,
      format: spec.format,
    };

    return {
      channel,
      title,
      body,
      metadata,
    };
  }

  /**
   * Apply channel-specific formatting
   */
  private applyChannelFormatting(content: string, channel: Channel, _format: string): string {
    // For MVP: simple formatting rules

    // Remove excessive whitespace
    let formatted = content.replace(/\n{3,}/g, '\n\n').trim();

    // Channel-specific tweaks
    switch (channel) {
      case 'x-thread':
        // Single tweet format - very concise
        formatted = formatted.split('\n')[0] ?? ''; // First paragraph only
        break;

      case 'linkedin':
        // Professional tone - add line breaks for readability
        formatted = formatted.replace(/\. /g, '.\n\n');
        break;

      case 'medium':
      case 'brunch':
      case 'blog':
        // Keep markdown formatting
        break;

      case 'ig-story':
        // Ultra-short format
        formatted = formatted.split('.')[0] ?? '';
        break;

      default:
        // Standard text formatting
        break;
    }

    return formatted;
  }
}
