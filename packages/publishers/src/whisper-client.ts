/**
 * Whisper-based subtitle generation client
 */

import {
  Ok,
  Err,
  type Result
} from '@content-forge/core';

export interface WhisperConfig {
  apiKey?: string; // OpenAI API key for cloud Whisper
  serverUrl?: string; // Self-hosted whisper server
  model?: string; // default: 'whisper-1'
}

export interface SubtitleSegment {
  start: number; // seconds
  end: number;
  text: string;
  words?: Array<{ word: string; start: number; end: number }>;
}

export interface SubtitleResult {
  segments: SubtitleSegment[];
  language: string;
  duration: number;
  srtContent: string;
}

export interface WhisperError {
  message: string;
  statusCode?: number;
  retryable: boolean;
}

interface WhisperApiResponse {
  text: string;
  language: string;
  duration: number;
  segments: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
  words?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}

const OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

/**
 * Generate subtitles from an audio file using Whisper
 */
export async function generateSubtitles(
  audioFilePath: string,
  config: WhisperConfig
): Promise<Result<SubtitleResult, WhisperError>> {
  const apiUrl = config.serverUrl ?? OPENAI_API_URL;
  const model = config.model ?? 'whisper-1';

  if (!config.apiKey && !config.serverUrl) {
    return Err({
      message: 'Either apiKey (for OpenAI) or serverUrl (for self-hosted) is required',
      retryable: false
    });
  }

  try {
    const fsPromises = await import('node:fs/promises');
    const pathModule = await import('node:path');

    const audioData = await fsPromises.readFile(audioFilePath);
    const fileName = pathModule.basename(audioFilePath);

    // Build multipart form data
    const formData = new FormData();
    formData.append('file', new Blob([audioData]), fileName);
    formData.append('model', model);
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');
    formData.append('timestamp_granularities[]', 'segment');

    const headers: Record<string, string> = {};
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      const statusCode = response.status;

      return Err({
        message: `Whisper API error: ${errorText}`,
        statusCode,
        retryable: statusCode >= 500 || statusCode === 429
      });
    }

    const data = await response.json() as WhisperApiResponse;

    // Map segments with optional word-level timestamps
    const segments: SubtitleSegment[] = data.segments.map(seg => {
      const segment: SubtitleSegment = {
        start: seg.start,
        end: seg.end,
        text: seg.text.trim()
      };

      // Attach word-level timestamps if available
      if (data.words) {
        segment.words = data.words.filter(
          w => w.start >= seg.start && w.end <= seg.end
        );
      }

      return segment;
    });

    const srtContent = segmentsToSrt(segments);

    return Ok({
      segments,
      language: data.language,
      duration: data.duration,
      srtContent
    });

  } catch (error) {
    return Err({
      message: error instanceof Error ? error.message : 'Unknown error',
      retryable: true
    });
  }
}

/**
 * Convert subtitle segments to SRT format
 */
export function segmentsToSrt(segments: SubtitleSegment[]): string {
  return segments.map((seg, index) => {
    const startTime = formatSrtTimestamp(seg.start);
    const endTime = formatSrtTimestamp(seg.end);
    return `${index + 1}\n${startTime} --> ${endTime}\n${seg.text}`;
  }).join('\n\n');
}

/**
 * Format seconds to SRT timestamp (HH:MM:SS,mmm)
 */
function formatSrtTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);

  return `${padZero(hours, 2)}:${padZero(minutes, 2)}:${padZero(secs, 2)},${padZero(ms, 3)}`;
}

/**
 * Pad number with leading zeros
 */
function padZero(num: number, length: number): string {
  return String(num).padStart(length, '0');
}
