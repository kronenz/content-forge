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
  RSS_FEED_URLS: '',
  TREND_GEO: 'KR',
  RAINDROP_API_KEY: '',
  SCORING_KEYWORDS: '',
};

const authHeaders = {
  Authorization: 'Bearer test-api-key',
  'Content-Type': 'application/json',
};

function createTestApp() {
  return createApp({ repos: createInMemoryRepositories(), config: testConfig });
}

const sampleScene = {
  narration: { text: 'Welcome to the video', voiceId: 'voice-1', status: 'draft' },
  visual: {
    source: { type: 'claude-svg', prompt: 'A colorful diagram' },
    status: 'draft',
    versions: [],
  },
  presenter: {
    enabled: false,
    avatarProfileId: '',
    position: 'bottom-right',
    size: 'medium',
    shape: 'circle',
    background: 'transparent',
    gesture: 'talking',
    lipSync: true,
    enterAnimation: 'fade-in',
    status: 'draft',
  },
  overlay: { subtitles: false, watermark: false },
  timing: { durationMs: 5000, transitionIn: 'cut', transitionDurationMs: 300 },
};

describe('video project routes', () => {
  it('should create a video project', async () => {
    const app = createTestApp();
    const res = await app.request('/api/videos', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'My Video', aspectRatio: '16:9' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.title).toBe('My Video');
    expect(body.data.aspectRatio).toBe('16:9');
    expect(body.data.status).toBe('editing');
    expect(body.data.scenes).toEqual([]);
    expect(body.data.id).toBeDefined();
  });

  it('should get a video project by id', async () => {
    const app = createTestApp();
    const createRes = await app.request('/api/videos', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Test Project' }),
    });
    const created = await createRes.json();

    const getRes = await app.request(`/api/videos/${created.data.id}`, {
      headers: authHeaders,
    });
    expect(getRes.status).toBe(200);
    const body = await getRes.json();
    expect(body.ok).toBe(true);
    expect(body.data.id).toBe(created.data.id);
    expect(body.data.title).toBe('Test Project');
  });

  it('should list video projects', async () => {
    const app = createTestApp();
    await app.request('/api/videos', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Project A' }),
    });
    await app.request('/api/videos', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Project B' }),
    });

    const listRes = await app.request('/api/videos', { headers: authHeaders });
    expect(listRes.status).toBe(200);
    const body = await listRes.json();
    expect(body.ok).toBe(true);
    expect(body.data.data.length).toBe(2);
    expect(body.data.total).toBe(2);
  });

  it('should update a video project', async () => {
    const app = createTestApp();
    const createRes = await app.request('/api/videos', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Original' }),
    });
    const created = await createRes.json();

    const updateRes = await app.request(`/api/videos/${created.data.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Updated Title' }),
    });
    expect(updateRes.status).toBe(200);
    const body = await updateRes.json();
    expect(body.ok).toBe(true);
    expect(body.data.title).toBe('Updated Title');
  });

  it('should delete a video project', async () => {
    const app = createTestApp();
    const createRes = await app.request('/api/videos', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'To Delete' }),
    });
    const created = await createRes.json();

    const deleteRes = await app.request(`/api/videos/${created.data.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    expect(deleteRes.status).toBe(200);
    const body = await deleteRes.json();
    expect(body.ok).toBe(true);
    expect(body.data.deleted).toBe(true);

    // Verify gone
    const getRes = await app.request(`/api/videos/${created.data.id}`, {
      headers: authHeaders,
    });
    expect(getRes.status).toBe(404);
  });

  it('should return 404 for non-existent project', async () => {
    const app = createTestApp();
    const res = await app.request('/api/videos/non-existent-id', {
      headers: authHeaders,
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

describe('video scene routes', () => {
  it('should add a scene to a project', async () => {
    const app = createTestApp();
    const createRes = await app.request('/api/videos', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Scene Test' }),
    });
    const created = await createRes.json();

    const addRes = await app.request(`/api/videos/${created.data.id}/scenes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ scene: sampleScene }),
    });
    expect(addRes.status).toBe(201);
    const body = await addRes.json();
    expect(body.ok).toBe(true);
    expect(body.data.scenes.length).toBe(1);
    expect(body.data.scenes[0].narration.text).toBe('Welcome to the video');
    expect(body.data.scenes[0].order).toBe(0);
  });

  it('should update a scene', async () => {
    const app = createTestApp();
    const createRes = await app.request('/api/videos', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Update Scene' }),
    });
    const created = await createRes.json();

    // Add a scene
    const addRes = await app.request(`/api/videos/${created.data.id}/scenes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ scene: sampleScene }),
    });
    const withScene = await addRes.json();
    const sceneId = withScene.data.scenes[0].id;

    // Update it
    const updateRes = await app.request(`/api/videos/${created.data.id}/scenes/${sceneId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        narration: { text: 'Updated narration', voiceId: 'voice-2', status: 'ready' },
      }),
    });
    expect(updateRes.status).toBe(200);
    const body = await updateRes.json();
    expect(body.ok).toBe(true);
    expect(body.data.scenes[0].narration.text).toBe('Updated narration');
  });

  it('should reorder scenes', async () => {
    const app = createTestApp();
    const createRes = await app.request('/api/videos', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Reorder Test' }),
    });
    const created = await createRes.json();

    // Add two scenes
    const add1 = await app.request(`/api/videos/${created.data.id}/scenes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ scene: sampleScene }),
    });
    const s1 = (await add1.json()).data.scenes[0].id;

    const add2 = await app.request(`/api/videos/${created.data.id}/scenes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ scene: { ...sampleScene, narration: { ...sampleScene.narration, text: 'Scene 2' } } }),
    });
    const s2 = (await add2.json()).data.scenes[1].id;

    // Reorder: swap
    const reorderRes = await app.request(`/api/videos/${created.data.id}/scenes/reorder`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ sceneIds: [s2, s1] }),
    });
    expect(reorderRes.status).toBe(200);
    const body = await reorderRes.json();
    expect(body.ok).toBe(true);
    expect(body.data.scenes[0].id).toBe(s2);
    expect(body.data.scenes[0].order).toBe(0);
    expect(body.data.scenes[1].id).toBe(s1);
    expect(body.data.scenes[1].order).toBe(1);
  });

  it('should remove a scene', async () => {
    const app = createTestApp();
    const createRes = await app.request('/api/videos', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Remove Scene' }),
    });
    const created = await createRes.json();

    // Add a scene
    const addRes = await app.request(`/api/videos/${created.data.id}/scenes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ scene: sampleScene }),
    });
    const withScene = await addRes.json();
    const sceneId = withScene.data.scenes[0].id;

    // Remove it
    const removeRes = await app.request(`/api/videos/${created.data.id}/scenes/${sceneId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    expect(removeRes.status).toBe(200);
    const body = await removeRes.json();
    expect(body.ok).toBe(true);
    expect(body.data.scenes.length).toBe(0);
  });
});

describe('video validation', () => {
  it('should reject empty title', async () => {
    const app = createTestApp();
    const res = await app.request('/api/videos', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: '' }),
    });
    expect(res.status).toBe(400);
  });

  it('should reject invalid aspectRatio', async () => {
    const app = createTestApp();
    const res = await app.request('/api/videos', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Test', aspectRatio: '4:3' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('video render routes', () => {
  it('should trigger a render and return jobId', async () => {
    const app = createTestApp();
    const createRes = await app.request('/api/videos', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Render Test' }),
    });
    const created = await createRes.json();

    const renderRes = await app.request(`/api/videos/${created.data.id}/render`, {
      method: 'POST',
      headers: authHeaders,
    });
    expect(renderRes.status).toBe(202);
    const body = await renderRes.json();
    expect(body.ok).toBe(true);
    expect(body.data.jobId).toBeDefined();
  });

  it('should return render status', async () => {
    const app = createTestApp();
    const createRes = await app.request('/api/videos', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Status Test' }),
    });
    const created = await createRes.json();

    const statusRes = await app.request(`/api/videos/${created.data.id}/render/status`, {
      headers: authHeaders,
    });
    expect(statusRes.status).toBe(200);
    const body = await statusRes.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('queued');
    expect(typeof body.data.progress).toBe('number');
  });
});
