/**
 * Tests for snackable pipeline
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SnackablePipeline } from '../snackable-pipeline.js';
import type { RawContent, Material } from '@content-forge/core';

describe('SnackablePipeline', () => {
  let pipeline: SnackablePipeline;

  const mockMaterial: Material = {
    id: 'mat_456',
    source: 'test',
    url: 'https://example.com',
    title: 'Test Instagram Content',
    content: 'This is a test sentence about visual storytelling. Instagram marketing is transforming brands. Visual content drives engagement better. Stories create immediate connection with audiences. Carousel posts get higher reach than single posts. Consistency is key to growing your audience. Hashtags help discoverability on the platform. Reels are the fastest growing format right now.',
    score: 9,
    tags: ['Instagram', 'Marketing', 'Visual'],
    status: 'scored',
    collectedAt: new Date(),
    createdAt: new Date()
  };

  beforeEach(() => {
    pipeline = new SnackablePipeline();
  });

  describe('process', () => {
    it('should process content for all 3 target channels', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'snackable',
        targetChannels: ['ig-carousel', 'ig-single', 'ig-story']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(3);
        expect(result.value.map(c => c.channel)).toEqual(['ig-carousel', 'ig-single', 'ig-story']);
      }
    });

    it('should generate carousel content with correct format', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'snackable',
        targetChannels: ['ig-carousel']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const carouselContent = result.value[0];
        expect(carouselContent).toBeDefined();
        if (carouselContent) {
          expect(carouselContent.channel).toBe('ig-carousel');
          expect(carouselContent.title).toBe('Test Instagram Content');
          expect(carouselContent.metadata.format).toBe('carousel');
          expect(carouselContent.metadata.tags).toEqual(['Instagram', 'Marketing', 'Visual']);

          // Verify slides are numbered
          const slides = carouselContent.body.split(/\n\n---\n\n/);
          expect(slides[0]).toMatch(/^\[1\//);
        }
      }
    });

    it('should generate carousel with 5-10 slides', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'snackable',
        targetChannels: ['ig-carousel']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const carouselContent = result.value[0];
        expect(carouselContent).toBeDefined();
        if (carouselContent) {
          const slideCount = carouselContent.metadata.slideCount as number;
          expect(slideCount).toBeGreaterThanOrEqual(5);
          expect(slideCount).toBeLessThanOrEqual(10);
        }
      }
    });

    it('should generate single post content with correct format', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'snackable',
        targetChannels: ['ig-single']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const singleContent = result.value[0];
        expect(singleContent).toBeDefined();
        if (singleContent) {
          expect(singleContent.channel).toBe('ig-single');
          expect(singleContent.title).toBe('Test Instagram Content');
          expect(singleContent.metadata.format).toBe('single');
          expect(singleContent.body.length).toBeGreaterThanOrEqual(100);
          expect(singleContent.body.length).toBeLessThanOrEqual(2200);
          expect(singleContent.body).toContain('#Instagram');
        }
      }
    });

    it('should generate story content with correct format', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'snackable',
        targetChannels: ['ig-story']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const storyContent = result.value[0];
        expect(storyContent).toBeDefined();
        if (storyContent) {
          expect(storyContent.channel).toBe('ig-story');
          expect(storyContent.title).toBe('Test Instagram Content');
          expect(storyContent.metadata.format).toBe('story');

          // Verify frame count is 3-5
          const frameCount = storyContent.metadata.frameCount as number;
          expect(frameCount).toBeGreaterThanOrEqual(3);
          expect(frameCount).toBeLessThanOrEqual(5);

          // Verify hook exists
          const hook = storyContent.metadata.hook as string;
          expect(hook.length).toBeGreaterThanOrEqual(10);
          expect(hook.length).toBeLessThanOrEqual(100);
        }
      }
    });

    it('should handle material with insufficient content', async () => {
      const shortMaterial: Material = {
        ...mockMaterial,
        content: 'Short.'
      };

      const rawContent: RawContent = {
        material: shortMaterial,
        pipelineType: 'snackable',
        targetChannels: ['ig-carousel']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.stage).toBe('extract_key_points');
        expect(result.error.message).toContain('No key points extracted');
      }
    });

    it('should handle unsupported channel', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'snackable',
        targetChannels: ['youtube' as any]
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.stage).toBe('generate_channel_content');
        expect(result.error.message).toContain('Unsupported channel');
      }
    });

    it('should pad carousel slides when content has few key points', async () => {
      const fewPointsMaterial: Material = {
        ...mockMaterial,
        content: 'This is one long enough sentence about visual content. And here is another sentence about marketing strategies.'
      };

      const rawContent: RawContent = {
        material: fewPointsMaterial,
        pipelineType: 'snackable',
        targetChannels: ['ig-carousel']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const carouselContent = result.value[0];
        expect(carouselContent).toBeDefined();
        if (carouselContent) {
          // Should still have at least 5 slides even with few key points
          const slideCount = carouselContent.metadata.slideCount as number;
          expect(slideCount).toBeGreaterThanOrEqual(5);
        }
      }
    });

    it('should cap story frames to maximum of 5', async () => {
      const longMaterial: Material = {
        ...mockMaterial,
        content: 'First important point about social media growth. Second insight about engagement metrics today. Third strategy for content creation workflow. Fourth tip about audience retention rates. Fifth approach to brand consistency online. Sixth idea about hashtag optimization methods. Seventh technique for story formatting best.'
      };

      const rawContent: RawContent = {
        material: longMaterial,
        pipelineType: 'snackable',
        targetChannels: ['ig-story']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const storyContent = result.value[0];
        expect(storyContent).toBeDefined();
        if (storyContent) {
          const frameCount = storyContent.metadata.frameCount as number;
          expect(frameCount).toBeLessThanOrEqual(5);
        }
      }
    });
  });

  describe('pipeline properties', () => {
    it('should have correct type', () => {
      expect(pipeline.type).toBe('snackable');
    });

    it('should have correct output channels', () => {
      expect(pipeline.outputChannels).toEqual(['ig-carousel', 'ig-single', 'ig-story']);
    });
  });
});
