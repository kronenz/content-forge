/**
 * Tests for Whisper subtitle generation client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSubtitles, segmentsToSrt } from '../whisper-client.js';

// Mock node:fs/promises and node:path
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from('fake-audio-data'))
}));

vi.mock('node:path', () => ({
  basename: vi.fn((p: string) => p.split('/').pop() ?? p)
}));

describe('WhisperClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('generateSubtitles', () => {
    it('should generate subtitles successfully from OpenAI API', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          text: 'Hello world. This is a test.',
          language: 'en',
          duration: 5.5,
          segments: [
            { id: 0, start: 0.0, end: 2.5, text: ' Hello world.' },
            { id: 1, start: 2.5, end: 5.5, text: ' This is a test.' }
          ],
          words: [
            { word: 'Hello', start: 0.0, end: 0.5 },
            { word: 'world.', start: 0.6, end: 1.2 },
            { word: 'This', start: 2.5, end: 2.8 },
            { word: 'is', start: 2.9, end: 3.0 },
            { word: 'a', start: 3.1, end: 3.2 },
            { word: 'test.', start: 3.3, end: 4.0 }
          ]
        })
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await generateSubtitles('/tmp/audio.mp3', {
        apiKey: 'test-openai-key'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.language).toBe('en');
        expect(result.value.duration).toBe(5.5);
        expect(result.value.segments).toHaveLength(2);
        expect(result.value.segments[0]!.text).toBe('Hello world.');
        expect(result.value.segments[0]!.words).toHaveLength(2);
        expect(result.value.segments[1]!.text).toBe('This is a test.');
        expect(result.value.srtContent).toContain('1\n');
        expect(result.value.srtContent).toContain('-->');
      }

      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/audio/transcriptions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-openai-key'
          })
        })
      );
    });

    it('should use self-hosted server URL when provided', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          text: 'Test transcript',
          language: 'ko',
          duration: 3.0,
          segments: [
            { id: 0, start: 0.0, end: 3.0, text: ' Test transcript' }
          ]
        })
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await generateSubtitles('/tmp/audio.wav', {
        serverUrl: 'http://localhost:9000/v1/audio/transcriptions'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.language).toBe('ko');
      }

      // Verify it called the self-hosted URL
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:9000/v1/audio/transcriptions',
        expect.any(Object)
      );
    });

    it('should return error when neither apiKey nor serverUrl is provided', async () => {
      const result = await generateSubtitles('/tmp/audio.mp3', {});

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('apiKey');
        expect(result.error.message).toContain('serverUrl');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should handle API errors', async () => {
      const mockError = {
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded'
      };

      global.fetch = vi.fn().mockResolvedValue(mockError);

      const result = await generateSubtitles('/tmp/audio.mp3', {
        apiKey: 'test-key'
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Rate limit');
        expect(result.error.statusCode).toBe(429);
        expect(result.error.retryable).toBe(true);
      }
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await generateSubtitles('/tmp/audio.mp3', {
        apiKey: 'test-key'
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('ECONNREFUSED');
        expect(result.error.retryable).toBe(true);
      }
    });
  });

  describe('segmentsToSrt', () => {
    it('should convert segments to valid SRT format', () => {
      const segments = [
        { start: 0, end: 2.5, text: 'Hello world.' },
        { start: 3.0, end: 5.5, text: 'This is a test.' },
        { start: 60.5, end: 63.123, text: 'One minute in.' }
      ];

      const srt = segmentsToSrt(segments);

      expect(srt).toContain('1\n00:00:00,000 --> 00:00:02,500\nHello world.');
      expect(srt).toContain('2\n00:00:03,000 --> 00:00:05,500\nThis is a test.');
      expect(srt).toContain('3\n00:01:00,500 --> 00:01:03,123\nOne minute in.');
    });

    it('should handle empty segments', () => {
      const srt = segmentsToSrt([]);
      expect(srt).toBe('');
    });

    it('should handle timestamps over an hour', () => {
      const segments = [
        { start: 3661.5, end: 3665.0, text: 'After one hour.' }
      ];

      const srt = segmentsToSrt(segments);
      expect(srt).toContain('01:01:01,500 --> 01:01:05,000');
    });
  });
});
