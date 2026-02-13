/**
 * Tests for Brunch publisher
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BrunchPublisher } from '../brunch-publisher.js';
import type { ChannelContent, PublisherConfig } from '@content-forge/core';

describe('BrunchPublisher', () => {
  const mockConfig: PublisherConfig = {
    channel: 'brunch',
    apiKey: 'test-brunch-key',
    maxRetries: 3
  };

  let publisher: BrunchPublisher;

  const createMockContent = (bodyLength: number): ChannelContent => {
    const body = 'a'.repeat(bodyLength);
    return {
      channel: 'brunch',
      title: 'Test Article',
      body,
      metadata: {
        format: 'markdown',
        tags: ['test', 'brunch']
      }
    };
  };

  beforeEach(() => {
    publisher = new BrunchPublisher(mockConfig);
  });

  describe('publish', () => {
    it('should publish valid content successfully (mocked)', async () => {
      const content = createMockContent(3000);

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('brunch');
        expect(result.value.externalId).toContain('brunch-');
        expect(result.value.externalUrl).toContain('brunch.co.kr/@user');
        expect(result.value.publishedAt).toBeInstanceOf(Date);
      }
    });

    it('should reject content that is too short', async () => {
      const content = createMockContent(1500); // Less than 2000

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('brunch');
        expect(result.error.message).toContain('too short');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject content that is too long', async () => {
      const content = createMockContent(6000); // More than 5000

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('brunch');
        expect(result.error.message).toContain('too long');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should accept content within valid range', async () => {
      const validLengths = [2000, 3500, 5000];

      for (const length of validLengths) {
        const content = createMockContent(length);
        const result = await publisher.publish(content);
        expect(result.ok).toBe(true);
      }
    });

    it('should include char count in error message for long content', async () => {
      const content = createMockContent(5500);

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('5500');
        expect(result.error.message).toContain('maximum 5000');
      }
    });
  });
});
