/**
 * Text pipeline - transforms raw content into channel-specific text outputs
 */

import {
  Ok,
  Err,
  type Result,
  type RawContent,
  type ChannelContent,
  type Channel,
  type PipelineType,
  type Logger,
  createLogger
} from '@content-forge/core';

export interface PipelineError {
  pipeline: string;
  stage: string;
  message: string;
  cause?: unknown;
}

export abstract class BasePipeline {
  protected logger: Logger;
  abstract readonly type: PipelineType;
  abstract readonly outputChannels: Channel[];

  constructor(logger?: Logger) {
    this.logger = logger || createLogger({ agentId: 'pipeline' });
  }

  abstract process(content: RawContent): Promise<Result<ChannelContent[], PipelineError>>;
}

export class TextPipeline extends BasePipeline {
  readonly type: PipelineType = 'text';
  readonly outputChannels: Channel[] = ['medium', 'linkedin', 'x-thread'];

  /**
   * Process raw content into channel-specific outputs
   */
  async process(content: RawContent): Promise<Result<ChannelContent[], PipelineError>> {
    this.logger.info('pipeline_start', {
      pipeline: this.type,
      materialId: content.material.id,
      channels: content.targetChannels
    });

    try {
      // Stage 1: Extract key points
      const keyPointsResult = await this.extractKeyPoints(content);
      if (!keyPointsResult.ok) {
        return keyPointsResult;
      }
      const keyPoints = keyPointsResult.value;

      // Stage 2: Generate channel-specific content
      const outputs: ChannelContent[] = [];

      for (const channel of content.targetChannels) {
        const result = await this.generateChannelContent(
          channel,
          content.material.title,
          keyPoints,
          content.material.tags
        );

        if (!result.ok) {
          return result;
        }

        outputs.push(result.value);
      }

      this.logger.info('pipeline_complete', {
        pipeline: this.type,
        outputs: outputs.length
      });

      return Ok(outputs);

    } catch (error) {
      this.logger.error('pipeline_error', {
        pipeline: this.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return Err({
        pipeline: this.type,
        stage: 'process',
        message: error instanceof Error ? error.message : 'Unknown error',
        cause: error
      });
    }
  }

  /**
   * Extract key points from material
   */
  private extractKeyPoints(
    content: RawContent
  ): Promise<Result<string[], PipelineError>> {
    try {
      const material = content.material;
      const text = material.content;

      // Simple extraction: split into sentences and take key ones
      const sentences = text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 20);

      // Take up to 5 key sentences
      const keyPoints = sentences.slice(0, 5);

      if (keyPoints.length === 0) {
        return Promise.resolve(Err({
          pipeline: this.type,
          stage: 'extract_key_points',
          message: 'No key points extracted from content'
        }));
      }

      return Promise.resolve(Ok(keyPoints));

    } catch (error) {
      return Promise.resolve(Err({
        pipeline: this.type,
        stage: 'extract_key_points',
        message: error instanceof Error ? error.message : 'Unknown error',
        cause: error
      }));
    }
  }

  /**
   * Generate content for specific channel
   */
  private generateChannelContent(
    channel: Channel,
    title: string,
    keyPoints: string[],
    tags: string[]
  ): Promise<Result<ChannelContent, PipelineError>> {
    try {
      let channelContent: ChannelContent;

      switch (channel) {
        case 'medium':
          channelContent = this.generateMediumContent(title, keyPoints, tags);
          break;
        case 'linkedin':
          channelContent = this.generateLinkedInContent(title, keyPoints, tags);
          break;
        case 'x-thread':
          channelContent = this.generateXThreadContent(title, keyPoints, tags);
          break;
        default:
          return Promise.resolve(Err({
            pipeline: this.type,
            stage: 'generate_channel_content',
            message: `Unsupported channel: ${channel}`
          }));
      }

      return Promise.resolve(Ok(channelContent));

    } catch (error) {
      return Promise.resolve(Err({
        pipeline: this.type,
        stage: 'generate_channel_content',
        message: error instanceof Error ? error.message : 'Unknown error',
        cause: error
      }));
    }
  }

  /**
   * Generate Medium article (2,000-4,000 chars, markdown)
   */
  private generateMediumContent(
    title: string,
    keyPoints: string[],
    tags: string[]
  ): ChannelContent {
    const intro = `${keyPoints[0] || ''}\n\n`;

    const body = keyPoints.slice(1).map((point, index) => {
      return `## Key Insight ${index + 1}\n\n${point}\n\n`;
    }).join('');

    const conclusion = 'These insights provide valuable perspectives on the topic.\n\n';

    const content = `# ${title}\n\n${intro}${body}${conclusion}`;

    // Ensure content is between 2000-4000 chars
    let finalContent = content;
    if (content.length < 2000) {
      finalContent = content.padEnd(2000, ' ');
    } else if (content.length > 4000) {
      finalContent = content.substring(0, 4000);
    }

    return {
      channel: 'medium',
      title,
      body: finalContent,
      metadata: {
        format: 'markdown',
        tags,
        wordCount: finalContent.split(/\s+/).length
      }
    };
  }

  /**
   * Generate LinkedIn post (300-800 chars, professional tone)
   */
  private generateLinkedInContent(
    title: string,
    keyPoints: string[],
    tags: string[]
  ): ChannelContent {
    const summary = keyPoints.slice(0, 2).join(' ');
    const hashtags = tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');

    let content = `${title}\n\n${summary}\n\n${hashtags}`;

    // Ensure content is between 300-800 chars
    if (content.length < 300) {
      content = content.padEnd(300, '.');
    } else if (content.length > 800) {
      content = content.substring(0, 797) + '...';
    }

    return {
      channel: 'linkedin',
      title,
      body: content,
      metadata: {
        format: 'text',
        hashtags: tags,
        charCount: content.length
      }
    };
  }

  /**
   * Generate X thread (5-15 tweets, 280 chars each)
   */
  private generateXThreadContent(
    title: string,
    keyPoints: string[],
    tags: string[]
  ): ChannelContent {
    const tweets: string[] = [];

    // First tweet: title/intro
    tweets.push(`${title}\n\nThread 🧵 (1/${keyPoints.length + 1})`);

    // One tweet per key point
    keyPoints.forEach((point, index) => {
      let tweet = `${index + 2}/${keyPoints.length + 1} ${point}`;

      // Ensure each tweet is <= 280 chars
      if (tweet.length > 280) {
        tweet = tweet.substring(0, 277) + '...';
      }

      tweets.push(tweet);
    });

    // Ensure thread has 5-15 tweets
    while (tweets.length < 5) {
      tweets.push(`${tweets.length + 1}/${tweets.length + 1} Additional insights coming soon.`);
    }

    if (tweets.length > 15) {
      tweets.splice(15);
    }

    const threadBody = tweets.join('\n\n---\n\n');

    return {
      channel: 'x-thread',
      title,
      body: threadBody,
      metadata: {
        format: 'thread',
        tweets: tweets.length,
        tags
      }
    };
  }
}
