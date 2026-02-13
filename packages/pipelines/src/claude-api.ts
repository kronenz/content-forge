/**
 * Claude API integration module
 */

import { Ok, Err, type Result } from '@content-forge/core';

export interface ClaudeApiConfig {
  apiKey: string;
  model: string; // default: 'claude-sonnet-4-20250514'
  maxRetries: number; // default: 3
  baseDelayMs: number; // default: 1000
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeApiError {
  message: string;
  statusCode?: number;
  retryable: boolean;
}

interface ClaudeApiRequest {
  model: string;
  max_tokens: number;
  messages: ClaudeMessage[];
  system?: string;
}

interface ClaudeApiResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text: string }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface ClaudeErrorResponse {
  type: 'error';
  error: {
    type: string;
    message: string;
  };
}

/**
 * Call Claude API with exponential backoff retry logic
 */
export async function callClaude(
  messages: ClaudeMessage[],
  systemPrompt: string,
  config: ClaudeApiConfig
): Promise<Result<string, ClaudeApiError>> {
  let lastError: ClaudeApiError | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    if (attempt > 0) {
      // Calculate exponential backoff delay
      const delay = config.baseDelayMs * Math.pow(2, attempt - 1);
      await sleep(delay);
    }

    const result = await makeSingleRequest(messages, systemPrompt, config);

    if (result.ok) {
      return result;
    }

    lastError = result.error;

    // Don't retry non-retryable errors
    if (!result.error.retryable) {
      return result;
    }

    // For rate limits, use longer backoff
    if (result.error.statusCode === 429 && attempt < config.maxRetries) {
      const rateLimitDelay = config.baseDelayMs * Math.pow(2, attempt + 2);
      await sleep(rateLimitDelay);
    }
  }

  // All retries exhausted
  return Err(lastError || {
    message: 'Max retries exceeded',
    retryable: false
  });
}

/**
 * Make a single request to Claude API
 */
async function makeSingleRequest(
  messages: ClaudeMessage[],
  systemPrompt: string,
  config: ClaudeApiConfig
): Promise<Result<string, ClaudeApiError>> {
  try {
    const requestBody: ClaudeApiRequest = {
      model: config.model,
      max_tokens: 4096,
      messages,
      system: systemPrompt
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    const statusCode = response.status;

    // Parse response body
    const data = await response.json() as ClaudeApiResponse | ClaudeErrorResponse;

    // Handle error responses
    if (!response.ok) {
      const errorData = data as ClaudeErrorResponse;
      const message = errorData.error?.message || `HTTP ${statusCode} error`;

      return Err({
        message,
        statusCode,
        retryable: isRetryableStatus(statusCode)
      });
    }

    // Extract text from successful response
    const successData = data as ClaudeApiResponse;
    const textContent = successData.content.find(c => c.type === 'text');

    if (!textContent) {
      return Err({
        message: 'No text content in response',
        statusCode,
        retryable: false
      });
    }

    return Ok(textContent.text);

  } catch (error) {
    // Network or parsing errors
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Err({
      message: `Request failed: ${message}`,
      retryable: true
    });
  }
}

/**
 * Determine if HTTP status code is retryable
 */
function isRetryableStatus(statusCode: number): boolean {
  // 5xx server errors are retryable
  if (statusCode >= 500) {
    return true;
  }

  // 429 rate limit is retryable
  if (statusCode === 429) {
    return true;
  }

  // 4xx client errors (except 429) are not retryable
  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
