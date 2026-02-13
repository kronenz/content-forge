/**
 * Tests for Instagram carousel publisher
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IgCarouselPublisher } from '../ig-carousel-publisher.js';
import type { ChannelContent, PublisherConfig } from '@content-forge/core';

describe('IgCarouselPublisher', () => {
  const mockConfig: PublisherConfig = {
    channel: 'ig-carousel',
    apiKey: 'test-ig-key',
    maxRetries: 3
  };

  let publisher: IgCarouselPublisher;

  const createMockContent = (bodyLength: number, slideCount?: number): ChannelContent => {
    const body = 'a'.repeat(bodyLength);
    return {
      channel: 'ig-carousel',
      title: 'Test Carousel',
      body,
      metadata: {
        format: 'carousel',
        ...(slideCount !== undefined ? { slideCount } : {}),
        tags: ['test', 'carousel']
      }
    };
  };

  beforeEach(() => {
    publisher = new IgCarouselPublisher(mockConfig);
  });

  describe('publish', () => {
    it('should publish valid content successfully (mocked)', async () => {
      const content = createMockContent(500, 5);

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('ig-carousel');
        expect(result.value.externalId).toContain('ig-carousel-');
        expect(result.value.externalUrl).toContain('instagram.com/p/');
        expect(result.value.publishedAt).toBeInstanceOf(Date);
      }
    });

    it('should reject content that is too short', async () => {
      const content = createMockContent(200, 5); // Less than 300

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('ig-carousel');
        expect(result.error.message).toContain('too short');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject content that is too long', async () => {
      const content = createMockContent(2500, 5); // More than 2200

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('ig-carousel');
        expect(result.error.message).toContain('too long');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should accept content within valid range', async () => {
      const validLengths = [300, 1000, 2200];

      for (const length of validLengths) {
        const content = createMockContent(length, 5);
        const result = await publisher.publish(content);
        expect(result.ok).toBe(true);
      }
    });

    it('should reject content with too many slides', async () => {
      const content = createMockContent(500, 15); // More than 10

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('ig-carousel');
        expect(result.error.message).toContain('Too many slides');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject content with zero slides', async () => {
      const content = createMockContent(500, 0); // Less than 1

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('ig-carousel');
        expect(result.error.message).toContain('Too few slides');
        expect(result.error.retryable).toBe(false);
      }
    });
  });
});
