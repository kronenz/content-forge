/**
 * Publisher Agent - automated multi-channel publishing orchestrator
 */

import { Ok, Err, type Result, type Task, type ChannelContent, type Channel } from '@content-forge/core';
import { BaseAgent } from './base-agent.js';
import type { AgentError, TaskOutput } from './types.js';

interface PublisherInput {
  contents: ChannelContent[];
  channels: Channel[];
}

interface PublishChannelResult {
  channel: Channel;
  success: boolean;
  externalUrl?: string;
  error?: string;
}

interface PublisherOutput {
  results: PublishChannelResult[];
  successCount: number;
  failureCount: number;
}

export class PublisherAgent extends BaseAgent {
  /**
   * Execute multi-channel publishing
   */
  protected async execute(task: Task): Promise<Result<TaskOutput, AgentError>> {
    await Promise.resolve();
    try {
      // Validate input
      const input = task.input as unknown as PublisherInput;

      if (!input.contents || !Array.isArray(input.contents)) {
        return Err({
          agent: this.name,
          message: 'Invalid input: contents array is required',
        });
      }

      if (!input.channels || !Array.isArray(input.channels)) {
        return Err({
          agent: this.name,
          message: 'Invalid input: channels array is required',
        });
      }

      if (input.channels.length === 0) {
        return Err({
          agent: this.name,
          message: 'Invalid input: channels array must not be empty',
        });
      }

      // Publish to each channel
      const results = this.publishToChannels(input.contents, input.channels);

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      const output: PublisherOutput = {
        results,
        successCount,
        failureCount,
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
   * Publish content to multiple channels
   */
  private publishToChannels(contents: ChannelContent[], channels: Channel[]): PublishChannelResult[] {
    const results: PublishChannelResult[] = [];

    for (const channel of channels) {
      // Find matching content for this channel
      const content = contents.find(c => c.channel === channel);

      if (!content) {
        results.push({
          channel,
          success: false,
          error: `No content available for channel: ${channel}`,
        });
        continue;
      }

      // Validate content before publishing
      const validation = this.validateForPublishing(content, channel);
      if (!validation.valid) {
        results.push({
          channel,
          success: false,
          error: validation.error ?? 'Validation failed',
        });
        continue;
      }

      // Simulate publishing
      const result = this.simulatePublish(content, channel);
      results.push(result);
    }

    return results;
  }

  /**
   * Validate content is suitable for publishing to a channel
   */
  private validateForPublishing(content: ChannelContent, channel: Channel): { valid: boolean; error?: string } {
    if (!content.body || content.body.trim().length === 0) {
      return { valid: false, error: `Empty content body for channel: ${channel}` };
    }

    if (!content.title || content.title.trim().length === 0) {
      return { valid: false, error: `Empty content title for channel: ${channel}` };
    }

    return { valid: true };
  }

  /**
   * Simulate publishing content to a channel
   */
  private simulatePublish(_content: ChannelContent, channel: Channel): PublishChannelResult {
    // Generate a simulated external URL
    const externalId = `pub-${channel}-${Date.now()}`;
    const externalUrl = `https://${channel}.example.com/${externalId}`;

    return {
      channel,
      success: true,
      externalUrl,
    };
  }
}
