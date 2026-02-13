/**
 * Video Producer Agent - orchestrates the full video pipeline:
 * script -> TTS -> visuals -> avatar -> render
 */

import {
  Ok, Err, type Result, type Task,
  type Material, type VideoScript, type VideoScriptScene,
  type VideoProject, type EditableScene, type ProjectStatus,
  type AudioSegment, type SceneVisualOutput,
  type AspectRatio,
} from '@content-forge/core';
import { callClaude, type ClaudeApiConfig } from '@content-forge/pipelines';
import { BaseAgent } from './base-agent.js';
import type { AgentError, TaskOutput } from './types.js';

export interface VideoProducerInput {
  material: Material;
  aspectRatio: AspectRatio;
  claudeApiConfig: ClaudeApiConfig;
  ttsConfig?: { apiKey: string; voiceId: string };
  avatarProfileId?: string;
  outputDir: string;
}

export interface VideoProducerOutput {
  projectId: string;
  project: VideoProject;
  outputPath?: string;
  status: ProjectStatus;
}

interface StageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class VideoProducerAgent extends BaseAgent {
  /**
   * Execute full video production pipeline
   */
  protected async execute(task: Task): Promise<Result<TaskOutput, AgentError>> {
    try {
      const input = task.input as unknown as VideoProducerInput;

      if (!input.material) {
        return Err({
          agent: this.name,
          message: 'Invalid input: material is required',
        });
      }

      if (!input.claudeApiConfig) {
        return Err({
          agent: this.name,
          message: 'Invalid input: claudeApiConfig is required',
        });
      }

      if (!input.outputDir) {
        return Err({
          agent: this.name,
          message: 'Invalid input: outputDir is required',
        });
      }

      // Stage 1: Generate script
      this.logger.info('producer.stage', { stage: 'scripting' });
      const scriptResult = await this.generateScript(input);
      if (!scriptResult.success || !scriptResult.data) {
        return this.stageError('scripting', scriptResult.error ?? 'Unknown error');
      }
      const script = scriptResult.data;

      // Stage 2: Assemble project
      this.logger.info('producer.stage', { stage: 'assembling' });
      const project = this.assembleProject(input, script);

      // Stage 3: Generate visuals
      this.logger.info('producer.stage', { stage: 'visuals' });
      const visualResult = await this.generateVisuals(project, input);
      if (visualResult.success && visualResult.data) {
        this.applyVisuals(project, visualResult.data);
      }
      // Continue even if some visuals fail
      this.logger.info('producer.visuals_complete', {
        success: visualResult.success,
        sceneCount: project.scenes.length,
      });

      // Stage 4: Generate TTS
      this.logger.info('producer.stage', { stage: 'tts' });
      const ttsResult = await this.generateTTS(project, input);
      if (ttsResult.success && ttsResult.data) {
        this.applyAudio(project, ttsResult.data);
      }

      // Stage 5: Generate avatars (optional)
      if (input.avatarProfileId) {
        this.logger.info('producer.stage', { stage: 'avatars' });
        await this.generateAvatars(project, input);
      }

      // Stage 6: Render
      this.logger.info('producer.stage', { stage: 'rendering' });
      const renderResult = await this.renderVideo(project, input);

      const finalStatus: ProjectStatus = renderResult.success ? 'complete' : 'rendering';
      project.status = finalStatus;
      project.updatedAt = new Date().toISOString();

      const output: VideoProducerOutput = {
        projectId: project.id,
        project,
        ...(renderResult.data != null ? { outputPath: renderResult.data } : {}),
        status: finalStatus,
      };

      return Ok({
        agentId: this.id,
        taskId: task.id,
        result: output as unknown as Record<string, unknown>,
        completedAt: new Date(),
      });
    } catch (err) {
      return Err({
        agent: this.name,
        message: `Execution failed: ${String(err)}`,
        cause: err,
      });
    }
  }

