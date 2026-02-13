/**
 * Tests for webtoon publisher
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WebtoonPublisher } from '../webtoon-publisher.js';
import type { PublisherConfig } from '../base-publisher.js';
import type { ChannelContent } from '@content-forge/core';

describe('WebtoonPublisher', () => {
  const mockConfig: PublisherConfig = {
    channel: 'webtoon',
    apiKey: 'test-webtoon-key',
    maxRetries: 3
  };

  const mockWebtoonConfig = {
    platformUrl: 'https://webtoon.example.com',
    seriesId: 'series-001',
    seriesTitle: 'Test Series'
  };

  let publisher: WebtoonPublisher;

  const createMockContent = (overrides?: Partial<ChannelContent>): ChannelContent => {
    return {
      channel: 'webtoon',
      title: 'Episode 1: The Beginning',
      body: '[Panel 1/6]\nNarration: The hero arrives\nDialogue: "I am here"\n\n---\n\n[Panel 2/6]\nNarration: The villain appears\nDialogue: "You cannot stop me"',
      metadata: {
        format: 'vertical-scroll',
        style: 'manhwa',
        width: 800,
        panelCount: 6,
        episodeNumber: 1,
        panels: [],
        tags: ['action', 'fantasy']
      },
      ...overrides
    };
  };

  beforeEach(() => {
    publisher = new WebtoonPublisher(mockConfig, mockWebtoonConfig);
  });

  describe('publish', () => {
    it('should publish valid webtoon content successfully', async () => {
      const content = createMockContent();

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('webtoon');
        expect(result.value.externalId).toContain('webtoon-');
        expect(result.value.externalUrl).toContain('webtoon.example.com');
        expect(result.value.publishedAt).toBeInstanceOf(Date);
      }
    });

    it('should include series title in URL', async () => {
      const content = createMockContent();

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.externalUrl).toContain('/series/test-series/');
      }
    });

    it('should include episode number in URL', async () => {
      const content = createMockContent();

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.externalUrl).toContain('/episode/1');
      }
    });

    it('should reject empty body', async () => {
      const content = createMockContent({ body: '' });

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('webtoon');
        expect(result.error.message).toContain('empty');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject empty title', async () => {
      const content = createMockContent({ title: '' });

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('webtoon');
        expect(result.error.message).toContain('title');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject invalid panel count', async () => {
      const content = createMockContent({
        metadata: {
          format: 'vertical-scroll',
          panelCount: 10,
          panels: [],
          tags: []
        }
      });

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('webtoon');
        expect(result.error.message).toContain('panel count');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject unsupported format', async () => {
      const content = createMockContent({
        metadata: {
          format: 'horizontal',
          panelCount: 6,
          panels: [],
          tags: []
        }
      });

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('webtoon');
        expect(result.error.message).toContain('Unsupported format');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should accept content without explicit panel count in metadata', async () => {
      const content = createMockContent({
        metadata: {
          format: 'vertical-scroll',
          panels: [],
          tags: []
        }
      });

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
    });
  });
});
