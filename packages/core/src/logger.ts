/**
 * Structured JSON logger
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  agentId?: string;
  taskId?: string;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  agentId?: string;
  taskId?: string;
  action: string;
  [key: string]: unknown;
}

export interface Logger {
  info(action: string, data?: Record<string, unknown>): void;
  warn(action: string, data?: Record<string, unknown>): void;
  error(action: string, data?: Record<string, unknown>): void;
  debug(action: string, data?: Record<string, unknown>): void;
}

/**
 * Creates a structured logger with context
 */
export function createLogger(context: LogContext = {}): Logger {
  const log = (level: LogLevel, action: string, data?: Record<string, unknown>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      action,
      ...context,
      ...data,
    };
    console.log(JSON.stringify(entry));
  };

  return {
    info: (action: string, data?: Record<string, unknown>) => log('info', action, data),
    warn: (action: string, data?: Record<string, unknown>) => log('warn', action, data),
    error: (action: string, data?: Record<string, unknown>) => log('error', action, data),
    debug: (action: string, data?: Record<string, unknown>) => log('debug', action, data),
  };
}
