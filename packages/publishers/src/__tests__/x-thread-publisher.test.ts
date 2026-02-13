/**
 * Tests for X Thread publisher
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { XThreadPublisher } from '../x-thread-publisher.js';
import type { ChannelContent, PublisherConfig } from '@content-forge/core';

describe('XThreadPublisher', () => {
  const mockConfig: PublisherConfig = {
    channel: 'x-thread',
    apiKey: 'test-x-key',
    maxRetries: 3
  };

  let publisher: XThreadPublisher;

  const createThreadContent = (tweetCount: number): ChannelContent => {
    const tweets: string[] = [];
    for (let i = 0; i < tweetCount; i++) {
      tweets.push(`Tweet ${i + 1} of ${tweetCount} - Some interesting content here.`);
    }
    return {
      channel: 'x-thread',
      title: 'Test Thread',
      body: tweets.join('\n\n---\n\n'),
      metadata: {
        format: 'thread',
        tweets: tweetCount
      }
    };
  };

  const createLongTweetContent = (): ChannelContent => {
    const longTweet = 'a'.repeat(300); // Over 280 char limit
    return {
      channel: 'x-thread',
      title: 'Test Thread',
      body: `Tweet 1\n\n---\n\n${longTweet}\n\n---\n\nTweet 3\n\n---\n\nTweet 4\n\n---\n\nTweet 5`,
      metadata: { format: 'thread', tweets: 5 }
    };
  };

  beforeEach(() => {
    publisher = new XThreadPublisher(mockConfig);
  });

  describe('publish', () => {
    it('should publish valid thread successfully (mocked)', async () => {
      const content = createThreadContent(7);

      const result = await publisher.publish(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.channel).toBe('x-thread');
        expect(result.value.externalId).toContain('x-thread-');
        expect(result.value.externalUrl).toContain('x.com/user/status');
        expect(result.value.publishedAt).toBeInstanceOf(Date);
      }
    });

    it('should reject thread with too few tweets', async () => {
      const content = createThreadContent(3); // Less than 5

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('x-thread');
        expect(result.error.message).toContain('too short');
        expect(result.error.message).toContain('3 tweets');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject thread with too many tweets', async () => {
      const content = createThreadContent(20); // More than 15

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('x-thread');
        expect(result.error.message).toContain('too long');
        expect(result.error.message).toContain('20 tweets');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should reject thread with tweet over 280 characters', async () => {
      const content = createLongTweetContent();

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('x-thread');
        expect(result.error.message).toContain('too long');
        expect(result.error.message).toContain('280');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should accept thread within valid range', async () => {
      const validCounts = [5, 10, 15];

      for (const count of validCounts) {
        const content = createThreadContent(count);
        const result = await publisher.publish(content);
        expect(result.ok).toBe(true);
      }
    });

    it('should reject thread with empty tweet', async () => {
      const content: ChannelContent = {
        channel: 'x-thread',
        title: 'Test Thread',
        body: 'Tweet 1\n\n---\n\n\n\n---\n\nTweet 3\n\n---\n\nTweet 4\n\n---\n\nTweet 5',
        metadata: { format: 'thread', tweets: 5 }
      };

      const result = await publisher.publish(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.publisher).toBe('x-thread');
        expect(result.error.message).toContain('Empty tweet');
        expect(result.error.retryable).toBe(false);
      }
    });
  });
});
