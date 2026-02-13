/**
 * Tests for TTS client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTTS, generateTTSBatch } from '../tts-client.js';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TTS Client', () => {
  const mockConfig = {
    apiKey: 'test-api-key',
    voiceId: 'default-voice',
    modelId: 'eleven_multilingual_v2',
    maxRetries: 2,
    baseDelayMs: 10,
    outputDir: '/tmp/tts',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateTTS', () => {
    it('should generate audio for a single scene', async () => {
      const audioData = new ArrayBuffer(16000); // ~1 second of audio
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(audioData),
      });

      const result = await generateTTS(
        { text: '테스트 나레이션입니다.', sceneId: 'scene_1' },
        mockConfig
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.sceneId).toBe('scene_1');
        expect(result.value.audioFilePath).toBe('/tmp/tts/scene_1.mp3');
        expect(result.value.durationMs).toBeGreaterThan(0);
      }

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.elevenlabs.io/v1/text-to-speech/default-voice`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'xi-api-key': 'test-api-key',
          }),
        })
      );
    });

    it('should use custom voice when provided', async () => {
      const audioData = new ArrayBuffer(16000);
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(audioData),
      });

      await generateTTS(
        { text: '테스트', sceneId: 'scene_1', voiceId: 'custom-voice' },
        mockConfig
      );

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.elevenlabs.io/v1/text-to-speech/custom-voice`,
        expect.any(Object)
      );
    });

    it('should handle API error with retry', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error'),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(16000)),
        });

      const result = await generateTTS(
        { text: '테스트', sceneId: 'scene_1' },
        mockConfig
      );

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server Error'),
      });

      const result = await generateTTS(
        { text: '테스트', sceneId: 'scene_1' },
        mockConfig
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('500');
      }
      expect(mockFetch).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('should not retry on 401', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      });

      const result = await generateTTS(
        { text: '테스트', sceneId: 'scene_1' },
        mockConfig
      );

      expect(result.ok).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateTTSBatch', () => {
    it('should generate audio for multiple scenes with correct offsets', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(80000)),  // ~5s
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(128000)), // ~8s
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(112000)), // ~7s
        });

      const result = await generateTTSBatch(
        [
          { text: '씬 1 나레이션', sceneId: 'scene_1' },
          { text: '씬 2 나레이션', sceneId: 'scene_2' },
          { text: '씬 3 나레이션', sceneId: 'scene_3' },
        ],
        mockConfig
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(3);
        expect(result.value[0].startOffsetMs).toBe(0);
        expect(result.value[1].startOffsetMs).toBe(result.value[0].durationMs);
        expect(result.value[2].startOffsetMs).toBe(result.value[0].durationMs + result.value[1].durationMs);
      }
    });

    it('should fail batch if any scene TTS fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(80000)),
        })
        .mockResolvedValue({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Error'),
        });

      const result = await generateTTSBatch(
        [
          { text: '씬 1', sceneId: 'scene_1' },
          { text: '씬 2', sceneId: 'scene_2' },
        ],
        mockConfig
      );

      expect(result.ok).toBe(false);
    });
  });
});
