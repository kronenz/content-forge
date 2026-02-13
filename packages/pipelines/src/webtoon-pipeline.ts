/**
 * Webtoon pipeline - transforms raw content into webtoon strip format
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

/**
 * Single panel in a webtoon strip
 */
export interface WebtoonPanel {
  order: number;
  imagePrompt: string;
  dialogue: string;
  narration: string;
  imageUrl?: string;
}

/**
 * Configuration for webtoon generation
 */
export interface WebtoonConfig {
  panelCount?: number; // 4-8, default 6
  style?: 'manga' | 'manhwa' | 'comic'; // default 'manhwa'
  width?: number; // pixel width, default 800
}

const DEFAULT_WEBTOON_CONFIG: Required<WebtoonConfig> = {
  panelCount: 6,
  style: 'manhwa',
  width: 800
};

export class WebtoonPipeline extends BasePipeline {
  readonly type: PipelineType = 'webtoon';
  readonly outputChannels: Channel[] = ['webtoon'];
  private webtoonConfig: Required<WebtoonConfig>;

  constructor(config?: WebtoonConfig, logger?: Logger) {
    super(logger);
    this.webtoonConfig = {
      ...DEFAULT_WEBTOON_CONFIG,
      ...config
    };

    // Clamp panel count to 4-8
    this.webtoonConfig.panelCount = Math.max(4, Math.min(8, this.webtoonConfig.panelCount));
  }

  /**
   * Process raw content into webtoon strip format
   */
  async process(content: RawContent): Promise<Result<ChannelContent[], PipelineError>> {
    this.logger.info('pipeline_start', {
      pipeline: this.type,
      materialId: content.material.id,
      channels: content.targetChannels
    });

    try {
      // Stage 1: Extract scenario from material
      const scenarioResult = await this.extractScenario(content);
      if (!scenarioResult.ok) {
        return scenarioResult;
      }
      const keyPoints = scenarioResult.value;

      // Stage 2: Generate panel descriptions
      const panelsResult = await this.generatePanels(keyPoints, content.material.title);
      if (!panelsResult.ok) {
        return panelsResult;
      }
      const panels = panelsResult.value;

      // Stage 3: Generate image prompts for ComfyUI
      const promptedPanels = this.generateImagePrompts(panels);

      // Stage 4: Assemble into webtoon strip format (vertical scroll)
      const outputs: ChannelContent[] = [];

      for (const channel of content.targetChannels) {
        if (channel !== 'webtoon') {
          return Err({
            pipeline: this.type,
            stage: 'assemble',
            message: `Unsupported channel: ${channel}`
          });
        }

        const assembled = this.assembleStrip(
          content.material.title,
          promptedPanels,
          content.material.tags
        );
        outputs.push(assembled);
      }

      this.logger.info('pipeline_complete', {
        pipeline: this.type,
        outputs: outputs.length,
        panelCount: promptedPanels.length
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
   * Stage 1: Extract scenario key points from material content
   */
  private extractScenario(
    content: RawContent
  ): Promise<Result<string[], PipelineError>> {
    try {
      const text = content.material.content;

      // Split into sentences and filter meaningful ones
      const sentences = text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 20);

      // Take up to panelCount * 2 sentences for panel generation
      const keyPoints = sentences.slice(0, this.webtoonConfig.panelCount * 2);

      if (keyPoints.length === 0) {
        return Promise.resolve(Err({
          pipeline: this.type,
          stage: 'extract_scenario',
          message: 'No key points extracted from content'
        }));
      }

      return Promise.resolve(Ok(keyPoints));

    } catch (error) {
      return Promise.resolve(Err({
        pipeline: this.type,
        stage: 'extract_scenario',
        message: error instanceof Error ? error.message : 'Unknown error',
        cause: error
      }));
    }
  }

  /**
   * Stage 2: Generate panel descriptions with scene, dialogue, and visual prompt
   */
  private generatePanels(
    keyPoints: string[],
    title: string
  ): Promise<Result<WebtoonPanel[], PipelineError>> {
    try {
      const panels: WebtoonPanel[] = [];
      const targetCount = this.webtoonConfig.panelCount;

      // Distribute key points across panels
      for (let i = 0; i < targetCount; i++) {
        const pointIndex = Math.min(i, keyPoints.length - 1);
        const point = keyPoints[pointIndex] || title;

        // Split point into dialogue and narration
        const words = point.split(/\s+/);
        const midPoint = Math.floor(words.length / 2);

        const dialogue = words.slice(0, midPoint).join(' ');
        const narration = words.slice(midPoint).join(' ');

        panels.push({
          order: i + 1,
          imagePrompt: '', // Will be filled in Stage 3
          dialogue: dialogue || point,
          narration: narration || ''
        });
      }

      if (panels.length === 0) {
        return Promise.resolve(Err({
          pipeline: this.type,
          stage: 'generate_panels',
          message: 'Failed to generate any panels'
        }));
      }

      return Promise.resolve(Ok(panels));

    } catch (error) {
      return Promise.resolve(Err({
        pipeline: this.type,
        stage: 'generate_panels',
        message: error instanceof Error ? error.message : 'Unknown error',
        cause: error
      }));
    }
  }

  /**
   * Stage 3: Generate ComfyUI-compatible image prompts for each panel
   */
  private generateImagePrompts(panels: WebtoonPanel[]): WebtoonPanel[] {
    const styleMap: Record<string, string> = {
      manga: 'manga style, black and white, screentone shading, Japanese comic art',
      manhwa: 'manhwa style, full color, Korean webtoon art, clean lineart, digital painting',
      comic: 'western comic style, bold outlines, vibrant colors, dynamic composition'
    };

    const stylePrefix = styleMap[this.webtoonConfig.style] || styleMap.manhwa;

    return panels.map(panel => ({
      ...panel,
      imagePrompt: `${stylePrefix}, vertical panel layout, ${panel.dialogue}. ${panel.narration}. high quality, detailed background, expressive characters`.trim()
    }));
  }

  /**
   * Stage 4: Assemble panels into vertical scroll webtoon strip
   */
  private assembleStrip(
    title: string,
    panels: WebtoonPanel[],
    tags: string[]
  ): ChannelContent {
    // Build vertical scroll body: each panel separated by double newline
    const panelTexts = panels.map(panel => {
      const parts: string[] = [];
      parts.push(`[Panel ${panel.order}/${panels.length}]`);

      if (panel.narration) {
        parts.push(`Narration: ${panel.narration}`);
      }

      if (panel.dialogue) {
        parts.push(`Dialogue: "${panel.dialogue}"`);
      }

      return parts.join('\n');
    });

    const body = panelTexts.join('\n\n---\n\n');

    return {
      channel: 'webtoon',
      title,
      body,
      metadata: {
        format: 'vertical-scroll',
        style: this.webtoonConfig.style,
        width: this.webtoonConfig.width,
        panelCount: panels.length,
        panels,
        tags
      }
    };
  }
}
