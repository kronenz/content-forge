/**
 * Langfuse AI call tracing wrapper - pluggable adapter pattern
 *
 * This module provides a Langfuse-compatible interface for tracing AI calls.
 * The actual Langfuse SDK can be injected at deployment time via setLangfuseBackend().
 * Default implementation uses in-memory logging.
 */

import { createLogger } from './logger.js';

// ---------------------------------------------------------------------------
// Config & types
// ---------------------------------------------------------------------------

export interface LangfuseConfig {
  publicKey: string;
  secretKey: string;
  baseUrl?: string;
  enabled?: boolean;
}

export interface GenerationParams {
  model: string;
  input: unknown;
  modelParameters?: Record<string, unknown>;
}

export interface LangfuseSpan {
  end(output?: unknown): void;
  event(name: string, data?: unknown): void;
}

export interface LangfuseGeneration {
  end(output: string, usage?: { promptTokens: number; completionTokens: number }): void;
}

export interface LangfuseTrace {
  id: string;
  span(name: string, input?: unknown): LangfuseSpan;
  generation(name: string, params: GenerationParams): LangfuseGeneration;
  update(data: Record<string, unknown>): void;
}

/**
 * Backend interface that real Langfuse SDK implementations must satisfy.
 */
export interface LangfuseBackend {
  init(config: LangfuseConfig): void;
  createTrace(name: string, metadata?: Record<string, unknown>): LangfuseTrace;
}

// ---------------------------------------------------------------------------
// In-memory stored types (for testing/debugging)
// ---------------------------------------------------------------------------

interface StoredEvent {
  name: string;
  data?: unknown;
  timestamp: string;
}

interface StoredSpan {
  name: string;
  input: unknown;
  output: unknown;
  events: StoredEvent[];
  ended: boolean;
}

interface StoredGeneration {
  name: string;
  params: GenerationParams;
  output: string | undefined;
  usage: { promptTokens: number; completionTokens: number } | undefined;
  ended: boolean;
}

interface StoredTrace {
  id: string;
  name: string;
  metadata: Record<string, unknown> | undefined;
  updates: Record<string, unknown>[];
  spans: StoredSpan[];
  generations: StoredGeneration[];
}

// ---------------------------------------------------------------------------
// In-memory backend (default)
// ---------------------------------------------------------------------------

function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createInMemoryBackend(): LangfuseBackend & {
  getTraces(): StoredTrace[];
  getConfig(): LangfuseConfig | null;
  reset(): void;
} {
  const logger = createLogger({ agentId: 'langfuse:in-memory' });

  let config: LangfuseConfig | null = null;
  let traces: StoredTrace[] = [];

  return {
    init(cfg: LangfuseConfig): void {
      config = cfg;
      traces = [];
      logger.info('langfuse_init', {
        baseUrl: cfg.baseUrl,
        enabled: cfg.enabled,
      });
    },

    createTrace(name: string, metadata?: Record<string, unknown>): LangfuseTrace {
      const traceId = generateTraceId();
      const stored: StoredTrace = {
        id: traceId,
        name,
        metadata,
        updates: [],
        spans: [],
        generations: [],
      };
      traces.push(stored);
      logger.info('create_trace', { traceId, name });

      return {
        id: traceId,

        span(spanName: string, input?: unknown): LangfuseSpan {
          const storedSpan: StoredSpan = {
            name: spanName,
            input,
            output: undefined,
            events: [],
            ended: false,
          };
          stored.spans.push(storedSpan);
          logger.debug('create_span', { traceId, spanName });

          return {
            end(output?: unknown): void {
              storedSpan.output = output;
              storedSpan.ended = true;
              logger.debug('end_span', { traceId, spanName });
            },
            event(eventName: string, data?: unknown): void {
              storedSpan.events.push({
                name: eventName,
                data,
                timestamp: new Date().toISOString(),
              });
              logger.debug('span_event', { traceId, spanName, eventName });
            },
          };
        },

        generation(genName: string, params: GenerationParams): LangfuseGeneration {
          const storedGen: StoredGeneration = {
            name: genName,
            params,
            output: undefined,
            usage: undefined,
            ended: false,
          };
          stored.generations.push(storedGen);
          logger.debug('create_generation', {
            traceId,
            genName,
            model: params.model,
          });

          return {
            end(output: string, usage?: { promptTokens: number; completionTokens: number }): void {
              storedGen.output = output;
              storedGen.usage = usage;
              storedGen.ended = true;
              logger.debug('end_generation', {
                traceId,
                genName,
                promptTokens: usage?.promptTokens,
                completionTokens: usage?.completionTokens,
              });
            },
          };
        },

        update(data: Record<string, unknown>): void {
          stored.updates.push(data);
          logger.debug('update_trace', { traceId, data });
        },
      };
    },

    // Inspection methods for testing and debugging
    getTraces(): StoredTrace[] {
      return [...traces];
    },
    getConfig(): LangfuseConfig | null {
      return config;
    },
    reset(): void {
      config = null;
      traces = [];
    },
  };
}

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

let backend: LangfuseBackend = createInMemoryBackend();
let initialized = false;
let enabled = true;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Replace the default in-memory backend with a real Langfuse SDK adapter.
 * Call this before initLangfuse() for production deployments.
 */
export function setLangfuseBackend(newBackend: LangfuseBackend): void {
  backend = newBackend;
  initialized = false;
}

/**
 * Reset to the default in-memory backend (useful for testing).
 */
export function resetLangfuseBackend(): void {
  backend = createInMemoryBackend();
  initialized = false;
  enabled = true;
}

/**
 * Get the current backend (for inspection in tests).
 */
export function getLangfuseBackend(): LangfuseBackend {
  return backend;
}

/**
 * Initialize Langfuse tracing.
 */
export function initLangfuse(config: LangfuseConfig): void {
  enabled = config.enabled !== false;
  backend.init(config);
  initialized = true;
}

/**
 * Check if Langfuse has been initialized.
 */
export function isLangfuseInitialized(): boolean {
  return initialized;
}

/**
 * Check if Langfuse tracing is enabled.
 */
export function isLangfuseEnabled(): boolean {
  return enabled;
}

/**
 * Create a new trace for an AI call or operation.
 * Returns a no-op trace if Langfuse is disabled.
 */
export function createTrace(
  name: string,
  metadata?: Record<string, unknown>,
): LangfuseTrace {
  if (!enabled) {
    return createNoOpTrace();
  }
  return backend.createTrace(name, metadata);
}

// ---------------------------------------------------------------------------
// No-op trace (used when Langfuse is disabled)
// ---------------------------------------------------------------------------

function createNoOpTrace(): LangfuseTrace {
  const noOpSpan: LangfuseSpan = {
    end(): void { /* no-op */ },
    event(): void { /* no-op */ },
  };

  const noOpGeneration: LangfuseGeneration = {
    end(): void { /* no-op */ },
  };

  return {
    id: 'noop',
    span(): LangfuseSpan {
      return noOpSpan;
    },
    generation(): LangfuseGeneration {
      return noOpGeneration;
    },
    update(): void { /* no-op */ },
  };
}
