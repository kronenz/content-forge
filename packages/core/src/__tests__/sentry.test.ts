import { describe, it, expect, beforeEach } from 'vitest';
import {
  initSentry,
  captureException,
  addBreadcrumb,
  setUser,
  startTransaction,
  isSentryInitialized,
  resetSentryBackend,
  getSentryBackend,
  setSentryBackend,
  type SentryConfig,
  type SentryBackend,
} from '../sentry.js';

function makeConfig(overrides: Partial<SentryConfig> = {}): SentryConfig {
  return {
    dsn: 'https://test@sentry.io/123',
    environment: 'test',
    release: '1.0.0',
    tracesSampleRate: 1.0,
    ...overrides,
  };
}

describe('Sentry wrapper', () => {
  beforeEach(() => {
    resetSentryBackend();
  });

  describe('initSentry', () => {
    it('should initialize sentry with config', () => {
      expect(isSentryInitialized()).toBe(false);
      initSentry(makeConfig());
      expect(isSentryInitialized()).toBe(true);
    });

    it('should store config in backend', () => {
      const config = makeConfig({ environment: 'production' });
      initSentry(config);
      const backend = getSentryBackend() as ReturnType<typeof getSentryBackend> & {
        getConfig(): SentryConfig | null;
      };
      expect(backend.getConfig()).toEqual(config);
    });

    it('should reset state on re-initialization', () => {
      initSentry(makeConfig());
      captureException(new Error('first'));
      initSentry(makeConfig());
      const backend = getSentryBackend() as ReturnType<typeof getSentryBackend> & {
        getEvents(): unknown[];
      };
      expect(backend.getEvents()).toHaveLength(0);
    });
  });

  describe('captureException', () => {
    it('should return an event ID string', () => {
      initSentry(makeConfig());
      const eventId = captureException(new Error('test error'));
      expect(typeof eventId).toBe('string');
      expect(eventId.length).toBeGreaterThan(0);
    });

    it('should capture Error objects', () => {
      initSentry(makeConfig());
      const error = new Error('something broke');
      captureException(error);
      const backend = getSentryBackend() as ReturnType<typeof getSentryBackend> & {
        getEvents(): Array<{ error: unknown }>;
      };
      const events = backend.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]!.error).toBe(error);
    });

    it('should capture non-Error values', () => {
      initSentry(makeConfig());
      captureException('string error');
      const backend = getSentryBackend() as ReturnType<typeof getSentryBackend> & {
        getEvents(): Array<{ error: unknown }>;
      };
      expect(backend.getEvents()[0]!.error).toBe('string error');
    });

    it('should include context when provided', () => {
      initSentry(makeConfig());
      const ctx = { userId: 'u1', action: 'publish' };
      captureException(new Error('fail'), ctx);
      const backend = getSentryBackend() as ReturnType<typeof getSentryBackend> & {
        getEvents(): Array<{ context?: Record<string, unknown> }>;
      };
      expect(backend.getEvents()[0]!.context).toEqual(ctx);
    });

    it('should generate unique event IDs', () => {
      initSentry(makeConfig());
      const id1 = captureException(new Error('e1'));
      const id2 = captureException(new Error('e2'));
      expect(id1).not.toBe(id2);
    });
  });

  describe('addBreadcrumb', () => {
    it('should store breadcrumbs', () => {
      initSentry(makeConfig());
      addBreadcrumb('user clicked', 'ui');
      const backend = getSentryBackend() as ReturnType<typeof getSentryBackend> & {
        getBreadcrumbs(): Array<{ message: string; category: string }>;
      };
      const crumbs = backend.getBreadcrumbs();
      expect(crumbs).toHaveLength(1);
      expect(crumbs[0]!.message).toBe('user clicked');
      expect(crumbs[0]!.category).toBe('ui');
    });

    it('should include data when provided', () => {
      initSentry(makeConfig());
      addBreadcrumb('api call', 'http', { url: '/api/test', method: 'POST' });
      const backend = getSentryBackend() as ReturnType<typeof getSentryBackend> & {
        getBreadcrumbs(): Array<{ data?: Record<string, unknown> }>;
      };
      expect(backend.getBreadcrumbs()[0]!.data).toEqual({
        url: '/api/test',
        method: 'POST',
      });
    });

    it('should accumulate multiple breadcrumbs', () => {
      initSentry(makeConfig());
      addBreadcrumb('step 1', 'nav');
      addBreadcrumb('step 2', 'nav');
      addBreadcrumb('step 3', 'nav');
      const backend = getSentryBackend() as ReturnType<typeof getSentryBackend> & {
        getBreadcrumbs(): unknown[];
      };
      expect(backend.getBreadcrumbs()).toHaveLength(3);
    });
  });

  describe('setUser', () => {
    it('should set user with id only', () => {
      initSentry(makeConfig());
      setUser({ id: 'user-123' });
      const backend = getSentryBackend() as ReturnType<typeof getSentryBackend> & {
        getUser(): { id: string; email?: string } | null;
      };
      expect(backend.getUser()).toEqual({ id: 'user-123' });
    });

    it('should set user with email', () => {
      initSentry(makeConfig());
      setUser({ id: 'user-456', email: 'test@example.com' });
      const backend = getSentryBackend() as ReturnType<typeof getSentryBackend> & {
        getUser(): { id: string; email?: string } | null;
      };
      const user = backend.getUser();
      expect(user?.id).toBe('user-456');
      expect(user?.email).toBe('test@example.com');
    });
  });

  describe('startTransaction', () => {
    it('should create a transaction', () => {
      initSentry(makeConfig());
      const txn = startTransaction('publish-content', 'task');
      expect(txn).toBeDefined();
      expect(typeof txn.finish).toBe('function');
      expect(typeof txn.setStatus).toBe('function');
      expect(typeof txn.startChild).toBe('function');
    });

    it('should track transaction in backend', () => {
      initSentry(makeConfig());
      startTransaction('process-material', 'pipeline');
      const backend = getSentryBackend() as ReturnType<typeof getSentryBackend> & {
        getTransactions(): Array<{ name: string; op: string }>;
      };
      const txns = backend.getTransactions();
      expect(txns).toHaveLength(1);
      expect(txns[0]!.name).toBe('process-material');
      expect(txns[0]!.op).toBe('pipeline');
    });

    it('should allow finishing a transaction', () => {
      initSentry(makeConfig());
      const txn = startTransaction('test-txn', 'test');
      txn.setStatus('ok');
      txn.finish();
      const backend = getSentryBackend() as ReturnType<typeof getSentryBackend> & {
        getTransactions(): Array<{ finished: boolean; status: string }>;
      };
      const stored = backend.getTransactions()[0]!;
      expect(stored.finished).toBe(true);
      expect(stored.status).toBe('ok');
    });

    it('should create child spans', () => {
      initSentry(makeConfig());
      const txn = startTransaction('parent', 'task');
      const span = txn.startChild('db.query', 'SELECT * FROM materials');
      span.setStatus('ok');
      span.finish();
      txn.finish();
      const backend = getSentryBackend() as ReturnType<typeof getSentryBackend> & {
        getTransactions(): Array<{ children: Array<{ op: string; description: string; finished: boolean }> }>;
      };
      const children = backend.getTransactions()[0]!.children;
      expect(children).toHaveLength(1);
      expect(children[0]!.op).toBe('db.query');
      expect(children[0]!.description).toBe('SELECT * FROM materials');
      expect(children[0]!.finished).toBe(true);
    });
  });

  describe('setSentryBackend', () => {
    it('should replace the backend', () => {
      const capturedCalls: string[] = [];
      const customBackend: SentryBackend = {
        init: () => { capturedCalls.push('init'); },
        captureException: () => { capturedCalls.push('capture'); return 'custom-id'; },
        addBreadcrumb: () => { capturedCalls.push('breadcrumb'); },
        setUser: () => { capturedCalls.push('user'); },
        startTransaction: (_name, _op) => {
          capturedCalls.push('transaction');
          return {
            finish() { /* no-op */ },
            setStatus() { /* no-op */ },
            startChild() { return { finish() { /* no-op */ }, setStatus() { /* no-op */ } }; },
          };
        },
      };

      setSentryBackend(customBackend);
      initSentry(makeConfig());
      captureException(new Error('test'));
      addBreadcrumb('msg', 'cat');
      setUser({ id: '1' });
      startTransaction('t', 'o');

      expect(capturedCalls).toEqual(['init', 'capture', 'breadcrumb', 'user', 'transaction']);
    });
  });

  describe('resetSentryBackend', () => {
    it('should reset to default in-memory backend', () => {
      initSentry(makeConfig());
      expect(isSentryInitialized()).toBe(true);
      resetSentryBackend();
      expect(isSentryInitialized()).toBe(false);
    });
  });
});
