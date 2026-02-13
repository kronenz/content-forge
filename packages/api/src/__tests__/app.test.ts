import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';
import { createInMemoryRepositories } from '@content-forge/db/testing';
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

function createTestApp() {
  return createApp({ repos: createInMemoryRepositories(), config: testConfig });
}

const authHeaders = { Authorization: 'Bearer test-api-key' };

describe('app', () => {
  it('should respond to health check without auth', async () => {
    const app = createTestApp();
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.timestamp).toBeDefined();
    expect(body.version).toBe('0.1.0');
  });

  it('should require auth for /api/* routes', async () => {
    const app = createTestApp();
    const res = await app.request('/api/materials');
    expect(res.status).toBe(401);
  });

  it('should allow authenticated access to /api/materials', async () => {
    const app = createTestApp();
    const res = await app.request('/api/materials', { headers: authHeaders });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('should allow authenticated access to /api/contents', async () => {
    const app = createTestApp();
    const res = await app.request('/api/contents', { headers: authHeaders });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('should allow authenticated access to /api/tasks', async () => {
    const app = createTestApp();
    const res = await app.request('/api/tasks', { headers: authHeaders });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('should allow authenticated access to /api/dashboard', async () => {
    const app = createTestApp();
    const res = await app.request('/api/dashboard', { headers: authHeaders });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('should include CORS headers', async () => {
    const app = createTestApp();
    const res = await app.request('/health', {
      headers: { Origin: 'http://localhost:5173' },
    });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
  });

  it('should handle OPTIONS preflight requests', async () => {
    const app = createTestApp();
    const res = await app.request('/api/materials', { method: 'OPTIONS' });
    expect(res.status).toBe(204);
  });
});
