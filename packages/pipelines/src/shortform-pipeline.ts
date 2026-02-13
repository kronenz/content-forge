/**
 * Shortform video pipeline - creates short-form videos for Shorts, Reels, TikTok
 *
 * Two modes:
 * - Path A (Derivative): Extract highlights from longform VideoScript → re-render 9:16
 * - Path B (Standalone): Generate fresh 60-second script from raw content
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
  type VideoScript,
  type VideoScriptScene,
  VideoScriptSchema,
} from '@content-forge/core';

import { BasePipeline, type PipelineError } from './text-pipeline.js';
import { callClaude, type ClaudeApiConfig } from './claude-api.js';
import { generateTTSBatch, type TTSConfig, type TTSRequest } from './tts-client.js';

export interface ShortformPipelineConfig {
  claude: ClaudeApiConfig;
  tts: TTSConfig;
}

export interface ShortformOptions {
  mode: 'derivative' | 'standalone';
  sourceScript?: VideoScript;  // Required for derivative mode
  maxDurationMs?: number;      // Default: 60000 (60 seconds)
  targetSceneCount?: number;   // Default: 3-5
}

export class ShortformPipeline extends BasePipeline {
  readonly type: PipelineType = 'shortform';
  readonly outputChannels: Channel[] = ['shorts', 'reels', 'tiktok'];

  private config: ShortformPipelineConfig;

  constructor(config: ShortformPipelineConfig, logger?: Logger) {
    super(logger);
    this.config = config;
  }

  /**
   * Process raw content into shortform videos
   */
  async process(content: RawContent): Promise<Result<ChannelContent[], PipelineError>> {
    return this.processWithOptions(content, { mode: 'standalone' });
  }

  /**
   * Process with explicit options (for derivative mode)
   */
  async processWithOptions(
    content: RawContent,
    options: ShortformOptions
  ): Promise<Result<ChannelContent[], PipelineError>> {
    this.logger.info('pipeline_start', {
      pipeline: this.type,
      mode: options.mode,
      materialId: content.material.id,
    });

    try {
      let script: VideoScript;

      if (options.mode === 'derivative' && options.sourceScript) {
        // Path A: Extract highlights from longform
        const extractResult = await this.extractHighlights(options.sourceScript, options);
        if (!extractResult.ok) return extractResult;
        script = extractResult.value;
      } else {
        // Path B: Generate fresh shortform script
        const scriptResult = await this.generateShortScript(content, options);
        if (!scriptResult.ok) return scriptResult;
        script = scriptResult.value;
      }

      this.logger.info('script_generated', {
        mode: options.mode,
        title: script.title,
        sceneCount: script.scenes.length,
      });

      // Generate TTS
      const ttsRequests: TTSRequest[] = script.scenes.map(scene => ({
        text: scene.narration,
        sceneId: scene.id,
      }));

      const audioResult = await generateTTSBatch(ttsRequests, this.config.tts);
      if (!audioResult.ok) {
        return Err({
          pipeline: this.type,
          stage: 'generate_audio',
          message: `TTS error: ${audioResult.error.message}`,
        });
      }

      const audioSegments = audioResult.value;
      const totalDurationMs = audioSegments.reduce((sum, s) => sum + s.durationMs, 0);

      // Generate output for each target channel
      const outputs: ChannelContent[] = content.targetChannels
        .filter(ch => this.outputChannels.includes(ch))
        .map(channel => ({
          channel,
          title: script.title,
          body: JSON.stringify({ script, audioSegments, status: 'script_ready' }),
          metadata: {
            format: 'video-project',
            aspectRatio: '9:16',
            sceneCount: script.scenes.length,
            totalDurationMs,
            mode: options.mode,
            pipelineStage: 'script_and_audio',
          },
        }));

      this.logger.info('pipeline_complete', {
        pipeline: this.type,
        outputs: outputs.length,
        totalDurationMs,
      });

      return Ok(outputs);

    } catch (error) {
      return Err({
        pipeline: this.type,
        stage: 'process',
        message: error instanceof Error ? error.message : 'Unknown error',
        cause: error,
      });
    }
  }

  /**
   * Path A: Extract highlight scenes from longform script
   */
  private extractHighlights(
    sourceScript: VideoScript,
    options: ShortformOptions
  ): Promise<Result<VideoScript, PipelineError>> {
    const maxDuration = options.maxDurationMs || 60000;
    const targetScenes = options.targetSceneCount || 3;

    // Strategy: pick scenes with highest information density
    // Prioritize: diagram, chart, infographic, comparison (data-rich scenes)
    // Always include first scene (hook) and customize for shortform
    const priorityTypes = new Set(['diagram', 'chart', 'infographic', 'comparison', 'list-reveal']);

    const scoredScenes = sourceScript.scenes.map((scene, index) => ({
      scene,
      score: (priorityTypes.has(scene.sceneType) ? 3 : 1) +
             (index === 0 ? 2 : 0) +  // Bonus for first scene (hook)
             (scene.presenterEnabled ? 1 : 0),  // Bonus for presenter scenes
    }));

    scoredScenes.sort((a, b) => b.score - a.score);
    const selectedScenes = scoredScenes
      .slice(0, targetScenes)
      .sort((a, b) => sourceScript.scenes.indexOf(a.scene) - sourceScript.scenes.indexOf(b.scene))
      .map(s => s.scene);

    if (selectedScenes.length === 0) {
      return Promise.resolve(Err({
        pipeline: this.type,
        stage: 'extract_highlights',
        message: 'No suitable scenes found for shortform extraction',
      }));
    }

    // Re-ID scenes for shortform
    const shortScenes: VideoScriptScene[] = selectedScenes.map((scene, index) => ({
      ...scene,
      id: `short_scene_${index + 1}`,
      // Trim narration for shorter format
      narration: scene.narration.length > 200
        ? scene.narration.substring(0, 197) + '...'
        : scene.narration,
    }));

    const estimatedDuration = Math.min(
      shortScenes.length * 15000,  // ~15s per scene
      maxDuration
    );

    return Promise.resolve(Ok({
      title: `${sourceScript.title} — 핵심 요약`,
      scenes: shortScenes,
      totalEstimatedDurationMs: estimatedDuration,
      aspectRatio: '9:16',
    }));
  }

  /**
   * Path B: Generate fresh shortform script
   */
  private async generateShortScript(
    content: RawContent,
    options: ShortformOptions
  ): Promise<Result<VideoScript, PipelineError>> {
    const maxDuration = options.maxDurationMs || 60000;

    const systemPrompt = `You are a shortform video script writer (YouTube Shorts, Instagram Reels, TikTok).
Create a punchy, engaging 60-second video script.

Output ONLY valid JSON:
{
  "title": "Catchy short title",
  "scenes": [
    {
      "id": "short_scene_1",
      "sceneType": "title-card|text-reveal|diagram|chart|list-reveal|custom-svg",
      "narration": "Short narration (1-2 sentences max)",
      "visualPrompt": "Visual description",
      "presenterEnabled": true/false,
      "presenterGesture": "talking|explaining|pointing",
      "durationEstimateMs": 10000
    }
  ],
  "totalEstimatedDurationMs": ${maxDuration},
  "aspectRatio": "9:16"
}

Rules:
- Maximum 3-5 scenes, total under ${maxDuration / 1000} seconds
- Hook viewer in first 3 seconds (scene 1 must be attention-grabbing)
- Each narration: 1-2 short sentences only
- Use bold visual types (chart, diagram, list-reveal)
- Enable presenter for at least first and last scenes
- Write in Korean
- Keep it fast-paced and impactful`;

    const userMessage = `소재: ${content.material.title}\n\n${content.material.content.substring(0, 1000)}`;

    const result = await callClaude(
      [{ role: 'user', content: userMessage }],
      systemPrompt,
      this.config.claude,
    );

    if (!result.ok) {
      return Err({
        pipeline: this.type,
        stage: 'generate_short_script',
        message: `Claude API error: ${result.error.message}`,
      });
    }

    try {
      const jsonStr = result.value.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const raw: unknown = JSON.parse(jsonStr);
      // Enforce 9:16 before validation
      if (typeof raw === 'object' && raw !== null) {
        (raw as Record<string, unknown>).aspectRatio = '9:16';
      }
      const parseResult = VideoScriptSchema.safeParse(raw);

      if (!parseResult.success) {
        return Err({
          pipeline: this.type,
          stage: 'generate_short_script',
          message: `Script validation failed: ${parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
        });
      }

      return Ok(parseResult.data as VideoScript);

    } catch (error) {
      return Err({
        pipeline: this.type,
        stage: 'generate_short_script',
        message: `Failed to parse script JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }
}
