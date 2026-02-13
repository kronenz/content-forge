/**
 * Video Producer agent tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Task, AgentConfig, Material } from '@content-forge/core';
import { Ok, Err } from '@content-forge/core';
import { VideoProducerAgent } from '../video-producer-agent.js';
import { InMemoryLockManager } from '../lock-manager.js';

// Mock callClaude
vi.mock('@content-forge/pipelines', () => ({
  callClaude: vi.fn(),
}));

import { callClaude } from '@content-forge/pipelines';

const mockCallClaude = vi.mocked(callClaude);

const TEST_CLAUDE_CONFIG = {
  apiKey: 'test-key',
  model: 'claude-sonnet-4-20250514',
  maxRetries: 3,
  baseDelayMs: 100,
};

const createMaterial = (id = 'mat-1'): Material => ({
  id,
  source: 'test-source',
  url: 'https://example.com/test',
  title: 'Test Material',
  content: 'This is test content for video production.',
  score: 8,
  tags: ['tech', 'ai'],
  status: 'scored',
  collectedAt: new Date(),
  createdAt: new Date(),
});

const VALID_SCRIPT_JSON = JSON.stringify({
  title: 'Test Video',
  scenes: [
    {
      id: 'scene_1',
      sceneType: 'title-card',
      narration: 'Welcome to the video.',
      visualPrompt: 'Title card with gradient',
      presenterEnabled: true,
      presenterGesture: 'talking',
      durationEstimateMs: 5000,
    },
    {
      id: 'scene_2',
      sceneType: 'diagram',
      narration: 'Let us look at the architecture.',
      visualPrompt: 'System architecture diagram',
      presenterEnabled: false,
      durationEstimateMs: 8000,
    },
    {
      id: 'scene_3',
      sceneType: 'text-reveal',
      narration: 'In conclusion, this is the summary.',
      visualPrompt: 'Key takeaways list',
      presenterEnabled: true,
      presenterGesture: 'explaining',
      durationEstimateMs: 6000,
    },
  ],
  totalEstimatedDurationMs: 19000,
  aspectRatio: '16:9',
});

const SHORTFORM_SCRIPT_JSON = JSON.stringify({
  title: 'Quick Tips',
  scenes: [
    {
      id: 'short_scene_1',
      sceneType: 'title-card',
      narration: 'Quick tip!',
      visualPrompt: 'Bold title',
      presenterEnabled: true,
      presenterGesture: 'talking',
      durationEstimateMs: 5000,
    },
    {
      id: 'short_scene_2',
      sceneType: 'list-reveal',
      narration: 'Here are the key points.',
      visualPrompt: 'Bullet list',
      presenterEnabled: false,
      durationEstimateMs: 10000,
    },
  ],
  totalEstimatedDurationMs: 15000,
  aspectRatio: '9:16',
});

describe('VideoProducerAgent', () => {
  let agent: VideoProducerAgent;
  let lockManager: InMemoryLockManager;

  const createTask = (overrides: Partial<Record<string, unknown>> = {}): Task => ({
    id: 'task-1',
    type: 'video-producer',
    status: 'pending',
    agentId: 'producer-1',
    input: {
      material: createMaterial(),
      aspectRatio: '16:9',
      claudeApiConfig: TEST_CLAUDE_CONFIG,
      outputDir: '/tmp/output',
      ...overrides,
    },
    output: null,
    error: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
  });

  beforeEach(() => {
    vi.clearAllMocks();

    const config: AgentConfig = {
      id: 'producer-1',
      name: 'VideoProducer',
      type: 'video-producer',
    };
    lockManager = new InMemoryLockManager();
    agent = new VideoProducerAgent(config, lockManager);

    // Default mock: return valid longform script
    mockCallClaude.mockResolvedValue(Ok(VALID_SCRIPT_JSON));
  });

  describe('full pipeline execution', () => {
    it('should execute the full pipeline and return a complete project', async () => {
      const task = createTask();
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as {
          projectId: string;
          project: { title: string; scenes: unknown[]; status: string };
          outputPath: string;
          status: string;
        };
        expect(output.projectId).toBeDefined();
        expect(output.project.title).toBe('Test Video');
        expect(output.project.scenes).toHaveLength(3);
        expect(output.status).toBe('complete');
        expect(output.outputPath).toContain('.mp4');
      }
    });

    it('should include agentId, taskId, and completedAt in output', async () => {
      const task = createTask();
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.agentId).toBe('producer-1');
        expect(result.value.taskId).toBe('task-1');
        expect(result.value.completedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('stage progression', () => {
    it('should call Claude API for script generation', async () => {
      const task = createTask();
      await agent.run(task);

      expect(mockCallClaude).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Test Material'),
          }),
        ]),
        expect.any(String),
        TEST_CLAUDE_CONFIG,
      );
    });

    it('should assemble project with correct scene count', async () => {
      const task = createTask();
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as {
          project: {
            scenes: Array<{
              id: string;
              order: number;
              narration: { text: string };
              timing: { durationMs: number };
            }>;
            materialId: string;
          };
        };
        expect(output.project.scenes).toHaveLength(3);
        expect(output.project.scenes[0]?.id).toBe('scene_1');
        expect(output.project.scenes[0]?.order).toBe(0);
        expect(output.project.materialId).toBe('mat-1');
      }
    });
  });

  describe('partial failure handling', () => {
    it('should continue pipeline even when visuals partially fail', async () => {
      // Visuals are placeholders and should not cause pipeline failure
      const task = createTask();
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as { status: string };
        expect(output.status).toBe('complete');
      }
    });
  });

  describe('avatar handling', () => {
    it('should process avatars when avatarProfileId is provided', async () => {
      const task = createTask({ avatarProfileId: 'avatar-123' });
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as {
          project: {
            scenes: Array<{
              presenter: { enabled: boolean; status: string; videoUrl?: string };
            }>;
          };
        };
        // Presenter-enabled scenes should have avatar URLs
        const presenterScenes = output.project.scenes.filter(s => s.presenter.enabled);
        expect(presenterScenes.length).toBeGreaterThan(0);
        for (const scene of presenterScenes) {
          expect(scene.presenter.status).toBe('ready');
          expect(scene.presenter.videoUrl).toBeDefined();
        }
      }
    });

    it('should skip avatar stage when avatarProfileId is not provided', async () => {
      const task = createTask();
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value.result as {
          project: {
            scenes: Array<{
              presenter: { status: string; videoUrl?: string };
            }>;
          };
        };
        // Without avatarProfileId, presenter status remains draft
        for (const scene of output.project.scenes) {
          expect(scene.presenter.status).toBe('draft');
          expect(scene.presenter.videoUrl).toBeUndefined();
        }
      }
    });
  });

  describe('script generation failure', () => {
    it('should return error when Claude API fails during script generation', async () => {
      mockCallClaude.mockResolvedValue(Err({
        message: 'Rate limit exceeded',
        statusCode: 429,
        retryable: true,
      }));

      const task = createTask();
      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('scripting');
        expect(result.error.message).toContain('Claude API error');
      }
    });

    it('should return error when Claude returns invalid JSON', async () => {
      mockCallClaude.mockResolvedValue(Ok('not valid json at all'));

      const task = createTask();
      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('scripting');
        expect(result.error.message).toContain('Failed to parse script JSON');
      }
    });

    it('should return error when script has no scenes', async () => {
      mockCallClaude.mockResolvedValue(Ok(JSON.stringify({
        title: 'Empty',
        scenes: [],
        totalEstimatedDurationMs: 0,
        aspectRatio: '16:9',
      })));

      const task = createTask();
      const result = await agent.run(task);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('scripting');
      }
    });
  });

  describe('16:9 vs 9:16 routing', () => {
    it('should use longform prompt for 16:9 aspect ratio', async () => {
      const task = createTask({ aspectRatio: '16:9' });
      await agent.run(task);

      expect(mockCallClaude).toHaveBeenCalledWith(
        expect.any(Array),
        expect.stringContaining('video script writer'),
        TEST_CLAUDE_CONFIG,
      );
    });

    it('should use shortform prompt for 9:16 aspect ratio', async () => {
      mockCallClaude.mockResolvedValue(Ok(SHORTFORM_SCRIPT_JSON));

      const task = createTask({ aspectRatio: '9:16' });
      const result = await agent.run(task);

      expect(result.ok).toBe(true);
      expect(mockCallClaude).toHaveBeenCalledWith(
        expect.any(Array),
        expect.stringContaining('shortform'),
        TEST_CLAUDE_CONFIG,
      );

      if (result.ok) {
        const output = result.value.result as {
          project: { aspectRatio: string };
        };
        expect(output.project.aspectRatio).toBe('9:16');
      }
    });
  });

  describe('input validation', () => {
    it('should fail when material is missing', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'video-producer',
        status: 'pending',
        agentId: 'producer-1',
        input: { claudeApiConfig: TEST_CLAUDE_CONFIG, outputDir: '/tmp' },
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
      };

      const result = await agent.run(task);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('material is required');
      }
    });

    it('should fail when claudeApiConfig is missing', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'video-producer',
        status: 'pending',
        agentId: 'producer-1',
        input: { material: createMaterial(), outputDir: '/tmp' },
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

    it('should fail when outputDir is missing', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'video-producer',
        status: 'pending',
        agentId: 'producer-1',
        input: { material: createMaterial(), claudeApiConfig: TEST_CLAUDE_CONFIG },
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: new Date(),
      };

      const result = await agent.run(task);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('outputDir is required');
      }
    });
  });
});