  /**
   * Stage 1: Generate video script from material using Claude
   */
  private async generateScript(input: VideoProducerInput): Promise<StageResult<VideoScript>> {
    const isShortform = input.aspectRatio === '9:16';

    const systemPrompt = isShortform
      ? this.getShortformScriptPrompt()
      : this.getLongformScriptPrompt();

    const userMessage = `Title: ${input.material.title}\n\nContent:\n${input.material.content}`;

    const result = await callClaude(
      [{ role: 'user', content: userMessage }],
      systemPrompt,
      input.claudeApiConfig,
    );

    if (!result.ok) {
      return { success: false, error: `Claude API error: ${result.error.message}` };
    }

    try {
      const jsonStr = result.value.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(jsonStr) as VideoScript;

      if (!parsed.title || !parsed.scenes || parsed.scenes.length === 0) {
        return { success: false, error: 'Invalid script: missing title or scenes' };
      }

      parsed.aspectRatio = input.aspectRatio;
      return { success: true, data: parsed };
    } catch (err) {
      return { success: false, error: `Failed to parse script JSON: ${String(err)}` };
    }
  }

  /**
   * Stage 2: Convert VideoScript into a VideoProject with EditableScenes
   */
  private assembleProject(input: VideoProducerInput, script: VideoScript): VideoProject {
    const projectId = `proj_${Date.now()}`;
    const now = new Date().toISOString();

    const scenes: EditableScene[] = script.scenes.map((scene, index) =>
      this.scriptSceneToEditable(scene, index, input),
    );

    return {
      id: projectId,
      title: script.title,
      materialId: input.material.id,
      aspectRatio: input.aspectRatio,
      scenes,
      globalStyle: {
        colorScheme: 'brand-dark',
        fontFamily: 'Inter',
      },
      status: 'editing',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Convert a VideoScriptScene to an EditableScene
   */
  private scriptSceneToEditable(
    scene: VideoScriptScene,
    order: number,
    input: VideoProducerInput,
  ): EditableScene {
    return {
      id: scene.id,
      order,
      narration: {
        text: scene.narration,
        voiceId: input.ttsConfig?.voiceId ?? 'default',
        status: 'draft',
      },
      visual: {
        source: {
          type: 'claude-svg',
          prompt: scene.visualPrompt,
        },
        status: 'draft',
        versions: [],
      },
      presenter: {
        enabled: scene.presenterEnabled,
        avatarProfileId: input.avatarProfileId ?? '',
        position: 'bottom-right',
        size: 'medium',
        shape: 'circle',
        background: 'transparent',
        gesture: scene.presenterGesture ?? 'talking',
        lipSync: true,
        enterAnimation: 'fade-in',
        status: 'draft',
      },
      overlay: {
        subtitles: true,
        subtitleStyle: 'bold',
        watermark: false,
      },
      timing: {
        durationMs: scene.durationEstimateMs ?? 5000,
        transitionIn: 'fade',
        transitionDurationMs: 500,
      },
    };
  }

  /**
   * Stage 3: Generate visuals for each scene (placeholder - delegates to VisualDirector)
   */
  private generateVisuals(
    project: VideoProject,
    _input: VideoProducerInput,
  ): Promise<StageResult<SceneVisualOutput[]>> {
    const visuals: SceneVisualOutput[] = [];
    let hasFailure = false;

    for (const scene of project.scenes) {
      try {
        // Placeholder: generate basic visual output for each scene
        const visual: SceneVisualOutput = {
          sceneId: scene.id,
          sceneType: scene.visual.source.type === 'claude-svg' ? 'custom-svg' : 'custom-svg',
          props: {
            prompt: scene.visual.source.type === 'claude-svg'
              ? (scene.visual.source as { type: 'claude-svg'; prompt: string }).prompt
              : '',
          },
        };
        visuals.push(visual);
        scene.visual.status = 'ready';
      } catch {
        hasFailure = true;
        scene.visual.status = 'error';
        this.logger.warn('producer.visual_failed', { sceneId: scene.id });
      }
    }

    return Promise.resolve({ success: !hasFailure, data: visuals });
  }

  /**
   * Apply generated visuals to the project scenes
   */
  private applyVisuals(project: VideoProject, visuals: SceneVisualOutput[]): void {
    for (const visual of visuals) {
      const scene = project.scenes.find(s => s.id === visual.sceneId);
      if (scene && visual.svgContent) {
        scene.visual.source = {
          type: 'claude-svg',
          prompt: scene.visual.source.type === 'claude-svg'
            ? (scene.visual.source as { type: 'claude-svg'; prompt: string }).prompt
            : '',
          svgContent: visual.svgContent,
        };
        scene.visual.status = 'ready';
      }
    }
  }

  /**
   * Stage 4: Generate TTS audio for each scene (placeholder)
   */
  private generateTTS(
    project: VideoProject,
    _input: VideoProducerInput,
  ): Promise<StageResult<AudioSegment[]>> {
    const segments: AudioSegment[] = [];
    let currentOffset = 0;

    for (const scene of project.scenes) {
      // Placeholder: estimate duration from text length
      const estimatedDurationMs = Math.max(2000, scene.narration.text.length * 80);
      const segment: AudioSegment = {
        sceneId: scene.id,
        audioFilePath: `${scene.id}.mp3`,
        durationMs: estimatedDurationMs,
        startOffsetMs: currentOffset,
      };
      currentOffset += estimatedDurationMs;
      segments.push(segment);
      scene.narration.durationMs = estimatedDurationMs;
      scene.narration.status = 'ready';
    }

    return Promise.resolve({ success: true, data: segments });
  }

  /**
   * Apply audio segments to project scenes
   */
  private applyAudio(project: VideoProject, segments: AudioSegment[]): void {
    for (const segment of segments) {
      const scene = project.scenes.find(s => s.id === segment.sceneId);
      if (scene) {
        scene.narration.audioUrl = segment.audioFilePath;
        scene.narration.durationMs = segment.durationMs;
        scene.timing.durationMs = segment.durationMs;
      }
    }
  }

  /**
   * Stage 5: Generate avatar overlays (placeholder)
   */
  private generateAvatars(
    project: VideoProject,
    _input: VideoProducerInput,
  ): Promise<StageResult<void>> {
    for (const scene of project.scenes) {
      if (scene.presenter.enabled) {
        // Placeholder: mark avatar as ready
        scene.presenter.status = 'ready';
        scene.presenter.videoUrl = `avatar_${scene.id}.webm`;
      }
    }
    return Promise.resolve({ success: true });
  }

  /**
   * Stage 6: Render final video (placeholder)
   */
  private renderVideo(
    project: VideoProject,
    input: VideoProducerInput,
  ): Promise<StageResult<string>> {
    project.status = 'rendering';

    // Placeholder: simulate render output path
    const outputPath = `${input.outputDir}/${project.id}.mp4`;

    this.logger.info('producer.render_complete', {
      projectId: project.id,
      outputPath,
    });

    return Promise.resolve({ success: true, data: outputPath });
  }

  /**
   * Create an error result for a specific pipeline stage
   */
  private stageError(stage: string, message: string): Result<TaskOutput, AgentError> {
    return Err({
      agent: this.name,
      message: `Pipeline stage '${stage}' failed: ${message}`,
    });
  }

  private getLongformScriptPrompt(): string {
    return `You are a video script writer. Given source material, create a video script.
Output ONLY valid JSON:
{
  "title": "Video title",
  "scenes": [
    {
      "id": "scene_1",
      "sceneType": "title-card|text-reveal|diagram|chart|comparison|timeline|code-highlight|quote|list-reveal|infographic|custom-svg",
      "narration": "Narration text",
      "visualPrompt": "Visual description",
      "presenterEnabled": true,
      "presenterGesture": "talking|explaining|pointing|nodding",
      "durationEstimateMs": 5000
    }
  ],
  "totalEstimatedDurationMs": 300000,
  "aspectRatio": "16:9"
}`;
  }

  private getShortformScriptPrompt(): string {
    return `You are a shortform video script writer (Shorts, Reels, TikTok).
Create a punchy 60-second video script.
Output ONLY valid JSON:
{
  "title": "Short title",
  "scenes": [
    {
      "id": "short_scene_1",
      "sceneType": "title-card|text-reveal|diagram|chart|list-reveal|custom-svg",
      "narration": "Short narration (1-2 sentences)",
      "visualPrompt": "Visual description",
      "presenterEnabled": true,
      "presenterGesture": "talking|explaining|pointing",
      "durationEstimateMs": 10000
    }
  ],
  "totalEstimatedDurationMs": 60000,
  "aspectRatio": "9:16"
}
Maximum 3-5 scenes, total under 60 seconds.`;
  }
}
