/**
 * Thumbnail generator tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ok, Err } from '@content-forge/core';
import { generateThumbnail, type ThumbnailRequest } from '../thumbnail-generator.js';

// Mock callClaude
vi.mock('@content-forge/pipelines', () => ({
  callClaude: vi.fn(),
}));

import { callClaude } from '@content-forge/pipelines';

const mockCallClaude = vi.mocked(callClaude);

const TEST_CLAUDE_CONFIG = {
  apiKey: 'test-key',
  model: 'claude-sonnet-4-20250514',
  maxRetries: 3,
  baseDelayMs: 100,
};

const VALID_SVG_16_9 = '<svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg"><rect width="1920" height="1080" fill="#2563EB"/><text x="960" y="540" text-anchor="middle" fill="white" font-size="72">Test Title</text></svg>';
const VALID_SVG_9_16 = '<svg viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="1920" fill="#2563EB"/><text x="540" y="960" text-anchor="middle" fill="white" font-size="72">Test Title</text></svg>';

describe('generateThumbnail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCallClaude.mockResolvedValue(Ok(VALID_SVG_16_9));
  });

  describe('SVG thumbnail generation', () => {
    it('should generate a valid SVG thumbnail', async () => {
      const request: ThumbnailRequest = {
        title: 'My Video Title',
        style: 'bold-text',
        aspectRatio: '16:9',
      };

      const result = await generateThumbnail(request, TEST_CLAUDE_CONFIG);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.svgContent).toContain('<svg');
        expect(result.value.svgContent).toContain('</svg>');
        expect(result.value.width).toBe(1920);
        expect(result.value.height).toBe(1080);
      }

      expect(mockCallClaude).toHaveBeenCalledOnce();
      expect(mockCallClaude).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('My Video Title'),
          }),
        ]),
        expect.any(String),
        TEST_CLAUDE_CONFIG,
      );
    });

    it('should extract SVG from response with surrounding text', async () => {
      const responseWithText = `Here is the thumbnail:\n${VALID_SVG_16_9}\nHope you like it!`;
      mockCallClaude.mockResolvedValue(Ok(responseWithText));

      const request: ThumbnailRequest = {
        title: 'Test',
        style: 'bold-text',
        aspectRatio: '16:9',
      };

      const result = await generateThumbnail(request, TEST_CLAUDE_CONFIG);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.svgContent).toBe(VALID_SVG_16_9);
      }
    });
  });

  describe('different styles', () => {
    it('should pass bold-text style prompt', async () => {
      const request: ThumbnailRequest = {
        title: 'Bold Title',
        style: 'bold-text',
        aspectRatio: '16:9',
      };

      await generateThumbnail(request, TEST_CLAUDE_CONFIG);

      expect(mockCallClaude).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining('bold'),
          }),
        ]),
        expect.any(String),
        TEST_CLAUDE_CONFIG,
      );
    });

    it('should pass cinematic style prompt', async () => {
      const request: ThumbnailRequest = {
        title: 'Cinematic Title',
        style: 'cinematic',
        aspectRatio: '16:9',
      };

      await generateThumbnail(request, TEST_CLAUDE_CONFIG);

      expect(mockCallClaude).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining('cinematic'),
          }),
        ]),
        expect.any(String),
        TEST_CLAUDE_CONFIG,
      );
    });

    it('should pass minimal style prompt', async () => {
      const request: ThumbnailRequest = {
        title: 'Minimal Title',
        style: 'minimal',
        aspectRatio: '16:9',
      };

      await generateThumbnail(request, TEST_CLAUDE_CONFIG);

      expect(mockCallClaude).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining('minimal'),
          }),
        ]),
        expect.any(String),
        TEST_CLAUDE_CONFIG,
      );
    });
  });

  describe('16:9 vs 9:16 dimensions', () => {
    it('should use 1920x1080 for 16:9', async () => {
      const request: ThumbnailRequest = {
        title: 'Wide',
        style: 'bold-text',
        aspectRatio: '16:9',
      };

      const result = await generateThumbnail(request, TEST_CLAUDE_CONFIG);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.width).toBe(1920);
        expect(result.value.height).toBe(1080);
      }

      // System prompt should mention 1920x1080
      expect(mockCallClaude).toHaveBeenCalledWith(
        expect.any(Array),
        expect.stringContaining('1920'),
        TEST_CLAUDE_CONFIG,
      );
    });

    it('should use 1080x1920 for 9:16', async () => {
      mockCallClaude.mockResolvedValue(Ok(VALID_SVG_9_16));

      const request: ThumbnailRequest = {
        title: 'Tall',
        style: 'bold-text',
        aspectRatio: '9:16',
      };

      const result = await generateThumbnail(request, TEST_CLAUDE_CONFIG);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.width).toBe(1080);
        expect(result.value.height).toBe(1920);
      }
    });
  });

  describe('error handling', () => {
    it('should return error when Claude API fails', async () => {
      mockCallClaude.mockResolvedValue(Err({
        message: 'API key invalid',
        statusCode: 401,
        retryable: false,
      }));

      const request: ThumbnailRequest = {
        title: 'Test',
        style: 'bold-text',
        aspectRatio: '16:9',
      };

      const result = await generateThumbnail(request, TEST_CLAUDE_CONFIG);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.agent).toBe('thumbnail-generator');
        expect(result.error.message).toContain('Claude API error');
      }
    });

    it('should return error when response has no SVG', async () => {
      mockCallClaude.mockResolvedValue(Ok('Sorry, I cannot generate SVG content.'));

      const request: ThumbnailRequest = {
        title: 'Test',
        style: 'bold-text',
        aspectRatio: '16:9',
      };

      const result = await generateThumbnail(request, TEST_CLAUDE_CONFIG);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('No SVG content found');
      }
    });
  });

  describe('brand colors', () => {
    it('should pass custom brand colors to the prompt', async () => {
      const request: ThumbnailRequest = {
        title: 'Branded',
        style: 'bold-text',
        aspectRatio: '16:9',
        brandColors: { primary: '#FF0000', accent: '#00FF00' },
      };

      await generateThumbnail(request, TEST_CLAUDE_CONFIG);

      expect(mockCallClaude).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining('#FF0000'),
          }),
        ]),
        expect.any(String),
        TEST_CLAUDE_CONFIG,
      );
    });
  });
});
