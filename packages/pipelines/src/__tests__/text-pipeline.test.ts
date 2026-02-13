/**
 * Tests for text pipeline
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TextPipeline } from '../text-pipeline.js';
import type { RawContent, Material } from '@content-forge/core';

describe('TextPipeline', () => {
  let pipeline: TextPipeline;

  const mockMaterial: Material = {
    id: 'mat_123',
    source: 'test',
    url: 'https://example.com',
    title: 'Test Article',
    content: 'This is a test sentence about AI. Machine learning is transforming industries. Neural networks are powerful tools. Deep learning enables new capabilities. The future of AI is bright and promising.',
    score: 8,
    tags: ['AI', 'Technology', 'Innovation'],
    status: 'scored',
    collectedAt: new Date(),
    createdAt: new Date()
  };

  beforeEach(() => {
    pipeline = new TextPipeline();
  });

  describe('process', () => {
    it('should process content for all target channels', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'text',
        targetChannels: ['medium', 'linkedin', 'x-thread']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(3);
        expect(result.value.map(c => c.channel)).toEqual(['medium', 'linkedin', 'x-thread']);
      }
    });

    it('should generate Medium content with correct format', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'text',
        targetChannels: ['medium']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const mediumContent = result.value[0];
        expect(mediumContent).toBeDefined();
        if (mediumContent) {
          expect(mediumContent.channel).toBe('medium');
          expect(mediumContent.title).toBe('Test Article');
          expect(mediumContent.body.length).toBeGreaterThanOrEqual(2000);
          expect(mediumContent.body.length).toBeLessThanOrEqual(4000);
          expect(mediumContent.body).toContain('# Test Article');
          expect(mediumContent.metadata.format).toBe('markdown');
          expect(mediumContent.metadata.tags).toEqual(['AI', 'Technology', 'Innovation']);
        }
      }
    });

    it('should generate LinkedIn content with correct format', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'text',
        targetChannels: ['linkedin']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const linkedinContent = result.value[0];
        expect(linkedinContent).toBeDefined();
        if (linkedinContent) {
          expect(linkedinContent.channel).toBe('linkedin');
          expect(linkedinContent.title).toBe('Test Article');
          expect(linkedinContent.body.length).toBeGreaterThanOrEqual(300);
          expect(linkedinContent.body.length).toBeLessThanOrEqual(800);
          expect(linkedinContent.body).toContain('#AI');
          expect(linkedinContent.metadata.format).toBe('text');
          expect(linkedinContent.metadata.hashtags).toEqual(['AI', 'Technology', 'Innovation']);
        }
      }
    });

    it('should generate X thread with correct format', async () => {
      const rawContent: RawContent = {
        material: mockMaterial,
        pipelineType: 'text',
        targetChannels: ['x-thread']
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const threadContent = result.value[0];
        expect(threadContent).toBeDefined();
        if (threadContent) {
          expect(threadContent.channel).toBe('x-thread');
          expect(threadContent.title).toBe('Test Article');
          expect(threadContent.metadata.format).toBe('thread');

          const tweets = threadContent.body.split(/\n\n---\n\n/);
          const tweetCount = threadContent.metadata.tweets as number;
          expect(tweetCount).toBeGreaterThanOrEqual(5);
          expect(tweetCount).toBeLessThanOrEqual(15);
          expect(tweets).toHaveLength(tweetCount);

          // Check each tweet is within limit
          tweets.forEach(tweet => {
            expect(tweet.length).toBeLessThanOrEqual(280);
          });

          // Check first tweet has thread indicator
          expect(tweets[0]).toContain('Thread 🧵');
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
        pipelineType: 'text',
        targetChannels: ['medium']
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
        pipelineType: 'text',
        targetChannels: ['youtube' as any] // Unsupported channel
      };

      const result = await pipeline.process(rawContent);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.stage).toBe('generate_channel_content');
        expect(result.error.message).toContain('Unsupported channel');
      }
    });
  });

  describe('pipeline properties', () => {
    it('should have correct type', () => {
      expect(pipeline.type).toBe('text');
    });

    it('should have correct output channels', () => {
      expect(pipeline.outputChannels).toEqual(['medium', 'linkedin', 'x-thread']);
    });
  });
});
