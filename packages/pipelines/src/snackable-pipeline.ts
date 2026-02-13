/**
 * Snackable pipeline - transforms raw content into Instagram-specific outputs
 */

import {
  Ok,
  Err,
  type Result,
  type RawContent,
  type ChannelContent,
  type Channel,
  type PipelineType,
  type Logger
} from '@content-forge/core';
import { BasePipeline, type PipelineError } from './text-pipeline.js';

export class SnackablePipeline extends BasePipeline {
  readonly type: PipelineType = 'snackable';
  readonly outputChannels: Channel[] = ['ig-carousel', 'ig-single', 'ig-story'];

  constructor(logger?: Logger) {
    super(logger);
  }

  /**
   * Process raw content into Instagram channel-specific outputs
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

      // Take up to 10 key sentences for snackable content
      const keyPoints = sentences.slice(0, 10);

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
        case 'ig-carousel':
          channelContent = this.generateCarouselContent(title, keyPoints, tags);
          break;
        case 'ig-single':
          channelContent = this.generateSingleContent(title, keyPoints, tags);
          break;
        case 'ig-story':
          channelContent = this.generateStoryContent(title, keyPoints, tags);
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
   * Generate Instagram carousel content (5-10 slides, ~200 chars each)
   */
  private generateCarouselContent(
    title: string,
    keyPoints: string[],
    tags: string[]
  ): ChannelContent {
    const slides: string[] = [];

    // First slide: title/intro
    slides.push(`${title}\n\nSwipe for key insights`);

    // Generate slides from key points
    for (const point of keyPoints) {
      // Each slide should be ~200 chars
      let slide = point;
      if (slide.length > 200) {
        slide = slide.substring(0, 197) + '...';
      }
      slides.push(slide);
    }

    // Ensure 5-10 slides
    while (slides.length < 5) {
      slides.push(`Follow for more insights on ${tags[0] || 'this topic'}`);
    }

    if (slides.length > 10) {
      slides.splice(10);
    }

    // Add slide numbers
    const numberedSlides = slides.map((slide, index) => {
      return `[${index + 1}/${slides.length}] ${slide}`;
    });

    const body = numberedSlides.join('\n\n---\n\n');

    return {
      channel: 'ig-carousel',
      title,
      body,
      metadata: {
        format: 'carousel',
        slideCount: slides.length,
        tags
      }
    };
  }

  /**
   * Generate Instagram single post content (100-2200 chars caption)
   */
  private generateSingleContent(
    title: string,
    keyPoints: string[],
    tags: string[]
  ): ChannelContent {
    // Extract key insight as caption
    const keyInsight = keyPoints.slice(0, 3).join('\n\n');
    const hashtags = tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');

    let caption = `${title}\n\n${keyInsight}\n\n${hashtags}`;

    // Ensure content is between 100-2200 chars
    if (caption.length < 100) {
      caption = caption.padEnd(100, '.');
    } else if (caption.length > 2200) {
      caption = caption.substring(0, 2197) + '...';
    }

    return {
      channel: 'ig-single',
      title,
      body: caption,
      metadata: {
        format: 'single',
        charCount: caption.length,
        tags
      }
    };
  }

  /**
   * Generate Instagram story content (hook sentence + 3-5 frames)
   */
  private generateStoryContent(
    title: string,
    keyPoints: string[],
    tags: string[]
  ): ChannelContent {
    // Hook sentence: 10-100 chars
    let hook = title;
    if (hook.length > 100) {
      hook = hook.substring(0, 97) + '...';
    }
    if (hook.length < 10) {
      hook = hook.padEnd(10, '!');
    }

    // Generate 3-5 story frames from key points
    const frames: string[] = [];

    for (const point of keyPoints) {
      if (frames.length >= 5) break;

      // Each frame: concise text (10-100 chars)
      let frame = point;
      if (frame.length > 100) {
        frame = frame.substring(0, 97) + '...';
      }
      frames.push(frame);
    }

    // Ensure minimum 3 frames
    while (frames.length < 3) {
      const filler = tags[frames.length % tags.length] || 'More coming soon';
      let frame = `Learn more about ${filler}`;
      if (frame.length > 100) {
        frame = frame.substring(0, 97) + '...';
      }
      frames.push(frame);
    }

    const body = `${hook}\n\n---\n\n${frames.join('\n\n---\n\n')}`;

    return {
      channel: 'ig-story',
      title,
      body,
      metadata: {
        format: 'story',
        hook,
        frameCount: frames.length,
        tags
      }
    };
  }
}
