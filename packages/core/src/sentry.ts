/**
 * Sentry error tracking wrapper - pluggable adapter pattern
 *
 * This module provides a Sentry-compatible interface for error tracking.
 * The actual Sentry SDK can be injected at deployment time via setSentryBackend().
 * Default implementation uses in-memory logging.
 */

import { createLogger } from './logger.js';

// ---------------------------------------------------------------------------
// Config & types
// ---------------------------------------------------------------------------

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
}

export interface SentrySpan {
  finish(): void;
  setStatus(status: string): void;
}

export interface SentryTransaction {
  finish(): void;
  setStatus(status: string): void;
  startChild(op: string, description: string): SentrySpan;
}

export interface SentryBreadcrumb {
  message: string;
  category: string;
  data: Record<string, unknown> | undefined;
  timestamp: string;
}

export interface SentryUser {
  id: string;
  email?: string;
}

/**
 * Backend interface that real Sentry SDK implementations must satisfy.
 * The default in-memory backend is used when no SDK is injected.
 */
export interface SentryBackend {
  init(config: SentryConfig): void;
  captureException(error: unknown, context?: Record<string, unknown>): string;
  addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void;
  setUser(user: SentryUser): void;
  startTransaction(name: string, op: string): SentryTransaction;
}

// ---------------------------------------------------------------------------
// In-memory backend (default)
// ---------------------------------------------------------------------------

interface StoredEvent {
  eventId: string;
  error: unknown;
  context: Record<string, unknown> | undefined;
  timestamp: string;
}

interface StoredSpan {
  op: string;
  description: string;
  status: string;
  finished: boolean;
}

interface StoredTransaction {
  name: string;
  op: string;
  status: string;
  finished: boolean;
  children: StoredSpan[];
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createInMemoryBackend(): SentryBackend & {
  getEvents(): StoredEvent[];
  getBreadcrumbs(): SentryBreadcrumb[];
  getUser(): SentryUser | null;
  getTransactions(): StoredTransaction[];
  getConfig(): SentryConfig | null;
  reset(): void;
} {
  const logger = createLogger({ agentId: 'sentry:in-memory' });

  let config: SentryConfig | null = null;
  let events: StoredEvent[] = [];
  let breadcrumbs: SentryBreadcrumb[] = [];
  let currentUser: SentryUser | null = null;
  let transactions: StoredTransaction[] = [];

  return {
    init(cfg: SentryConfig): void {
      config = cfg;
      events = [];
      breadcrumbs = [];
      currentUser = null;
      transactions = [];
      logger.info('sentry_init', {
        dsn: cfg.dsn,
        environment: cfg.environment,
        release: cfg.release,
      });
    },

    captureException(error: unknown, context?: Record<string, unknown>): string {
      const eventId = generateEventId();
      events.push({
        eventId,
        error,
        context,
        timestamp: new Date().toISOString(),
      });
      logger.error('capture_exception', {
        eventId,
        error: error instanceof Error ? error.message : String(error),
        context,
      });
      return eventId;
    },

    addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
      breadcrumbs.push({
        message,
        category,
        data,
        timestamp: new Date().toISOString(),
      });
      logger.debug('add_breadcrumb', { message, category });
    },

    setUser(user: SentryUser): void {
      currentUser = user;
      logger.info('set_user', { userId: user.id });
    },

    startTransaction(name: string, op: string): SentryTransaction {
      const stored: StoredTransaction = {
        name,
        op,
        status: 'ok',
        finished: false,
        children: [],
      };
      transactions.push(stored);
      logger.info('start_transaction', { name, op });

      return {
        finish(): void {
          stored.finished = true;
          logger.info('finish_transaction', { name, op, status: stored.status });
        },
        setStatus(status: string): void {
          stored.status = status;
        },
        startChild(childOp: string, description: string): SentrySpan {
          const span: StoredSpan = {
            op: childOp,
            description,
            status: 'ok',
            finished: false,
          };
          stored.children.push(span);
          logger.debug('start_span', { op: childOp, description });

          return {
            finish(): void {
              span.finished = true;
              logger.debug('finish_span', { op: childOp, description, status: span.status });
            },
            setStatus(status: string): void {
              span.status = status;
            },
          };
        },
      };
    },

    // Inspection methods for testing and debugging
    getEvents(): StoredEvent[] {
      return [...events];
    },
    getBreadcrumbs(): SentryBreadcrumb[] {
      return [...breadcrumbs];
    },
    getUser(): SentryUser | null {
      return currentUser;
    },
    getTransactions(): StoredTransaction[] {
      return [...transactions];
    },
    getConfig(): SentryConfig | null {
      return config;
    },
    reset(): void {
      config = null;
      events = [];
      breadcrumbs = [];
      currentUser = null;
      transactions = [];
    },
  };
}

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

let backend: SentryBackend = createInMemoryBackend();
let initialized = false;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Replace the default in-memory backend with a real Sentry SDK adapter.
 * Call this before initSentry() for production deployments.
 */
export function setSentryBackend(newBackend: SentryBackend): void {
  backend = newBackend;
  initialized = false;
}

/**
 * Reset to the default in-memory backend (useful for testing).
 */
export function resetSentryBackend(): void {
  backend = createInMemoryBackend();
  initialized = false;
}

/**
 * Get the current backend (for inspection in tests).
 */
export function getSentryBackend(): SentryBackend {
  return backend;
}

/**
 * Initialize Sentry error tracking.
 */
export function initSentry(config: SentryConfig): void {
  backend.init(config);
  initialized = true;
}

/**
 * Check if Sentry has been initialized.
 */
export function isSentryInitialized(): boolean {
  return initialized;
}

/**
 * Capture an exception and return an event ID.
 */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): string {
  return backend.captureException(error, context);
}

/**
 * Add a breadcrumb for debugging context.
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
): void {
  backend.addBreadcrumb(message, category, data);
}

/**
 * Set the current user context.
 */
export function setUser(user: SentryUser): void {
  backend.setUser(user);
}

/**
 * Start a performance transaction.
 */
export function startTransaction(name: string, op: string): SentryTransaction {
  return backend.startTransaction(name, op);
}
