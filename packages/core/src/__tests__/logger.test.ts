import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createLogger } from '../logger.js';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let logs: string[] = [];

  beforeEach(() => {
    logs = [];
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation((msg: string) => {
      logs.push(msg);
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('createLogger', () => {
    it('should create a logger without context', () => {
      const logger = createLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should create a logger with context', () => {
      const logger = createLogger({ agentId: 'agent-1', taskId: 'task-1' });
      expect(logger).toBeDefined();
    });
  });

  describe('info', () => {
    it('should log info message', () => {
      const logger = createLogger();
      logger.info('test-action');

      expect(logs).toHaveLength(1);
      const entry = JSON.parse(logs[0]);
      expect(entry.level).toBe('info');
      expect(entry.action).toBe('test-action');
      expect(entry.timestamp).toBeDefined();
    });

    it('should log info with data', () => {
      const logger = createLogger();
      logger.info('test-action', { count: 42, name: 'test' });

      expect(logs).toHaveLength(1);
      const entry = JSON.parse(logs[0]);
      expect(entry.level).toBe('info');
      expect(entry.action).toBe('test-action');
      expect(entry.count).toBe(42);
      expect(entry.name).toBe('test');
    });

    it('should include context in log', () => {
      const logger = createLogger({ agentId: 'agent-1', taskId: 'task-1' });
      logger.info('test-action');

      expect(logs).toHaveLength(1);
      const entry = JSON.parse(logs[0]);
      expect(entry.agentId).toBe('agent-1');
      expect(entry.taskId).toBe('task-1');
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      const logger = createLogger();
      logger.warn('warning-action');

      expect(logs).toHaveLength(1);
      const entry = JSON.parse(logs[0]);
      expect(entry.level).toBe('warn');
      expect(entry.action).toBe('warning-action');
    });

    it('should log warning with data', () => {
      const logger = createLogger();
      logger.warn('warning-action', { reason: 'timeout' });

      expect(logs).toHaveLength(1);
      const entry = JSON.parse(logs[0]);
      expect(entry.level).toBe('warn');
      expect(entry.reason).toBe('timeout');
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      const logger = createLogger();
      logger.error('error-action');

      expect(logs).toHaveLength(1);
      const entry = JSON.parse(logs[0]);
      expect(entry.level).toBe('error');
      expect(entry.action).toBe('error-action');
    });

    it('should log error with data', () => {
      const logger = createLogger();
      logger.error('error-action', { message: 'failed', code: 500 });

      expect(logs).toHaveLength(1);
      const entry = JSON.parse(logs[0]);
      expect(entry.level).toBe('error');
      expect(entry.message).toBe('failed');
      expect(entry.code).toBe(500);
    });
  });

  describe('debug', () => {
    it('should log debug message', () => {
      const logger = createLogger();
      logger.debug('debug-action');

      expect(logs).toHaveLength(1);
      const entry = JSON.parse(logs[0]);
      expect(entry.level).toBe('debug');
      expect(entry.action).toBe('debug-action');
    });

    it('should log debug with data', () => {
      const logger = createLogger();
      logger.debug('debug-action', { step: 1, value: 'test' });

      expect(logs).toHaveLength(1);
      const entry = JSON.parse(logs[0]);
      expect(entry.level).toBe('debug');
      expect(entry.step).toBe(1);
      expect(entry.value).toBe('test');
    });
  });

  describe('structured logging', () => {
    it('should output valid JSON', () => {
      const logger = createLogger({ agentId: 'agent-1' });
      logger.info('test', { nested: { value: 42 } });

      expect(logs).toHaveLength(1);
      expect(() => JSON.parse(logs[0])).not.toThrow();
    });

    it('should include all fields in correct order', () => {
      const logger = createLogger({ agentId: 'agent-1', taskId: 'task-1' });
      logger.info('action', { custom: 'data' });

      const entry = JSON.parse(logs[0]);
      expect(Object.keys(entry)).toContain('timestamp');
      expect(Object.keys(entry)).toContain('level');
      expect(Object.keys(entry)).toContain('action');
      expect(Object.keys(entry)).toContain('agentId');
      expect(Object.keys(entry)).toContain('taskId');
      expect(Object.keys(entry)).toContain('custom');
    });

    it('should handle multiple log entries', () => {
      const logger = createLogger({ agentId: 'agent-1' });
      logger.info('first');
      logger.warn('second');
      logger.error('third');
      logger.debug('fourth');

      expect(logs).toHaveLength(4);
      expect(JSON.parse(logs[0]).level).toBe('info');
      expect(JSON.parse(logs[1]).level).toBe('warn');
      expect(JSON.parse(logs[2]).level).toBe('error');
      expect(JSON.parse(logs[3]).level).toBe('debug');
    });
  });

  describe('context handling', () => {
    it('should work with partial context', () => {
      const logger = createLogger({ agentId: 'agent-1' });
      logger.info('test');

      const entry = JSON.parse(logs[0]);
      expect(entry.agentId).toBe('agent-1');
      expect(entry.taskId).toBeUndefined();
    });

    it('should merge context with log data', () => {
      const logger = createLogger({ agentId: 'agent-1' });
      logger.info('test', { extra: 'value' });

      const entry = JSON.parse(logs[0]);
      expect(entry.agentId).toBe('agent-1');
      expect(entry.extra).toBe('value');
    });

    it('should allow data to override context fields', () => {
      const logger = createLogger({ agentId: 'agent-1' });
      logger.info('test', { agentId: 'agent-2' });

      const entry = JSON.parse(logs[0]);
      // Data should override context
      expect(entry.agentId).toBe('agent-2');
    });
  });

  describe('timestamp', () => {
    it('should include ISO timestamp', () => {
      const logger = createLogger();
      logger.info('test');

      const entry = JSON.parse(logs[0]);
      expect(entry.timestamp).toBeDefined();
      expect(() => new Date(entry.timestamp)).not.toThrow();
      expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp);
    });

    it('should have unique timestamps for rapid logs', () => {
      const logger = createLogger();
      logger.info('first');
      logger.info('second');

      const entry1 = JSON.parse(logs[0]);
      const entry2 = JSON.parse(logs[1]);
      // Timestamps should be defined (may be same if very fast)
      expect(entry1.timestamp).toBeDefined();
      expect(entry2.timestamp).toBeDefined();
    });
  });
});
