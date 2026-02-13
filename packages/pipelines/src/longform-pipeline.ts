/**
 * Longform video pipeline - transforms raw content into YouTube longform video
 *
 * Architecture: Option D (Hybrid)
 * Stage 1: Script Generation (Claude API) → VideoScript
 * Stage 2: TTS Generation (ElevenLabs) → AudioSegment[]
 * Stage 3: Visual Generation (Claude SVG / AI providers) → SceneVisualOutput[]
 * Stage 4: Avatar Generation (HeyGen / LivePortrait) → avatar clips
 * Stage 5: Remotion Compose → MP4
 * Stage 6: Thumbnail Generation → PNG[]
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
  type AudioSegment,
  type SceneVisualOutput,
  VideoScriptSchema,
} from '@content-forge/core';

import { BasePipeline, type PipelineError } from './text-pipeline.js';
import { callClaude, type ClaudeApiConfig } from './claude-api.js';
import { generateTTSBatch, type TTSConfig, type TTSRequest } from './tts-client.js';

// Re-export for convenience
export type { VideoScript, VideoScriptScene, AudioSegment, SceneVisualOutput };

export interface LongformPipelineConfig {
  claude: ClaudeApiConfig;
  tts: TTSConfig;
}

export class LongformPipeline extends BasePipeline {
  readonly type: PipelineType = 'longform';
  readonly outputChannels: Channel[] = ['youtube'];

  private config: LongformPipelineConfig;

  constructor(config: LongformPipelineConfig, logger?: Logger) {
    super(logger);
    this.config = config;
  }

  /**
   * Process raw content into YouTube longform video
   */
  async process(content: RawContent): Promise<Result<ChannelContent[], PipelineError>> {
    this.logger.info('pipeline_start', {
      pipeline: this.type,
      materialId: content.material.id,
    });

    try {
      // Stage 1: Generate video script
      const scriptResult = await this.generateVideoScript(content);
      if (!scriptResult.ok) {
        return Err(scriptResult.error);
      }
      const script = scriptResult.value;

      this.logger.info('script_generated', {
        title: script.title,
        sceneCount: script.scenes.length,
        estimatedDurationMs: script.totalEstimatedDurationMs,
      });

      // Stage 2: Generate TTS audio for all scenes
      const audioResult = await this.generateAudio(script.scenes);
      if (!audioResult.ok) {
        return Err(audioResult.error);
      }
      const audioSegments = audioResult.value;

      this.logger.info('tts_generated', {
        segmentCount: audioSegments.length,
        totalDurationMs: audioSegments.reduce((sum, s) => sum + s.durationMs, 0),
      });

      // Stage 3: Generate visuals (placeholder - will be implemented with VisualDirector agent)
      const visualsResult = await this.generateVisuals(script.scenes);
      if (!visualsResult.ok) {
        return Err(visualsResult.error);
      }

      // Stages 4-6 (Avatar, Remotion Render, Thumbnail) will be implemented in Phase 3.3-3.4
      // For now, return the script data as ChannelContent

      const totalDurationMs = audioSegments.reduce((sum, s) => sum + s.durationMs, 0);

      const output: ChannelContent = {
        channel: 'youtube',
        title: script.title,
        body: JSON.stringify({ script, audioSegments, status: 'script_ready' }),
        metadata: {
          format: 'video-project',
          aspectRatio: script.aspectRatio,
          sceneCount: script.scenes.length,
          totalDurationMs,
          audioSegments: audioSegments.map(s => ({
            sceneId: s.sceneId,
            durationMs: s.durationMs,
            startOffsetMs: s.startOffsetMs,
          })),
          presenterScenes: script.scenes.filter(s => s.presenterEnabled).length,
          pipelineStage: 'script_and_audio',
        },
      };

      this.logger.info('pipeline_complete', {
        pipeline: this.type,
        title: script.title,
        sceneCount: script.scenes.length,
        totalDurationMs,
      });

      return Ok([output]);

    } catch (error) {
      this.logger.error('pipeline_error', {
        pipeline: this.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return Err({
        pipeline: this.type,
        stage: 'process',
        message: error instanceof Error ? error.message : 'Unknown error',
        cause: error,
      });
    }
  }

  /**
   * Stage 1: Generate video script from raw content using Claude
   */
  async generateVideoScript(content: RawContent): Promise<Result<VideoScript, PipelineError>> {
    const systemPrompt = `You are a video script writer for a tech content platform.
Given a source material, create a video script broken into scenes.

Output ONLY valid JSON matching this structure:
{
  "title": "Video title",
  "scenes": [
    {
      "id": "scene_1",
      "sceneType": "title-card|text-reveal|diagram|chart|comparison|timeline|code-highlight|quote|list-reveal|infographic|custom-svg",
      "narration": "Narration text for this scene (spoken by TTS)",
      "visualPrompt": "Description of what should be shown visually",
      "presenterEnabled": true/false,
      "presenterGesture": "talking|explaining|pointing|nodding",
      "durationEstimateMs": 5000
    }
  ],
  "totalEstimatedDurationMs": 300000,
  "aspectRatio": "16:9"
}

Rules:
- First scene should be title-card with presenterEnabled: true
- Use diagram/chart for data explanations
- Use text-reveal for key quotes or statistics
- Enable presenter for intro, key points, and closing
- Disable presenter for full-screen diagrams or data visualizations
- Each scene narration should be 2-4 sentences
- Total video should be 5-10 minutes (300,000-600,000ms)
- Scene IDs should be sequential: scene_1, scene_2, ...
- Last scene should be a closing with presenterEnabled: true
- Write narration in Korean`;

    const userMessage = `소재 제목: ${content.material.title}

소재 내용:
${content.material.content}

태그: ${content.material.tags.join(', ')}

이 소재를 기반으로 YouTube 롱폼 영상 스크립트를 생성해주세요.`;

    const result = await callClaude(
      [{ role: 'user', content: userMessage }],
      systemPrompt,
      this.config.claude,
    );

    if (!result.ok) {
      return Err({
        pipeline: this.type,
        stage: 'generate_script',
        message: `Claude API error: ${result.error.message}`,
        cause: result.error,
      });
    }

    // Parse and validate Claude's JSON response with Zod
    try {
      const jsonStr = result.value.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const raw: unknown = JSON.parse(jsonStr);
      const parseResult = VideoScriptSchema.safeParse(raw);

      if (!parseResult.success) {
        return Err({
          pipeline: this.type,
          stage: 'generate_script',
          message: `Script validation failed: ${parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
        });
      }

      return Ok(parseResult.data as VideoScript);

    } catch (error) {
      return Err({
        pipeline: this.type,
        stage: 'generate_script',
        message: `Failed to parse script JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        cause: error,
      });
    }
  }

  /**
   * Stage 2: Generate TTS audio for all scenes
   */
  private async generateAudio(scenes: VideoScriptScene[]): Promise<Result<AudioSegment[], PipelineError>> {
    const ttsRequests: TTSRequest[] = scenes.map(scene => ({
      text: scene.narration,
      sceneId: scene.id,
    }));

    const result = await generateTTSBatch(ttsRequests, this.config.tts);

    if (!result.ok) {
      return Err({
        pipeline: this.type,
        stage: 'generate_audio',
        message: `TTS error: ${result.error.message}`,
        cause: result.error,
      });
    }

    return Ok(result.value);
  }

  /**
   * Stage 3: Generate visuals for all scenes (placeholder)
   * Will be fully implemented with VisualDirector agent in Phase 3.3
   */
  private generateVisuals(scenes: VideoScriptScene[]): Promise<Result<SceneVisualOutput[], PipelineError>> {
    // Placeholder: generate basic visual metadata for each scene
    const visuals: SceneVisualOutput[] = scenes.map(scene => ({
      sceneId: scene.id,
      sceneType: scene.sceneType,
      props: {
        narration: scene.narration,
        visualPrompt: scene.visualPrompt,
      },
    }));

    return Promise.resolve(Ok(visuals));
  }
}
