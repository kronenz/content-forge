/**
 * Tests for Claude API integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callClaude, type ClaudeApiConfig, type ClaudeMessage } from '../claude-api.js';

describe('claude-api', () => {
  const mockConfig: ClaudeApiConfig = {
    apiKey: 'test-api-key',
    model: 'claude-sonnet-4-20250514',
    maxRetries: 3,
    baseDelayMs: 100 // Short delay for tests
  };

  const mockMessages: ClaudeMessage[] = [
    { role: 'user', content: 'Test message' }
  ];

  const mockSystemPrompt = 'You are a test assistant';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('callClaude', () => {
    it('should return success on valid response', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Test response' }],
          model: 'claude-sonnet-4-20250514',
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 }
        })
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await callClaude(mockMessages, mockSystemPrompt, mockConfig);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('Test response');
      }

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-api-key'
          })
        })
      );
    });

    it('should retry on 429 rate limit', async () => {
      const rateLimitResponse = {
        ok: false,
        status: 429,
        json: async () => ({
          type: 'error',
          error: { type: 'rate_limit_error', message: 'Rate limit exceeded' }
        })
      };

      const successResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Success after retry' }],
          model: 'claude-sonnet-4-20250514',
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 }
        })
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce(rateLimitResponse)
        .mockResolvedValueOnce(successResponse);

      const result = await callClaude(mockMessages, mockSystemPrompt, mockConfig);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('Success after retry');
      }
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on 5xx server errors', async () => {
      const serverErrorResponse = {
        ok: false,
        status: 500,
        json: async () => ({
          type: 'error',
          error: { type: 'api_error', message: 'Internal server error' }
        })
      };

      const successResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Success after retry' }],
          model: 'claude-sonnet-4-20250514',
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 }
        })
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce(serverErrorResponse)
        .mockResolvedValueOnce(successResponse);

      const result = await callClaude(mockMessages, mockSystemPrompt, mockConfig);

      expect(result.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 4xx client errors (except 429)', async () => {
      const clientErrorResponse = {
        ok: false,
        status: 400,
        json: async () => ({
          type: 'error',
          error: { type: 'invalid_request_error', message: 'Invalid request' }
        })
      };

      global.fetch = vi.fn().mockResolvedValue(clientErrorResponse);

      const result = await callClaude(mockMessages, mockSystemPrompt, mockConfig);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.retryable).toBe(false);
        expect(result.error.statusCode).toBe(400);
      }
      expect(global.fetch).toHaveBeenCalledTimes(1); // No retries
    });

    it('should handle network errors with retry', async () => {
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            id: 'msg_123',
            type: 'message',
            role: 'assistant',
            content: [{ type: 'text', text: 'Success after network error' }],
            model: 'claude-sonnet-4-20250514',
            stop_reason: 'end_turn',
            usage: { input_tokens: 10, output_tokens: 5 }
          })
        });

      const result = await callClaude(mockMessages, mockSystemPrompt, mockConfig);

      expect(result.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const errorResponse = {
        ok: false,
        status: 500,
        json: async () => ({
          type: 'error',
          error: { type: 'api_error', message: 'Server error' }
        })
      };

      global.fetch = vi.fn().mockResolvedValue(errorResponse);

      const result = await callClaude(mockMessages, mockSystemPrompt, mockConfig);

      expect(result.ok).toBe(false);
      // 1 initial call + 3 retries = 4 total
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should handle missing text content in response', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [], // No text content
          model: 'claude-sonnet-4-20250514',
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 }
        })
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await callClaude(mockMessages, mockSystemPrompt, mockConfig);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('No text content');
        expect(result.error.retryable).toBe(false);
      }
    });
  });
});
