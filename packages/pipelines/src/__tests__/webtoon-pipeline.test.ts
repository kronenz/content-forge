/**
 * Tests for webtoon pipeline
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WebtoonPipeline } from '../webtoon-pipeline.js';
import type { RawContent, Material } from '@content-forge/core';

describe('WebtoonPipeline', () => {
  let pipeline: WebtoonPipeline;

  const mockMaterial: Material = {
    id: 'mat_webtoon_001',
    source: 'test',
    url: 'https://example.com',
    title: 'Test Webtoon Story',
    content: 'The hero stood at the edge of the cliff overlooking the valley. Dark clouds gathered above as the storm approached from the mountains. A mysterious figure appeared behind the trees in the forest. The two characters faced each other with determination in their eyes. Lightning struck the ground between them creating a crater. They began their epic battle that would decide the fate of the kingdom. The villain revealed a hidden power that surprised everyone watching. In the end the hero found inner strength to overcome all obstacles.',
    score: 8,
    tags: ['action', 'fantasy', 'adventure'],
    status: 'scored',
    collectedAt: new Date(),
    createdAt: new Date()
  };

  beforeEach(() => {
    pipeline = new WebtoonPipeline();
  });

  describe('pipeline properties', () => {
    it('should have correct type', () => {
      expect(pipeline.type).toBe('webtoon');
    });

    it('should have correct output channels', () => {
      expect(pipeline.outputChannels).toEqual(['webtoon']);
    });
  });

  describe('process', () => {
    it('should process content for webtoon channel', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'webtoon',
        targetChannels: ['webtoon']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].channel).toBe('webtoon');
      }
    });

    it('should generate panels with default count of 6', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'webtoon',
        targetChannels: ['webtoon']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value[0];
        expect(output.metadata.panelCount).toBe(6);
        const panels = output.metadata.panels as Array<{ order: number }>;
        expect(panels).toHaveLength(6);
      }
    });

    it('should include panel data in metadata', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'webtoon',
        targetChannels: ['webtoon']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const output = result.value[0];
        const panels = output.metadata.panels as Array<{
          order: number;
          imagePrompt: string;
          dialogue: string;
          narration: string;
        }>;

        expect(panels[0].order).toBe(1);
        expect(panels[0].imagePrompt).toBeTruthy();
        expect(typeof panels[0].dialogue).toBe('string');
        expect(typeof panels[0].narration).toBe('string');
      }
    });

    it('should use vertical-scroll format', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'webtoon',
        targetChannels: ['webtoon']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].metadata.format).toBe('vertical-scroll');
      }
    });

    it('should set correct title from material', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'webtoon',
        targetChannels: ['webtoon']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].title).toBe('Test Webtoon Story');
      }
    });

    it('should include tags in metadata', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'webtoon',
        targetChannels: ['webtoon']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].metadata.tags).toEqual(['action', 'fantasy', 'adventure']);
      }
    });

    it('should format body with panel separators', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'webtoon',
        targetChannels: ['webtoon']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const body = result.value[0].body;
        expect(body).toContain('[Panel 1/');
        expect(body).toContain('---');
      }
    });

    it('should handle material with insufficient content', async () => {
      const shortMaterial: Material = {
        ...mockMaterial,
        content: 'Short.'
      };

      const rawContent: RawContent = {
        material: shortMaterial,
        pipelineType: 'webtoon',
        targetChannels: ['webtoon']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.stage).toBe('extract_scenario');
        expect(result.error.message).toContain('No key points extracted');
      }
    });

    it('should handle unsupported channel', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'webtoon',
        targetChannels: ['youtube' as any]
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.stage).toBe('assemble');
        expect(result.error.message).toContain('Unsupported channel');
      }
    });

    it('should generate image prompts with style prefix', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'webtoon',
        targetChannels: ['webtoon']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const panels = result.value[0].metadata.panels as Array<{ imagePrompt: string }>;
        // Default style is manhwa
        expect(panels[0].imagePrompt).toContain('manhwa style');
      }
    });
  });

  describe('custom configuration', () => {
    it('should respect custom panel count', async () => {
      const customPipeline = new WebtoonPipeline({ panelCount: 4 });

      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'webtoon',
        targetChannels: ['webtoon']
      };

      const result = await customPipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].metadata.panelCount).toBe(4);
      }
    });

    it('should clamp panel count to 4 minimum', async () => {
      const customPipeline = new WebtoonPipeline({ panelCount: 2 });

      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'webtoon',
        targetChannels: ['webtoon']
      };

      const result = await customPipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const panelCount = result.value[0].metadata.panelCount as number;
        expect(panelCount).toBeGreaterThanOrEqual(4);
      }
    });

    it('should clamp panel count to 8 maximum', async () => {
      const customPipeline = new WebtoonPipeline({ panelCount: 12 });

      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'webtoon',
        targetChannels: ['webtoon']
      };

      const result = await customPipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const panelCount = result.value[0].metadata.panelCount as number;
        expect(panelCount).toBeLessThanOrEqual(8);
      }
    });

    it('should use manga style when configured', async () => {
      const mangaPipeline = new WebtoonPipeline({ style: 'manga' });

      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'webtoon',
        targetChannels: ['webtoon']
      };

      const result = await mangaPipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].metadata.style).toBe('manga');
        const panels = result.value[0].metadata.panels as Array<{ imagePrompt: string }>;
        expect(panels[0].imagePrompt).toContain('manga style');
      }
    });

    it('should use custom width', async () => {
      const customPipeline = new WebtoonPipeline({ width: 1200 });

      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'webtoon',
        targetChannels: ['webtoon']
      };

      const result = await customPipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].metadata.width).toBe(1200);
      }
    });
  });
});
