/**
 * Tests for longform video pipeline
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LongformPipeline } from '../longform-pipeline.js';
import type { RawContent, Material, VideoScript } from '@content-forge/core';

// Mock callClaude
vi.mock('../claude-api.js', () => ({
  callClaude: vi.fn(),
}));

// Mock TTS
vi.mock('../tts-client.js', () => ({
  generateTTSBatch: vi.fn(),
}));

import { callClaude } from '../claude-api.js';
import { generateTTSBatch } from '../tts-client.js';

const mockCallClaude = vi.mocked(callClaude);
const mockGenerateTTSBatch = vi.mocked(generateTTSBatch);

describe('LongformPipeline', () => {
  let pipeline: LongformPipeline;

  const mockConfig = {
    claude: {
      apiKey: 'test-key',
      model: 'claude-sonnet-4-20250514',
      maxRetries: 1,
      baseDelayMs: 100,
    },
    tts: {
      apiKey: 'test-tts-key',
      voiceId: 'test-voice',
      modelId: 'eleven_multilingual_v2',
      maxRetries: 1,
      baseDelayMs: 100,
      outputDir: '/tmp/tts',
    },
  };

  const mockMaterial: Material = {
    id: 'mat_video_1',
    source: 'test',
    url: 'https://example.com/ai-trends',
    title: 'AI 트렌드 2025: 주요 변화와 전망',
    content: 'AI 시장은 2025년에 급격히 성장하고 있습니다. 생성형 AI가 산업 전반에 혁신을 가져오고 있으며, 특히 콘텐츠 제작 분야에서 큰 변화가 일어나고 있습니다. 자동화된 콘텐츠 파이프라인이 등장하면서 1인 크리에이터도 전문적인 콘텐츠를 대량 생산할 수 있게 되었습니다.',
    score: 9,
    tags: ['AI', '트렌드', '생성형AI'],
    status: 'scored',
    collectedAt: new Date(),
    createdAt: new Date(),
  };

  const mockScript: VideoScript = {
    title: 'AI 트렌드 2025: 주요 변화와 전망',
    scenes: [
      {
        id: 'scene_1',
        sceneType: 'title-card',
        narration: '안녕하세요, 오늘은 2025년 AI 트렌드에 대해 알아보겠습니다.',
        visualPrompt: '타이틀 카드: AI 트렌드 2025',
        presenterEnabled: true,
        presenterGesture: 'talking',
        durationEstimateMs: 5000,
      },
      {
        id: 'scene_2',
        sceneType: 'chart',
        narration: 'AI 시장 규모는 2025년에 전년 대비 40% 성장했습니다.',
        visualPrompt: '성장 차트: 2020-2025 AI 시장 규모',
        presenterEnabled: true,
        presenterGesture: 'explaining',
        durationEstimateMs: 8000,
      },
      {
        id: 'scene_3',
        sceneType: 'diagram',
        narration: '특히 콘텐츠 자동화 분야가 주목받고 있습니다.',
        visualPrompt: '콘텐츠 자동화 파이프라인 다이어그램',
        presenterEnabled: false,
        durationEstimateMs: 7000,
      },
    ],
    totalEstimatedDurationMs: 20000,
    aspectRatio: '16:9',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    pipeline = new LongformPipeline(mockConfig);
  });

  describe('pipeline properties', () => {
    it('should have correct type', () => {
      expect(pipeline.type).toBe('longform');
    });

    it('should have correct output channels', () => {
      expect(pipeline.outputChannels).toEqual(['youtube']);
    });
  });

  describe('generateVideoScript', () => {
    it('should generate a valid video script', async () => {
      mockCallClaude.mockResolvedValue({
        ok: true,
        value: JSON.stringify(mockScript),
      });

      const content: RawContent = {
        material: mockMaterial,
        pipelineType: 'longform',
        targetChannels: ['youtube'],
      };

      const result = await pipeline.generateVideoScript(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.title).toBe('AI 트렌드 2025: 주요 변화와 전망');
        expect(result.value.scenes).toHaveLength(3);
        expect(result.value.aspectRatio).toBe('16:9');
        expect(result.value.scenes[0].sceneType).toBe('title-card');
        expect(result.value.scenes[0].presenterEnabled).toBe(true);
      }
    });

    it('should handle Claude API response with code fences', async () => {
      mockCallClaude.mockResolvedValue({
        ok: true,
        value: '```json\n' + JSON.stringify(mockScript) + '\n```',
      });

      const content: RawContent = {
        material: mockMaterial,
        pipelineType: 'longform',
        targetChannels: ['youtube'],
      };

      const result = await pipeline.generateVideoScript(content);
      expect(result.ok).toBe(true);
    });

    it('should handle Claude API error', async () => {
      mockCallClaude.mockResolvedValue({
        ok: false,
        error: { message: 'Rate limit exceeded', statusCode: 429, retryable: true },
      });

      const content: RawContent = {
        material: mockMaterial,
        pipelineType: 'longform',
        targetChannels: ['youtube'],
      };

      const result = await pipeline.generateVideoScript(content);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.stage).toBe('generate_script');
      }
    });

    it('should handle invalid JSON from Claude', async () => {
      mockCallClaude.mockResolvedValue({
        ok: true,
        value: 'This is not JSON at all',
      });

      const content: RawContent = {
        material: mockMaterial,
        pipelineType: 'longform',
        targetChannels: ['youtube'],
      };

      const result = await pipeline.generateVideoScript(content);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.stage).toBe('generate_script');
        expect(result.error.message).toContain('Failed to parse');
      }
    });

    it('should handle empty scenes from Claude', async () => {
      const emptyScript = { ...mockScript, scenes: [] };
      mockCallClaude.mockResolvedValue({
        ok: true,
        value: JSON.stringify(emptyScript),
      });

      const content: RawContent = {
        material: mockMaterial,
        pipelineType: 'longform',
        targetChannels: ['youtube'],
      };

      const result = await pipeline.generateVideoScript(content);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Script validation failed');
      }
    });
  });

  describe('process (full pipeline)', () => {
    it('should process content through all stages', async () => {
      mockCallClaude.mockResolvedValue({
        ok: true,
        value: JSON.stringify(mockScript),
      });

      mockGenerateTTSBatch.mockResolvedValue({
        ok: true,
        value: [
          { sceneId: 'scene_1', audioFilePath: '/tmp/scene_1.mp3', durationMs: 5000, startOffsetMs: 0 },
          { sceneId: 'scene_2', audioFilePath: '/tmp/scene_2.mp3', durationMs: 8000, startOffsetMs: 5000 },
          { sceneId: 'scene_3', audioFilePath: '/tmp/scene_3.mp3', durationMs: 7000, startOffsetMs: 13000 },
        ],
      });

      const content: RawContent = {
        material: mockMaterial,
        pipelineType: 'longform',
        targetChannels: ['youtube'],
      };

      const result = await pipeline.process(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].channel).toBe('youtube');
        expect(result.value[0].title).toBe('AI 트렌드 2025: 주요 변화와 전망');
        expect(result.value[0].metadata.format).toBe('video-project');
        expect(result.value[0].metadata.aspectRatio).toBe('16:9');
        expect(result.value[0].metadata.sceneCount).toBe(3);
        expect(result.value[0].metadata.totalDurationMs).toBe(20000);
        expect(result.value[0].metadata.presenterScenes).toBe(2);
      }
    });

    it('should handle TTS failure', async () => {
      mockCallClaude.mockResolvedValue({
        ok: true,
        value: JSON.stringify(mockScript),
      });

      mockGenerateTTSBatch.mockResolvedValue({
        ok: false,
        error: { message: 'TTS service unavailable', retryable: true },
      });

      const content: RawContent = {
        material: mockMaterial,
        pipelineType: 'longform',
        targetChannels: ['youtube'],
      };

      const result = await pipeline.process(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.stage).toBe('generate_audio');
      }
    });
  });
});
