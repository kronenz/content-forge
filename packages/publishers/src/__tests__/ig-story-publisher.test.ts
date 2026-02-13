/**
 * Tests for Instagram story publisher
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IgStoryPublisher } from '../ig-story-publisher.js';
import type { ChannelContent, PublisherConfig } from '@content-forge/core';

describe('IgStoryPublisher', () => {
  const mockConfig: PublisherConfig = {
    channel: 'ig-story',
    apiKey: 'test-ig-key',
    maxRetries: 3
  };

  let publisher: IgStoryPublisher;

  const createStoryContent = (frameCount: number): ChannelContent => {
    const hook = 'Check out these insights';
    const frames: string[] = [];
    for (let i = 0; i < frameCount; i++) {
      frames.push(`Frame ${i + 1} with interesting content here`);
    }
    return {
      channel: 'ig-story',
      title: 'Test Story',
      body: `${hook}\n\n---\n\n${frames.join('\n\n---\n\n')}`,
      metadata: {
        format: 'story',
        hook,
        frameCount,
        tags: ['test', 'story']
      }
    };
  };

  beforeEach(() => {
    publisher = new IgStoryPublisher(mockConfig);
  });

  describe('publish', () => {
    it('should publish valid story content successfully (mocked)', async () => {
      const content = createStoryContent(4);

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('ig-story');
        expect(result.value.externalId).toContain('ig-story-');
        expect(result.value.externalUrl).toContain('instagram.com/stories/');
        expect(result.value.publishedAt).toBeInstanceOf(Date);
      }
    });

    it('should reject story with too few frames', async () => {
      const content = createStoryContent(2); // Less than 3

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('ig-story');
        expect(result.error.message).toContain('Too few frames');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject story with too many frames', async () => {
      const content = createStoryContent(8); // More than 5

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('ig-story');
        expect(result.error.message).toContain('Too many frames');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should accept story within valid range', async () => {
      const validCounts = [3, 4, 5];

      for (const count of validCounts) {
        const content = createStoryContent(count);
        const result = await publisher.publish(content);
        expect(result.ok).toBe(true);
      }
    });

    it('should reject story with hook that is too long', async () => {
      const longHook = 'a'.repeat(120); // More than 100
      const content: ChannelContent = {
        channel: 'ig-story',
        title: 'Test Story',
        body: `${longHook}\n\n---\n\nFrame 1 content here ab\n\n---\n\nFrame 2 content here ab\n\n---\n\nFrame 3 content here ab`,
        metadata: {
          format: 'story',
          hook: longHook,
          frameCount: 3,
          tags: ['test']
        }
      };

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('ig-story');
        expect(result.error.message).toContain('Hook too long');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject story with frame that is too long', async () => {
      const longFrame = 'a'.repeat(120); // More than 100
      const content: ChannelContent = {
        channel: 'ig-story',
        title: 'Test Story',
        body: `Check out these insights\n\n---\n\n${longFrame}\n\n---\n\nFrame 2 content here ab\n\n---\n\nFrame 3 content here ab`,
        metadata: {
          format: 'story',
          frameCount: 3,
          tags: ['test']
        }
      };

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('ig-story');
        expect(result.error.message).toContain('too long');
        expect(result.error.retryable).toBe(false);
      }
    });
  });
});
