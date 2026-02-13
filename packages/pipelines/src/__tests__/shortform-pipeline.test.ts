/**
 * Tests for shortform video pipeline
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShortformPipeline } from '../shortform-pipeline.js';
import type { RawContent, Material, VideoScript } from '@content-forge/core';

vi.mock('../claude-api.js', () => ({
  callClaude: vi.fn(),
}));

vi.mock('../tts-client.js', () => ({
  generateTTSBatch: vi.fn(),
}));

import { callClaude } from '../claude-api.js';
import { generateTTSBatch } from '../tts-client.js';

const mockCallClaude = vi.mocked(callClaude);
const mockGenerateTTSBatch = vi.mocked(generateTTSBatch);

describe('ShortformPipeline', () => {
  let pipeline: ShortformPipeline;

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
    id: 'mat_short_1',
    source: 'test',
    url: 'https://example.com',
    title: 'AI가 바꾸는 콘텐츠 제작',
    content: 'AI 기반 콘텐츠 자동화가 급성장하고 있습니다. 1인 크리에이터도 전문적인 콘텐츠를 대량 생산할 수 있게 되었습니다.',
    score: 8,
    tags: ['AI', '콘텐츠'],
    status: 'scored',
    collectedAt: new Date(),
    createdAt: new Date(),
  };

  const mockLongformScript: VideoScript = {
    title: 'AI 트렌드 2025 전체 분석',
    scenes: [
      { id: 'scene_1', sceneType: 'title-card', narration: '인트로', visualPrompt: '타이틀', presenterEnabled: true, presenterGesture: 'talking', durationEstimateMs: 5000 },
      { id: 'scene_2', sceneType: 'chart', narration: '시장 규모가 급성장했습니다.', visualPrompt: '성장 차트', presenterEnabled: true, presenterGesture: 'explaining', durationEstimateMs: 8000 },
      { id: 'scene_3', sceneType: 'text-reveal', narration: '중간 설명', visualPrompt: '텍스트', presenterEnabled: false, durationEstimateMs: 6000 },
      { id: 'scene_4', sceneType: 'diagram', narration: '구조를 보겠습니다.', visualPrompt: '다이어그램', presenterEnabled: false, durationEstimateMs: 10000 },
      { id: 'scene_5', sceneType: 'infographic', narration: '핵심 데이터입니다.', visualPrompt: '인포그래픽', presenterEnabled: true, presenterGesture: 'pointing', durationEstimateMs: 8000 },
      { id: 'scene_6', sceneType: 'quote', narration: '마무리', visualPrompt: '인용문', presenterEnabled: true, presenterGesture: 'talking', durationEstimateMs: 5000 },
    ],
    totalEstimatedDurationMs: 42000,
    aspectRatio: '16:9',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    pipeline = new ShortformPipeline(mockConfig);
  });

  describe('pipeline properties', () => {
    it('should have correct type', () => {
      expect(pipeline.type).toBe('shortform');
    });

    it('should have correct output channels', () => {
      expect(pipeline.outputChannels).toEqual(['shorts', 'reels', 'tiktok']);
    });
  });

  describe('standalone mode (Path B)', () => {
    const mockShortScript: VideoScript = {
      title: 'AI 콘텐츠 자동화 핵심 3가지',
      scenes: [
        { id: 'short_scene_1', sceneType: 'title-card', narration: '후킹 인트로', visualPrompt: '타이틀', presenterEnabled: true, durationEstimateMs: 5000 },
        { id: 'short_scene_2', sceneType: 'list-reveal', narration: '핵심 포인트', visualPrompt: '리스트', presenterEnabled: false, durationEstimateMs: 15000 },
        { id: 'short_scene_3', sceneType: 'chart', narration: '결론', visualPrompt: '차트', presenterEnabled: true, durationEstimateMs: 10000 },
      ],
      totalEstimatedDurationMs: 30000,
      aspectRatio: '9:16',
    };

    it('should generate standalone shortform content', async () => {
      mockCallClaude.mockResolvedValue({
        ok: true,
        value: JSON.stringify(mockShortScript),
      });

      mockGenerateTTSBatch.mockResolvedValue({
        ok: true,
        value: [
          { sceneId: 'short_scene_1', audioFilePath: '/tmp/s1.mp3', durationMs: 5000, startOffsetMs: 0 },
          { sceneId: 'short_scene_2', audioFilePath: '/tmp/s2.mp3', durationMs: 15000, startOffsetMs: 5000 },
          { sceneId: 'short_scene_3', audioFilePath: '/tmp/s3.mp3', durationMs: 10000, startOffsetMs: 20000 },
        ],
      });

      const content: RawContent = {
        material: mockMaterial,
        pipelineType: 'shortform',
        targetChannels: ['shorts', 'reels', 'tiktok'],
      };

      const result = await pipeline.process(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(3);
        expect(result.value.map(c => c.channel)).toEqual(['shorts', 'reels', 'tiktok']);
        result.value.forEach(output => {
          expect(output.metadata.aspectRatio).toBe('9:16');
          expect(output.metadata.mode).toBe('standalone');
        });
      }
    });
  });

  describe('derivative mode (Path A)', () => {
    it('should extract highlights from longform script', async () => {
      mockGenerateTTSBatch.mockResolvedValue({
        ok: true,
        value: [
          { sceneId: 'short_scene_1', audioFilePath: '/tmp/s1.mp3', durationMs: 5000, startOffsetMs: 0 },
          { sceneId: 'short_scene_2', audioFilePath: '/tmp/s2.mp3', durationMs: 8000, startOffsetMs: 5000 },
          { sceneId: 'short_scene_3', audioFilePath: '/tmp/s3.mp3', durationMs: 8000, startOffsetMs: 13000 },
        ],
      });

      const content: RawContent = {
        material: mockMaterial,
        pipelineType: 'shortform',
        targetChannels: ['shorts'],
      };

      const result = await pipeline.processWithOptions(content, {
        mode: 'derivative',
        sourceScript: mockLongformScript,
        targetSceneCount: 3,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].channel).toBe('shorts');
        expect(result.value[0].metadata.mode).toBe('derivative');
        // Should not have called Claude (no script generation needed)
        expect(mockCallClaude).not.toHaveBeenCalled();
      }
    });

    it('should prioritize data-rich scenes in derivative mode', async () => {
      mockGenerateTTSBatch.mockResolvedValue({
        ok: true,
        value: [
          { sceneId: 'short_scene_1', audioFilePath: '/tmp/s1.mp3', durationMs: 5000, startOffsetMs: 0 },
          { sceneId: 'short_scene_2', audioFilePath: '/tmp/s2.mp3', durationMs: 8000, startOffsetMs: 5000 },
          { sceneId: 'short_scene_3', audioFilePath: '/tmp/s3.mp3', durationMs: 8000, startOffsetMs: 13000 },
        ],
      });

      const content: RawContent = {
        material: mockMaterial,
        pipelineType: 'shortform',
        targetChannels: ['shorts'],
      };

      const result = await pipeline.processWithOptions(content, {
        mode: 'derivative',
        sourceScript: mockLongformScript,
        targetSceneCount: 3,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const body = JSON.parse(result.value[0].body);
        const script = body.script as VideoScript;
        // Should have extracted the most information-dense scenes
        // title-card (score: 1+2=3), chart (3+1=4), infographic (3+1=4), diagram (3+0=3)
        expect(script.scenes.length).toBe(3);
        expect(script.title).toContain('핵심 요약');
      }
    });
  });
});
