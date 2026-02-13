/**
 * Visual Director agent tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Task, AgentConfig, VideoScriptScene, SceneVisualOutput } from '@content-forge/core';
import { Ok, Err } from '@content-forge/core';
import { VisualDirectorAgent } from '../visual-director-agent.js';
import { InMemoryLockManager } from '../lock-manager.js';

// Mock callClaude
vi.mock('@content-forge/pipelines', () => ({
  callClaude: vi.fn(),
}));

// Mock sanitizeSvg
vi.mock('@content-forge/video', () => ({
  sanitizeSvg: vi.fn(),
}));

import { callClaude } from '@content-forge/pipelines';
import { sanitizeSvg } from '@content-forge/video';

const mockCallClaude = vi.mocked(callClaude);
const mockSanitizeSvg = vi.mocked(sanitizeSvg);

const TEST_CONFIG = {
  apiKey: 'test-key',
  model: 'claude-sonnet-4-20250514',
  maxRetries: 3,
  baseDelayMs: 100,
};

describe('VisualDirectorAgent', () => {
  let agent: VisualDirectorAgent;
  let lockManager: InMemoryLockManager;

  const createScene = (
    id: string,
    sceneType: VideoScriptScene['sceneType'],
    visualPrompt = 'Test prompt',
  ): VideoScriptScene => ({
    id,
    sceneType,
    narration: 'Test narration',
    visualPrompt,
    presenterEnabled: false,
  });

  const createTask = (scenes: VideoScriptScene[]): Task => ({
    id: 'task-1',
    type: 'visual-director',
    status: 'pending',
    agentId: 'visual-director-1',
    input: { scenes, claudeApiConfig: TEST_CONFIG },
    output: null,
    error: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
  });

  const VALID_SVG = '<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#2563EB"/></svg>';
  const SANITIZED_SVG = '<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#2563EB"/></svg>';

  beforeEach(() => {
    vi.clearAllMocks();

    const config: AgentConfig = {
      id: 'visual-director-1',
      name: 'VisualDirector',
      type: 'visual-director',
    };
    lockManager = new InMemoryLockManager();
    agent = new VisualDirectorAgent(config, lockManager);

    // Default mock: return valid SVG
    mockCallClaude.mockResolvedValue(Ok(VALID_SVG));
    mockSanitizeSvg.mockReturnValue(Ok(SANITIZED_SVG));
  });

  describe('SVG scene types', () => {
    it('should generate SVG for diagram scene', async () => {
      const scenes = [createScene('s1', 'diagram', 'Architecture overview')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as { visuals: SceneVisualOutput[] };
        expect(output.visuals).toHaveLength(1);
        expect(output.visuals[0]?.sceneId).toBe('s1');
        expect(output.visuals[0]?.sceneType).toBe('diagram');
        expect(output.visuals[0]?.svgContent).toBe(SANITIZED_SVG);
      }

      expect(mockCallClaude).toHaveBeenCalledOnce();
      expect(mockSanitizeSvg).toHaveBeenCalledWith(VALID_SVG);
    });

    it('should generate SVG for chart scene', async () => {
      const scenes = [createScene('s1', 'chart', 'Revenue growth chart')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as { visuals: SceneVisualOutput[] };
        expect(output.visuals[0]?.sceneType).toBe('chart');
        expect(output.visuals[0]?.svgContent).toBe(SANITIZED_SVG);
      }
    });

    it('should generate SVG for timeline scene', async () => {
      const scenes = [createScene('s1', 'timeline')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as { visuals: SceneVisualOutput[] };
        expect(output.visuals[0]?.sceneType).toBe('timeline');
        expect(output.visuals[0]?.svgContent).toBe(SANITIZED_SVG);
      }
    });

    it('should generate SVG for infographic scene', async () => {
      const scenes = [createScene('s1', 'infographic')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as { visuals: SceneVisualOutput[] };
        expect(output.visuals[0]?.sceneType).toBe('infographic');
        expect(output.visuals[0]?.svgContent).toBe(SANITIZED_SVG);
      }
    });

    it('should generate SVG for comparison scene', async () => {
      const scenes = [createScene('s1', 'comparison')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as { visuals: SceneVisualOutput[] };
        expect(output.visuals[0]?.sceneType).toBe('comparison');
        expect(output.visuals[0]?.svgContent).toBe(SANITIZED_SVG);
      }
    });

    it('should generate SVG for custom-svg scene', async () => {
      const scenes = [createScene('s1', 'custom-svg')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as { visuals: SceneVisualOutput[] };
        expect(output.visuals[0]?.sceneType).toBe('custom-svg');
        expect(output.visuals[0]?.svgContent).toBe(SANITIZED_SVG);
      }
    });

    it('should generate SVG for title-card scene', async () => {
      const scenes = [createScene('s1', 'title-card')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as { visuals: SceneVisualOutput[] };
        expect(output.visuals[0]?.sceneType).toBe('title-card');
        expect(output.visuals[0]?.svgContent).toBe(SANITIZED_SVG);
      }
    });

    it('should generate SVG for quote scene', async () => {
      const scenes = [createScene('s1', 'quote')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as { visuals: SceneVisualOutput[] };
        expect(output.visuals[0]?.sceneType).toBe('quote');
        expect(output.visuals[0]?.svgContent).toBe(SANITIZED_SVG);
      }
    });

    it('should extract SVG from response with surrounding text', async () => {
      const responseWithText = `Here is the SVG:\n${VALID_SVG}\nDone.`;
      mockCallClaude.mockResolvedValue(Ok(responseWithText));

      const scenes = [createScene('s1', 'diagram')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      expect(mockSanitizeSvg).toHaveBeenCalledWith(VALID_SVG);
    });
  });

  describe('template scene types', () => {
    it('should generate props for code-highlight scene', async () => {
      const jsonProps = '{"code": "console.log(1)", "language": "javascript", "highlightLines": [1]}';
      mockCallClaude.mockResolvedValue(Ok(jsonProps));

      const scenes = [createScene('s1', 'code-highlight')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as { visuals: SceneVisualOutput[] };
        expect(output.visuals[0]?.sceneType).toBe('code-highlight');
        expect(output.visuals[0]?.props).toEqual({
          code: 'console.log(1)',
          language: 'javascript',
          highlightLines: [1],
        });
        expect(output.visuals[0]?.svgContent).toBeUndefined();
      }

      // sanitizeSvg should NOT be called for template types
      expect(mockSanitizeSvg).not.toHaveBeenCalled();
    });

    it('should generate props for text-reveal scene', async () => {
      const jsonProps = '{"lines": ["Line 1", "Line 2"]}';
      mockCallClaude.mockResolvedValue(Ok(jsonProps));

      const scenes = [createScene('s1', 'text-reveal')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as { visuals: SceneVisualOutput[] };
        expect(output.visuals[0]?.props).toEqual({
          lines: ['Line 1', 'Line 2'],
        });
      }
    });

    it('should generate props for list-reveal scene', async () => {
      const jsonProps = '{"title": "Key Points", "items": ["Item 1", "Item 2"]}';
      mockCallClaude.mockResolvedValue(Ok(jsonProps));

      const scenes = [createScene('s1', 'list-reveal')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as { visuals: SceneVisualOutput[] };
        expect(output.visuals[0]?.props).toEqual({
          title: 'Key Points',
          items: ['Item 1', 'Item 2'],
        });
      }
    });

    it('should extract JSON from markdown code block', async () => {
      const wrappedJson = '```json\n{"lines": ["A", "B"]}\n```';
      mockCallClaude.mockResolvedValue(Ok(wrappedJson));

      const scenes = [createScene('s1', 'text-reveal')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as { visuals: SceneVisualOutput[] };
        expect(output.visuals[0]?.props).toEqual({ lines: ['A', 'B'] });
      }
    });
  });

  describe('passthrough scene types', () => {
    it('should handle transition scene without calling Claude', async () => {
      const scenes = [createScene('s1', 'transition')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as { visuals: SceneVisualOutput[] };
        expect(output.visuals[0]?.sceneType).toBe('transition');
        expect(output.visuals[0]?.props).toEqual({});
        expect(output.visuals[0]?.svgContent).toBeUndefined();
      }

      expect(mockCallClaude).not.toHaveBeenCalled();
      expect(mockSanitizeSvg).not.toHaveBeenCalled();
    });
  });

  describe('batch processing', () => {
    it('should process multiple scenes', async () => {
      const jsonProps = '{"lines": ["Test"]}';

      // First call returns SVG (for diagram), second returns JSON (for text-reveal)
      mockCallClaude
        .mockResolvedValueOnce(Ok(VALID_SVG))
        .mockResolvedValueOnce(Ok(jsonProps));

      const scenes = [
        createScene('s1', 'diagram'),
        createScene('s2', 'text-reveal'),
      ];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as { visuals: SceneVisualOutput[] };
        expect(output.visuals).toHaveLength(2);
        expect(output.visuals[0]?.sceneId).toBe('s1');
        expect(output.visuals[0]?.svgContent).toBe(SANITIZED_SVG);
        expect(output.visuals[1]?.sceneId).toBe('s2');
        expect(output.visuals[1]?.props).toEqual({ lines: ['Test'] });
      }

      expect(mockCallClaude).toHaveBeenCalledTimes(2);
    });

    it('should process mixed scene types including passthrough', async () => {
      const jsonProps = '{"title": "Points", "items": ["A"]}';

      mockCallClaude
        .mockResolvedValueOnce(Ok(VALID_SVG))
        .mockResolvedValueOnce(Ok(jsonProps));

      const scenes = [
        createScene('s1', 'chart'),
        createScene('s2', 'transition'),
        createScene('s3', 'list-reveal'),
      ];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as { visuals: SceneVisualOutput[] };
        expect(output.visuals).toHaveLength(3);
      }

      // Only 2 Claude calls (transition is passthrough)
      expect(mockCallClaude).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should fail when Claude API returns error', async () => {
      mockCallClaude.mockResolvedValue(Err({
        message: 'Rate limit exceeded',
        statusCode: 429,
        retryable: true,
      }));

      const scenes = [createScene('s1', 'diagram')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Claude API error');
        expect(result.error.message).toContain('Rate limit exceeded');
      }
    });

    it('should fail when Claude returns no SVG content', async () => {
      mockCallClaude.mockResolvedValue(Ok('This is just plain text with no SVG'));

      const scenes = [createScene('s1', 'diagram')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('No SVG content found');
      }
    });

    it('should fail when SVG sanitization fails', async () => {
      mockSanitizeSvg.mockReturnValue(Err({
        message: 'SVG exceeds maximum size',
        original: VALID_SVG.substring(0, 200),
      }));

      const scenes = [createScene('s1', 'diagram')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('SVG sanitization failed');
      }
    });

    it('should fail when template response is invalid JSON', async () => {
      mockCallClaude.mockResolvedValue(Ok('not valid json {{{'));

      const scenes = [createScene('s1', 'code-highlight')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Failed to parse JSON props');
      }
    });

    it('should fail with invalid input: missing scenes', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'visual-director',
        status: 'pending',
        agentId: 'visual-director-1',
        input: { claudeApiConfig: TEST_CONFIG },
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
      };

      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('scenes array is required');
      }
    });

    it('should fail with invalid input: missing claudeApiConfig', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'visual-director',
        status: 'pending',
        agentId: 'visual-director-1',
        input: { scenes: [createScene('s1', 'diagram')] },
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
      };

      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('claudeApiConfig is required');
      }
    });

    it('should stop processing on first scene failure', async () => {
      mockCallClaude
        .mockResolvedValueOnce(Ok('no svg here'))
        .mockResolvedValueOnce(Ok(VALID_SVG));

      const scenes = [
        createScene('s1', 'diagram'),
        createScene('s2', 'chart'),
      ];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      // Second scene should not be attempted
      expect(mockCallClaude).toHaveBeenCalledTimes(1);
    });
  });

  describe('task output format', () => {
    it('should include agentId, taskId, and completedAt', async () => {
      const scenes = [createScene('s1', 'diagram')];
      const task = createTask(scenes);
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.agentId).toBe('visual-director-1');
        expect(result.value.taskId).toBe('task-1');
        expect(result.value.completedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('Claude API call parameters', () => {
    it('should pass visualPrompt in user message for SVG scenes', async () => {
      const scenes = [createScene('s1', 'diagram', 'Show data flow architecture')];
      const task = createTask(scenes);
      await agent.run(task);

      expect(mockCallClaude).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Show data flow architecture'),
          }),
        ]),
        expect.any(String),
        TEST_CONFIG,
      );
    });

    it('should pass SVG system prompt for SVG scene types', async () => {
      const scenes = [createScene('s1', 'diagram')];
      const task = createTask(scenes);
      await agent.run(task);

      expect(mockCallClaude).toHaveBeenCalledWith(
        expect.any(Array),
        expect.stringContaining('SVG'),
        TEST_CONFIG,
      );
    });

    it('should pass template system prompt for template scene types', async () => {
      const jsonProps = '{"lines": ["test"]}';
      mockCallClaude.mockResolvedValue(Ok(jsonProps));

      const scenes = [createScene('s1', 'text-reveal')];
      const task = createTask(scenes);
      await agent.run(task);

      expect(mockCallClaude).toHaveBeenCalledWith(
        expect.any(Array),
        expect.stringContaining('JSON'),
        TEST_CONFIG,
      );
    });
  });
});
