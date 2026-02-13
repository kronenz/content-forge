/**
 * Tests for Kakao publisher
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { KakaoPublisher } from '../kakao-publisher.js';
import type { ChannelContent, PublisherConfig } from '@content-forge/core';

describe('KakaoPublisher', () => {
  const mockConfig: PublisherConfig = {
    channel: 'kakao',
    apiKey: 'test-kakao-key',
    maxRetries: 3
  };

  let publisher: KakaoPublisher;

  const createMockContent = (bodyLength: number): ChannelContent => {
    const body = 'a'.repeat(bodyLength);
    return {
      channel: 'kakao',
      title: 'Test Message',
      body,
      metadata: {
        format: 'text',
        hashtags: ['test', 'kakao']
      }
    };
  };

  beforeEach(() => {
    publisher = new KakaoPublisher(mockConfig);
  });

  describe('publish', () => {
    it('should publish valid content successfully (mocked)', async () => {
      const content = createMockContent(1000);

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('kakao');
        expect(result.value.externalId).toContain('kakao-');
        expect(result.value.externalUrl).toContain('pf.kakao.com');
        expect(result.value.publishedAt).toBeInstanceOf(Date);
      }
    });

    it('should reject content that is too short', async () => {
      const content = createMockContent(100); // Less than 200

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('kakao');
        expect(result.error.message).toContain('too short');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject content that is too long', async () => {
      const content = createMockContent(2500); // More than 2000

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('kakao');
        expect(result.error.message).toContain('too long');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should accept content within valid range', async () => {
      const validLengths = [200, 1000, 2000];

      for (const length of validLengths) {
        const content = createMockContent(length);
        const result = await publisher.publish(content);
        expect(result.ok).toBe(true);
      }
    });

    it('should include char count in error message for short content', async () => {
      const content = createMockContent(150);

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('150');
        expect(result.error.message).toContain('minimum 200');
      }
    });
  });
});
