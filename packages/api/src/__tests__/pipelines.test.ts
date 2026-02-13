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

const authHeaders = {
  Authorization: 'Bearer test-api-key',
  'Content-Type': 'application/json',
};

function createTestApp() {
  return createApp({ repos: createInMemoryRepositories(), config: testConfig });
}

describe('pipeline routes', () => {
  it('should assign a pipeline to an existing material', async () => {
    const app = createTestApp();

    // First create a material
    const createRes = await app.request('/api/materials', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        source: 'rss',
        url: 'https://example.com/article',
        title: 'Pipeline Test',
        content: 'Content for pipeline testing.',
        score: 8,
        tags: ['tech'],
      }),
    });
    const created = await createRes.json();
    const materialId = created.data.id;

    // Assign pipeline
    const res = await app.request('/api/pipelines/assign', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        materialId,
        pipelineType: 'text',
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.materialId).toBe(materialId);
    expect(body.data.pipelineType).toBe('text');
    expect(body.data.assigned).toBe(true);
  });

  it('should return 404 when assigning pipeline to non-existent material', async () => {
    const app = createTestApp();
    const res = await app.request('/api/pipelines/assign', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        materialId: 'non-existent',
        pipelineType: 'text',
      }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should transform material to channels (stub)', async () => {
    const app = createTestApp();
    const res = await app.request('/api/pipelines/transform', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        materialId: 'some-material',
        channels: ['medium', 'linkedin'],
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.materialId).toBe('some-material');
    expect(body.data.channels).toEqual(['medium', 'linkedin']);
    expect(body.data.contentIds).toEqual([]);
  });

  it('should reject invalid pipeline type', async () => {
    const app = createTestApp();
    const res = await app.request('/api/pipelines/assign', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        materialId: 'some-id',
        pipelineType: 'invalid-type',
      }),
    });
    expect(res.status).toBe(400);
  });

  it('should reject missing required fields', async () => {
    const app = createTestApp();
    const res = await app.request('/api/pipelines/assign', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it('should reject empty channels array in transform', async () => {
    const app = createTestApp();
    const res = await app.request('/api/pipelines/transform', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        materialId: 'some-material',
        channels: [],
      }),
    });
    expect(res.status).toBe(400);
  });
});
