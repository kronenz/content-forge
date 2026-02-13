/**
 * Tests for infographic publisher
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InfographicPublisher } from '../infographic-publisher.js';
import type { PublisherConfig } from '../base-publisher.js';
import type { ChannelContent } from '@content-forge/core';

describe('InfographicPublisher', () => {
  const mockConfig: PublisherConfig = {
    channel: 'ig-single',
    apiKey: 'test-infographic-key',
    maxRetries: 3
  };

  const mockInfographicConfig = {
    platformUrl: 'https://infographic.example.com'
  };

  let publisher: InfographicPublisher;

  const createMockContent = (overrides?: Partial<ChannelContent>): ChannelContent => {
    return {
      channel: 'ig-single',
      title: 'Test Infographic',
      body: 'Infographic content with visual data representation showing key metrics and statistics for the quarter.',
      metadata: {
        format: 'png',
        dimensions: { width: 1080, height: 1080 },
        altText: 'Infographic showing key metrics',
        tags: ['data', 'visualization']
      },
      ...overrides
    };
  };

  beforeEach(() => {
    publisher = new InfographicPublisher(mockConfig, mockInfographicConfig);
  });

  describe('publish', () => {
    it('should publish valid infographic content successfully', async () => {
      const content = createMockContent();

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('ig-single');
        expect(result.value.externalId).toContain('infographic-');
        expect(result.value.externalUrl).toContain('infographic.example.com');
        expect(result.value.publishedAt).toBeInstanceOf(Date);
      }
    });

    it('should include title slug in URL', async () => {
      const content = createMockContent({ title: 'My Data Chart' });

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.externalUrl).toContain('/infographic/my-data-chart');
      }
    });

    it('should reject empty body', async () => {
      const content = createMockContent({ body: '' });

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('infographic');
        expect(result.error.message).toContain('empty');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject empty title', async () => {
      const content = createMockContent({ title: '' });

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('infographic');
        expect(result.error.message).toContain('title');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject invalid dimensions', async () => {
      const content = createMockContent({
        metadata: {
          format: 'png',
          dimensions: { width: 0, height: 1080 },
          altText: 'Test',
          tags: []
        }
      });

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('infographic');
        expect(result.error.message).toContain('Invalid dimensions');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject unsupported image format', async () => {
      const content = createMockContent({
        metadata: {
          format: 'gif',
          dimensions: { width: 1080, height: 1080 },
          altText: 'Test',
          tags: []
        }
      });

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('infographic');
        expect(result.error.message).toContain('Unsupported image format');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should accept all valid image formats', async () => {
      const validFormats = ['png', 'jpg', 'webp'];

      for (const format of validFormats) {
        const content = createMockContent({
          metadata: {
            format,
            dimensions: { width: 1080, height: 1080 },
            altText: 'Test',
            tags: []
          }
        });

        const result = await publisher.publish(content);
        expect(result.ok).toBe(true);
      }
    });

    it('should accept content without explicit dimensions', async () => {
      const content = createMockContent({
        metadata: {
          format: 'png',
          altText: 'Test',
          tags: []
        }
      });

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
    });
  });
});
