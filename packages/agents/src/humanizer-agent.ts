/**
 * Humanizer Agent - AI pattern removal and natural language refinement
 */

import { Ok, Err, type Result, type Task, type ChannelContent } from '@content-forge/core';
import { BaseAgent } from './base-agent.js';
import type { AgentError, TaskOutput } from './types.js';

interface HumanizerInput {
  content: ChannelContent;
}

interface HumanizerOutput {
  content: ChannelContent;
  changes: string[];
  aiPatternScore: number;
}

// AI patterns and their natural replacements
const AI_PATTERNS: Array<{ pattern: RegExp; replacement: string; label: string }> = [
  { pattern: /\bIn conclusion\b/gi, replacement: 'To wrap up', label: 'In conclusion' },
  { pattern: /\bFurthermore\b/gi, replacement: 'Also', label: 'Furthermore' },
  { pattern: /\bIt's important to note\b/gi, replacement: 'Note that', label: "It's important to note" },
  { pattern: /\bDelve\b/gi, replacement: 'Explore', label: 'Delve' },
  { pattern: /\bLeverage\b/gi, replacement: 'Use', label: 'Leverage' },
  { pattern: /\bUtilize\b/gi, replacement: 'Use', label: 'Utilize' },
  { pattern: /\bIn today's digital landscape\b/gi, replacement: 'Today', label: "In today's digital landscape" },
  { pattern: /\bIt is worth mentioning\b/gi, replacement: 'Also', label: 'It is worth mentioning' },
  { pattern: /\bIn order to\b/gi, replacement: 'To', label: 'In order to' },
  { pattern: /\bDue to the fact that\b/gi, replacement: 'Because', label: 'Due to the fact that' },
  { pattern: /\bAt the end of the day\b/gi, replacement: 'Ultimately', label: 'At the end of the day' },
  { pattern: /\bIt goes without saying\b/gi, replacement: '', label: 'It goes without saying' },
  { pattern: /\bNeedless to say\b/gi, replacement: '', label: 'Needless to say' },
  { pattern: /\bAs a matter of fact\b/gi, replacement: 'In fact', label: 'As a matter of fact' },
  { pattern: /\bTake into consideration\b/gi, replacement: 'Consider', label: 'Take into consideration' },
];

export class HumanizerAgent extends BaseAgent {
  /**
   * Execute AI pattern removal and language refinement
   */
  protected async execute(task: Task): Promise<Result<TaskOutput, AgentError>> {
    await Promise.resolve();
    try {
      // Validate input
      const input = task.input as unknown as HumanizerInput;

      if (!input.content) {
        return Err({
          agent: this.name,
          message: 'Invalid input: content is required',
        });
      }

      // Detect and replace AI patterns
      const { text: refinedBody, changes: bodyChanges } = this.replaceAiPatterns(input.content.body);
      const { text: refinedTitle, changes: titleChanges } = this.replaceAiPatterns(input.content.title);

      const allChanges = [
        ...bodyChanges.map(c => `Body: ${c}`),
        ...titleChanges.map(c => `Title: ${c}`),
      ];

      // Check sentence variety
      const varietyIssues = this.checkSentenceVariety(refinedBody);
      allChanges.push(...varietyIssues);

      // Calculate AI pattern score (0 = fully human, 100 = very AI-like)
      const aiPatternScore = this.calculateAiPatternScore(input.content.body);

      const refinedContent: ChannelContent = {
        ...input.content,
        title: refinedTitle,
        body: refinedBody,
      };

      const output: HumanizerOutput = {
        content: refinedContent,
        changes: allChanges,
        aiPatternScore,
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
   * Replace AI patterns with natural alternatives
   */
  private replaceAiPatterns(text: string): { text: string; changes: string[] } {
    const changes: string[] = [];
    let result = text;

    for (const { pattern, replacement, label } of AI_PATTERNS) {
      const matches = result.match(pattern);
      if (matches) {
        const count = matches.length;
        result = result.replace(pattern, replacement);
        changes.push(`Replaced "${label}" with "${replacement}" (${count}x)`);
      }
    }

    // Clean up double spaces from empty replacements
    result = result.replace(/ {2,}/g, ' ').trim();

    return { text: result, changes };
  }

  /**
   * Check sentence variety (length distribution)
   */
  private checkSentenceVariety(text: string): string[] {
    const issues: string[] = [];

    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (sentences.length < 2) {
      return issues;
    }

    const lengths = sentences.map(s => s.split(/\s+/).length);

    // Check for uniform sentence length
    const avgLength = lengths.reduce((sum, l) => sum + l, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev < 3 && sentences.length >= 3) {
      issues.push(`Low sentence variety detected: standard deviation ${stdDev.toFixed(1)} words`);
    }

    // Check for too many long sentences
    const longSentences = lengths.filter(l => l > 25).length;
    const longRatio = longSentences / lengths.length;
    if (longRatio > 0.5) {
      issues.push(`Too many long sentences: ${Math.round(longRatio * 100)}% exceed 25 words`);
    }

    // Check for repetitive sentence starts
    const starts = sentences.map(s => s.split(/\s+/)[0]?.toLowerCase() ?? '');
    const startCounts = new Map<string, number>();
    for (const start of starts) {
      startCounts.set(start, (startCounts.get(start) ?? 0) + 1);
    }

    for (const [word, count] of startCounts) {
      if (count >= 3 && word.length > 0) {
        issues.push(`Repetitive sentence start: "${word}" used ${count} times`);
      }
    }

    return issues;
  }

  /**
   * Calculate AI pattern score (0 = fully human, 100 = very AI-like)
   */
  private calculateAiPatternScore(text: string): number {
    let patternCount = 0;

    for (const { pattern } of AI_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) {
        patternCount += matches.length;
      }
    }

    // Normalize to 0-100 scale
    // More than 5 patterns = very AI-like
    const score = Math.min(patternCount * 20, 100);

    return score;
  }
}
