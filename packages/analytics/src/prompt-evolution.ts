/**
 * Prompt evolution module
 * Extracts high-performance patterns and suggests agent prompt updates
 */

import { z } from 'zod';
import { Ok, Err, type Result, type Content, type Channel } from '@content-forge/core';
import { callClaude, type ClaudeApiConfig } from '@content-forge/pipelines';
import type { ContentAnalysis, HighPerformancePattern, PromptUpdate, LoopError } from './loop-types.js';

const HighPerformancePatternSchema = z.object({
  id: z.string(),
  pattern: z.string(),
  channels: z.array(z.string()),
  avgEngagementLift: z.number(),
  sampleSize: z.number(),
});

const PromptUpdateSchema = z.object({
  agentType: z.string(),
  section: z.string(),
  currentHint: z.string(),
  suggestedHint: z.string(),
  basedOnPatterns: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export interface PromptEvolutionConfig {
  claudeApiConfig: ClaudeApiConfig;
  minSampleSize?: number;
}

/**
 * Extract high-performance patterns from content analyses.
 *
 * 1. Match each high-performer to its Content body
 * 2. Send batch to Claude for pattern analysis
 * 3. Parse Claude's response into structured patterns
 * 4. Require minimum sample size before extracting
 */
export async function extractPatterns(
  highPerformers: ContentAnalysis[],
  contents: Content[],
  config: PromptEvolutionConfig,
): Promise<Result<HighPerformancePattern[], LoopError>> {
  const minSampleSize = config.minSampleSize ?? 10;

  if (highPerformers.length < minSampleSize) {
    return Ok([]);
  }

  try {
    // Match high performers to their content bodies
    const contentMap = new Map<string, Content>();
    for (const c of contents) {
      contentMap.set(c.id, c);
    }

    const samples: Array<{ channel: Channel; body: string; engagement: number }> = [];

    for (const hp of highPerformers) {
      // Find content by looking for content whose ID matches via publication relationship
      // ContentAnalysis has publicationId; Content has id. We match via the contents array.
      for (const c of contents) {
        if (c.channel === hp.channel) {
          samples.push({
            channel: hp.channel,
            body: c.body.slice(0, 500), // Truncate for API efficiency
            engagement: hp.metrics.likes + hp.metrics.comments + hp.metrics.shares,
          });
          break;
        }
      }
    }

    if (samples.length < minSampleSize) {
      return Ok([]);
    }

    const systemPrompt = `You are a content performance analyst. Analyze the provided high-performing content pieces and identify common patterns that make them successful.

Return ONLY a valid JSON array of pattern objects. Each object must have:
- "id": a short kebab-case identifier (e.g., "strong-opening-hook")
- "pattern": a natural language description of the pattern
- "channels": array of channel names where this pattern was observed
- "avgEngagementLift": percentage above average as a number (e.g., 45 for 45%)
- "sampleSize": how many pieces exhibited this pattern

Return between 1 and 10 patterns. Do not include any text outside the JSON array.`;

    const userMessage = `Analyze these ${samples.length} high-performing content pieces and identify success patterns:\n\n${JSON.stringify(samples, null, 2)}`;

    const result = await callClaude(
      [{ role: 'user', content: userMessage }],
      systemPrompt,
      config.claudeApiConfig,
    );

    if (!result.ok) {
      return Err({
        message: result.error.message,
        loop: 'prompt-evolution',
        details: result.error,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const raw = JSON.parse(result.value);
    const parseResult = z.array(HighPerformancePatternSchema).safeParse(raw);

    if (!parseResult.success) {
      return Err({
        message: `Pattern validation failed: ${parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
        loop: 'prompt-evolution',
        details: parseResult.error,
      });
    }

    const now = new Date().toISOString();
    const validated: HighPerformancePattern[] = parseResult.data.map((p) => ({
      ...p,
      channels: p.channels as Channel[],
      extractedAt: now,
    }));

    return Ok(validated);
  } catch (cause: unknown) {
    return Err({
      message: cause instanceof Error ? cause.message : 'Failed to extract patterns',
      loop: 'prompt-evolution',
      details: cause,
    });
  }
}

/**
 * Suggest prompt updates based on extracted patterns.
 *
 * 1. Send patterns to Claude for prompt improvement suggestions
 * 2. Return structured PromptUpdate objects with current vs suggested
 */
export async function suggestPromptUpdates(
  patterns: HighPerformancePattern[],
  config: PromptEvolutionConfig,
): Promise<Result<PromptUpdate[], LoopError>> {
  if (patterns.length === 0) {
    return Ok([]);
  }

  try {
    const systemPrompt = `You are an AI prompt engineer. Based on the provided content success patterns, suggest improvements for content creation agent prompts.

The agents are:
- "writer": Creates content drafts
- "strategist": Plans content strategy
- "humanizer": Makes AI content sound more natural

Return ONLY a valid JSON array of prompt update objects. Each object must have:
- "agentType": one of "writer", "strategist", "humanizer"
- "section": which part of the prompt to update (e.g., "tone-guidelines", "structure-rules")
- "currentHint": description of the current approach
- "suggestedHint": the suggested improvement
- "basedOnPatterns": array of pattern IDs this is based on
- "confidence": a number between 0 and 1

Return between 1 and 10 updates. Do not include any text outside the JSON array.`;

    const userMessage = `Based on these success patterns, suggest prompt improvements:\n\n${JSON.stringify(patterns, null, 2)}`;

    const result = await callClaude(
      [{ role: 'user', content: userMessage }],
      systemPrompt,
      config.claudeApiConfig,
    );

    if (!result.ok) {
      return Err({
        message: result.error.message,
        loop: 'prompt-evolution',
        details: result.error,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const raw = JSON.parse(result.value);
    const parseResult = z.array(PromptUpdateSchema).safeParse(raw);

    if (!parseResult.success) {
      return Err({
        message: `Prompt update validation failed: ${parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
        loop: 'prompt-evolution',
        details: parseResult.error,
      });
    }

    return Ok(parseResult.data);
  } catch (cause: unknown) {
    return Err({
      message: cause instanceof Error ? cause.message : 'Failed to suggest prompt updates',
      loop: 'prompt-evolution',
      details: cause,
    });
  }
}
