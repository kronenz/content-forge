/**
 * Visual Director Agent - generates scene visuals using Claude API
 */

import {
  Ok, Err, type Result, type Task,
  type VideoScriptScene, type SceneVisualOutput,
  SceneVisualOutputSchema,
} from '@content-forge/core';
import { callClaude, type ClaudeApiConfig } from '@content-forge/pipelines';
import { sanitizeSvg } from '@content-forge/video';
import { BaseAgent } from './base-agent.js';
import type { AgentError, TaskOutput } from './types.js';
import {
  getVisualPromptTemplate,
  getSystemPrompt,
  isSvgSceneType,
  isPassthroughSceneType,
} from './visual-prompt-templates.js';

interface VisualDirectorInput {
  scenes: VideoScriptScene[];
  claudeApiConfig: ClaudeApiConfig;
}

interface VisualDirectorOutput {
  visuals: SceneVisualOutput[];
}

export class VisualDirectorAgent extends BaseAgent {
  /**
   * Execute visual generation for all scenes
   */
  protected async execute(task: Task): Promise<Result<TaskOutput, AgentError>> {
    try {
      const input = task.input as unknown as VisualDirectorInput;

      if (!input.scenes || !Array.isArray(input.scenes)) {
        return Err({
          agent: this.name,
          message: 'Invalid input: scenes array is required',
        });
      }

      if (!input.claudeApiConfig) {
        return Err({
          agent: this.name,
          message: 'Invalid input: claudeApiConfig is required',
        });
      }

      const visuals: SceneVisualOutput[] = [];

      for (const scene of input.scenes) {
        const result = await this.generateVisualForScene(scene, input.claudeApiConfig);

        if (!result.ok) {
          return Err({
            agent: this.name,
            message: `Failed to generate visual for scene ${scene.id}: ${result.error.message}`,
            cause: result.error,
          });
        }

        visuals.push(result.value);
      }

      const output: VisualDirectorOutput = { visuals };

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
   * Generate visual output for a single scene
   */
  private async generateVisualForScene(
    scene: VideoScriptScene,
    config: ClaudeApiConfig,
  ): Promise<Result<SceneVisualOutput, AgentError>> {
    const sceneType = scene.sceneType;

    // Passthrough scenes (transition) need no generation
    if (isPassthroughSceneType(sceneType)) {
      return this.buildVisualOutput(scene, {});
    }

    // Build prompt from template + scene's visualPrompt
    const template = getVisualPromptTemplate(sceneType);
    const systemPrompt = getSystemPrompt(sceneType);
    const userMessage = `${template}\n\nScene description: ${scene.visualPrompt}`;

    // Call Claude API
    const claudeResult = await callClaude(
      [{ role: 'user', content: userMessage }],
      systemPrompt,
      config,
    );

    if (!claudeResult.ok) {
      return Err({
        agent: this.name,
        message: `Claude API error: ${claudeResult.error.message}`,
        cause: claudeResult.error,
      });
    }

    const response = claudeResult.value;

    // Handle SVG scene types
    if (isSvgSceneType(sceneType)) {
      return this.handleSvgResponse(scene, response);
    }

    // Handle template scene types (JSON props)
    return this.handleTemplateResponse(scene, response);
  }

  /**
   * Handle SVG response: sanitize and build output
   */
  private handleSvgResponse(
    scene: VideoScriptScene,
    response: string,
  ): Result<SceneVisualOutput, AgentError> {
    // Extract SVG content (Claude may include extra text despite instructions)
    const svgContent = this.extractSvg(response);

    if (!svgContent) {
      return Err({
        agent: this.name,
        message: `No SVG content found in Claude response for scene ${scene.id}`,
      });
    }

    // Sanitize SVG
    const sanitizeResult = sanitizeSvg(svgContent);

    if (!sanitizeResult.ok) {
      return Err({
        agent: this.name,
        message: `SVG sanitization failed for scene ${scene.id}: ${sanitizeResult.error.message}`,
        cause: sanitizeResult.error,
      });
    }

    return this.buildVisualOutput(scene, {}, sanitizeResult.value);
  }

  /**
   * Handle template response: parse JSON props
   */
  private handleTemplateResponse(
    scene: VideoScriptScene,
    response: string,
  ): Result<SceneVisualOutput, AgentError> {
    let props: Record<string, unknown>;

    try {
      // Extract JSON from response (may be wrapped in markdown code block)
      const jsonStr = this.extractJson(response);
      props = JSON.parse(jsonStr) as Record<string, unknown>;
    } catch {
      return Err({
        agent: this.name,
        message: `Failed to parse JSON props for scene ${scene.id}: invalid JSON in response`,
      });
    }

    return this.buildVisualOutput(scene, props);
  }

  /**
   * Build and validate a SceneVisualOutput
   */
  private buildVisualOutput(
    scene: VideoScriptScene,
    props: Record<string, unknown>,
    svgContent?: string,
  ): Result<SceneVisualOutput, AgentError> {
    const output: SceneVisualOutput = {
      sceneId: scene.id,
      sceneType: scene.sceneType,
      props,
      ...(svgContent !== undefined ? { svgContent } : {}),
    };

    // Validate with Zod schema
    const validation = SceneVisualOutputSchema.safeParse(output);

    if (!validation.success) {
      return Err({
        agent: this.name,
        message: `Validation failed for scene ${scene.id}: ${validation.error.message}`,
        cause: validation.error,
      });
    }

    return Ok(validation.data as SceneVisualOutput);
  }

  /**
   * Extract SVG content from a response string
   */
  private extractSvg(response: string): string | null {
    // Try to find SVG tag directly
    const svgMatch = response.match(/<svg[\s\S]*<\/svg>/i);
    if (svgMatch) {
      return svgMatch[0];
    }
    return null;
  }

  /**
   * Extract JSON from a response string (handles markdown code blocks)
   */
  private extractJson(response: string): string {
    // Try markdown code block first
    const codeBlockMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (codeBlockMatch?.[1]) {
      return codeBlockMatch[1].trim();
    }

    // Try raw JSON object
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    // Return as-is, let JSON.parse handle the error
    return response.trim();
  }
}
