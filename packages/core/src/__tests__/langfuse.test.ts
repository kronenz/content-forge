import { describe, it, expect, beforeEach } from 'vitest';
import {
  initLangfuse,
  createTrace,
  isLangfuseInitialized,
  isLangfuseEnabled,
  resetLangfuseBackend,
  getLangfuseBackend,
  setLangfuseBackend,
  type LangfuseConfig,
  type LangfuseBackend,
} from '../langfuse.js';

function makeConfig(overrides: Partial<LangfuseConfig> = {}): LangfuseConfig {
  return {
    publicKey: 'pk-test-123',
    secretKey: 'sk-test-456',
    baseUrl: 'https://langfuse.example.com',
    enabled: true,
    ...overrides,
  };
}

describe('Langfuse wrapper', () => {
  beforeEach(() => {
    resetLangfuseBackend();
  });

  describe('initLangfuse', () => {
    it('should initialize langfuse with config', () => {
      expect(isLangfuseInitialized()).toBe(false);
      initLangfuse(makeConfig());
      expect(isLangfuseInitialized()).toBe(true);
    });

    it('should store config in backend', () => {
      const config = makeConfig({ baseUrl: 'https://custom.langfuse.com' });
      initLangfuse(config);
      const backend = getLangfuseBackend() as ReturnType<typeof getLangfuseBackend> & {
        getConfig(): LangfuseConfig | null;
      };
      expect(backend.getConfig()).toEqual(config);
    });

    it('should set enabled state from config', () => {
      initLangfuse(makeConfig({ enabled: false }));
      expect(isLangfuseEnabled()).toBe(false);
    });

    it('should default to enabled when not specified', () => {
      initLangfuse({ publicKey: 'pk', secretKey: 'sk' });
      expect(isLangfuseEnabled()).toBe(true);
    });
  });

  describe('createTrace', () => {
    it('should create a trace with an ID', () => {
      initLangfuse(makeConfig());
      const trace = createTrace('test-operation');
      expect(typeof trace.id).toBe('string');
      expect(trace.id.length).toBeGreaterThan(0);
    });

    it('should store trace in backend', () => {
      initLangfuse(makeConfig());
      createTrace('my-trace', { key: 'value' });
      const backend = getLangfuseBackend() as ReturnType<typeof getLangfuseBackend> & {
        getTraces(): Array<{ name: string; metadata?: Record<string, unknown> }>;
      };
      const traces = backend.getTraces();
      expect(traces).toHaveLength(1);
      expect(traces[0]!.name).toBe('my-trace');
      expect(traces[0]!.metadata).toEqual({ key: 'value' });
    });

    it('should generate unique trace IDs', () => {
      initLangfuse(makeConfig());
      const t1 = createTrace('trace-1');
      const t2 = createTrace('trace-2');
      expect(t1.id).not.toBe(t2.id);
    });

    it('should return no-op trace when disabled', () => {
      initLangfuse(makeConfig({ enabled: false }));
      const trace = createTrace('should-be-noop');
      expect(trace.id).toBe('noop');
      // Methods should not throw
      const span = trace.span('test-span');
      span.event('evt');
      span.end();
      const gen = trace.generation('test-gen', {
        model: 'gpt-4',
        input: 'hello',
      });
      gen.end('response', { promptTokens: 10, completionTokens: 20 });
      trace.update({ status: 'done' });
      // No traces should be recorded
      const backend = getLangfuseBackend() as ReturnType<typeof getLangfuseBackend> & {
        getTraces(): unknown[];
      };
      expect(backend.getTraces()).toHaveLength(0);
    });
  });

  describe('LangfuseTrace.span', () => {
    it('should create a span on a trace', () => {
      initLangfuse(makeConfig());
      const trace = createTrace('trace-with-span');
      const span = trace.span('db-query', { sql: 'SELECT 1' });
      expect(span).toBeDefined();
      expect(typeof span.end).toBe('function');
      expect(typeof span.event).toBe('function');
    });

    it('should record span end with output', () => {
      initLangfuse(makeConfig());
      const trace = createTrace('span-test');
      const span = trace.span('processing', { input: 'raw' });
      span.end({ result: 'processed' });

      const backend = getLangfuseBackend() as ReturnType<typeof getLangfuseBackend> & {
        getTraces(): Array<{
          spans: Array<{ name: string; input?: unknown; output?: unknown; ended: boolean }>;
        }>;
      };
      const spans = backend.getTraces()[0]!.spans;
      expect(spans).toHaveLength(1);
      expect(spans[0]!.name).toBe('processing');
      expect(spans[0]!.output).toEqual({ result: 'processed' });
      expect(spans[0]!.ended).toBe(true);
    });

    it('should record span events', () => {
      initLangfuse(makeConfig());
      const trace = createTrace('event-test');
      const span = trace.span('work');
      span.event('checkpoint', { step: 1 });
      span.event('checkpoint', { step: 2 });
      span.end();

      const backend = getLangfuseBackend() as ReturnType<typeof getLangfuseBackend> & {
        getTraces(): Array<{
          spans: Array<{ events: Array<{ name: string; data?: unknown }> }>;
        }>;
      };
      const events = backend.getTraces()[0]!.spans[0]!.events;
      expect(events).toHaveLength(2);
      expect(events[0]!.name).toBe('checkpoint');
      expect(events[1]!.data).toEqual({ step: 2 });
    });
  });

  describe('LangfuseTrace.generation', () => {
    it('should create a generation with params', () => {
      initLangfuse(makeConfig());
      const trace = createTrace('gen-trace');
      const gen = trace.generation('llm-call', {
        model: 'claude-3',
        input: 'Summarize this article',
        modelParameters: { temperature: 0.7 },
      });
      expect(gen).toBeDefined();
      expect(typeof gen.end).toBe('function');
    });

    it('should record generation output and usage', () => {
      initLangfuse(makeConfig());
      const trace = createTrace('gen-trace');
      const gen = trace.generation('llm-call', {
        model: 'gpt-4',
        input: 'Hello',
      });
      gen.end('Response text', { promptTokens: 5, completionTokens: 15 });

      const backend = getLangfuseBackend() as ReturnType<typeof getLangfuseBackend> & {
        getTraces(): Array<{
          generations: Array<{
            name: string;
            output?: string;
            usage?: { promptTokens: number; completionTokens: number };
            ended: boolean;
          }>;
        }>;
      };
      const gens = backend.getTraces()[0]!.generations;
      expect(gens).toHaveLength(1);
      expect(gens[0]!.output).toBe('Response text');
      expect(gens[0]!.usage).toEqual({ promptTokens: 5, completionTokens: 15 });
      expect(gens[0]!.ended).toBe(true);
    });
  });

  describe('LangfuseTrace.update', () => {
    it('should record trace updates', () => {
      initLangfuse(makeConfig());
      const trace = createTrace('update-test');
      trace.update({ status: 'completed', score: 0.95 });

      const backend = getLangfuseBackend() as ReturnType<typeof getLangfuseBackend> & {
        getTraces(): Array<{ updates: Array<Record<string, unknown>> }>;
      };
      const updates = backend.getTraces()[0]!.updates;
      expect(updates).toHaveLength(1);
      expect(updates[0]).toEqual({ status: 'completed', score: 0.95 });
    });
  });

  describe('setLangfuseBackend', () => {
    it('should replace the backend', () => {
      const calls: string[] = [];
      const customBackend: LangfuseBackend = {
        init: () => { calls.push('init'); },
        createTrace: (name) => {
          calls.push(`trace:${name}`);
          return {
            id: 'custom-id',
            span: () => ({ end() { /* no-op */ }, event() { /* no-op */ } }),
            generation: () => ({ end() { /* no-op */ } }),
            update: () => { /* no-op */ },
          };
        },
      };

      setLangfuseBackend(customBackend);
      initLangfuse(makeConfig());
      createTrace('test');

      expect(calls).toEqual(['init', 'trace:test']);
    });
  });

  describe('resetLangfuseBackend', () => {
    it('should reset to default in-memory backend', () => {
      initLangfuse(makeConfig());
      expect(isLangfuseInitialized()).toBe(true);
      resetLangfuseBackend();
      expect(isLangfuseInitialized()).toBe(false);
    });

    it('should reset enabled state', () => {
      initLangfuse(makeConfig({ enabled: false }));
      expect(isLangfuseEnabled()).toBe(false);
      resetLangfuseBackend();
      expect(isLangfuseEnabled()).toBe(true);
    });
  });
});
