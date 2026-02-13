/**
 * ElevenLabs TTS client with retry and Result pattern
 */

import { Ok, Err, type Result, createLogger, type Logger, type AudioSegment } from '@content-forge/core';

export interface TTSConfig {
  apiKey: string;
  voiceId: string;         // default voice
  modelId: string;         // default: 'eleven_multilingual_v2'
  maxRetries: number;      // default: 3
  baseDelayMs: number;     // default: 1000
  outputDir: string;       // directory for generated audio files
}

export interface TTSError {
  message: string;
  statusCode?: number;
  retryable: boolean;
}

export interface TTSRequest {
  text: string;
  voiceId?: string;        // override default voice
  sceneId: string;
  outputPath?: string;     // override default output path
}

/**
 * Generate TTS audio for a single scene narration
 */
export async function generateTTS(
  request: TTSRequest,
  config: TTSConfig
): Promise<Result<AudioSegment, TTSError>> {
  const logger = createLogger({ agentId: 'tts-client' });
  const voiceId = request.voiceId || config.voiceId;
  let lastError: TTSError | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = config.baseDelayMs * Math.pow(2, attempt - 1);
      await sleep(delay);
    }

    const result = await makeTTSRequest(request, voiceId, config, logger);

    if (result.ok) {
      return result;
    }

    lastError = result.error;

    if (!result.error.retryable) {
      return result;
    }
  }

  return Err(lastError || { message: 'Max retries exceeded', retryable: false });
}

/**
 * Generate TTS audio for multiple scenes (batch)
 */
export async function generateTTSBatch(
  requests: TTSRequest[],
  config: TTSConfig
): Promise<Result<AudioSegment[], TTSError>> {
  const segments: AudioSegment[] = [];
  let currentOffset = 0;

  for (const request of requests) {
    const result = await generateTTS(request, config);

    if (!result.ok) {
      return Err(result.error);
    }

    const segment: AudioSegment = {
      ...result.value,
      startOffsetMs: currentOffset,
    };

    currentOffset += segment.durationMs;
    segments.push(segment);
  }

  return Ok(segments);
}

/**
 * Make a single TTS API request to ElevenLabs
 */
async function makeTTSRequest(
  request: TTSRequest,
  voiceId: string,
  config: TTSConfig,
  logger: Logger
): Promise<Result<AudioSegment, TTSError>> {
  try {
    logger.info('tts_request', { sceneId: request.sceneId, voiceId, textLength: request.text.length });

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': config.apiKey,
      },
      body: JSON.stringify({
        text: request.text,
        model_id: config.modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const statusCode = response.status;
      const errorText = await response.text().catch(() => 'Unknown error');

      return Err({
        message: `TTS API error: ${statusCode} - ${errorText}`,
        statusCode,
        retryable: statusCode === 429 || statusCode >= 500,
      });
    }

    // Get audio data as ArrayBuffer
    const audioBuffer = await response.arrayBuffer();

    // Calculate approximate duration from audio buffer size
    // MP3 at ~128kbps: bytes / (128000/8) * 1000 = bytes * 0.0625
    const estimatedDurationMs = Math.round((audioBuffer.byteLength / 16000) * 1000);

    // Write audio file
    const outputPath = request.outputPath || `${config.outputDir}/${request.sceneId}.mp3`;

    // In production, write to filesystem; for now store path reference
    const segment: AudioSegment = {
      sceneId: request.sceneId,
      audioFilePath: outputPath,
      durationMs: estimatedDurationMs,
      startOffsetMs: 0,
    };

    logger.info('tts_complete', { sceneId: request.sceneId, durationMs: estimatedDurationMs });

    return Ok(segment);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Err({
      message: `TTS request failed: ${message}`,
      retryable: true,
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
