/**
 * Tests for Instagram single post publisher
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IgSinglePublisher } from '../ig-single-publisher.js';
import type { ChannelContent, PublisherConfig } from '@content-forge/core';

describe('IgSinglePublisher', () => {
  const mockConfig: PublisherConfig = {
    channel: 'ig-single',
    apiKey: 'test-ig-key',
    maxRetries: 3
  };

  let publisher: IgSinglePublisher;

  const createMockContent = (bodyLength: number): ChannelContent => {
    const body = 'a'.repeat(bodyLength);
    return {
      channel: 'ig-single',
      title: 'Test Single Post',
      body,
      metadata: {
        format: 'single',
        charCount: bodyLength,
        tags: ['test', 'single']
      }
    };
  };

  beforeEach(() => {
    publisher = new IgSinglePublisher(mockConfig);
  });

  describe('publish', () => {
    it('should publish valid content successfully (mocked)', async () => {
      const content = createMockContent(500);

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('ig-single');
        expect(result.value.externalId).toContain('ig-single-');
        expect(result.value.externalUrl).toContain('instagram.com/p/');
        expect(result.value.publishedAt).toBeInstanceOf(Date);
      }
    });

    it('should reject content that is too short', async () => {
      const content = createMockContent(50); // Less than 100

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('ig-single');
        expect(result.error.message).toContain('too short');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject content that is too long', async () => {
      const content = createMockContent(2500); // More than 2200

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('ig-single');
        expect(result.error.message).toContain('too long');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should accept content within valid range', async () => {
      const validLengths = [100, 1000, 2200];

      for (const length of validLengths) {
        const content = createMockContent(length);
        const result = await publisher.publish(content);
        expect(result.ok).toBe(true);
      }
    });

    it('should accept content at exact boundaries', async () => {
      const minContent = createMockContent(100);
      const minResult = await publisher.publish(minContent);
      expect(minResult.ok).toBe(true);

      const maxContent = createMockContent(2200);
      const maxResult = await publisher.publish(maxContent);
      expect(maxResult.ok).toBe(true);
    });
  });
});
