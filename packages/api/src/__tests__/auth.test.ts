import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import type { AppConfig } from '../config.js';

const testConfig: AppConfig = {
  PORT: 3000,
  NODE_ENV: 'test',
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_SERVICE_KEY: 'test',
  CONTENT_FORGE_API_KEY: 'test-api-key',
  LOG_LEVEL: 'error',
  CORS_ORIGIN: 'http://localhost:5173',
};

function createAuthApp() {
  const app = new Hono();
  app.use('*', authMiddleware(testConfig));
  app.get('/protected', (c) => c.json({ ok: true, data: 'secret' }));
  return app;
}

describe('auth middleware', () => {
  it('should return 401 when no Authorization header is provided', async () => {
    const app = createAuthApp();
    const res = await app.request('/protected');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 when Authorization header has no Bearer prefix', async () => {
    const app = createAuthApp();
    const res = await app.request('/protected', {
      headers: { Authorization: 'Basic some-token' },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 403 when API key is invalid', async () => {
    const app = createAuthApp();
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer wrong-key' },
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('should return 200 when API key is valid', async () => {
    const app = createAuthApp();
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer test-api-key' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toBe('secret');
  });

  it('should return 403 when Bearer token is empty', async () => {
    const app = createAuthApp();
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer ' },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });
});
