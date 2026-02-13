/**
 * Video project routes — CRUD for projects, scenes, and render trigger
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppDeps } from '../app.js';
import { apiOk, apiErr } from '../schemas/response.js';
import {
  PaginationSchema,
  CreateVideoProjectSchema,
  UpdateVideoProjectSchema,
  AddSceneSchema,
  UpdateSceneSchema,
  ReorderScenesSchema,
} from '../schemas/request.js';
import { VideoProjectService } from '../services/video-project-service.js';
import type { ProjectStatus, VideoProject, EditableScene } from '@content-forge/core';

export function createVideoRoutes(deps: AppDeps): Hono {
  const app = new Hono();
  const service = new VideoProjectService(deps.repos);

  // GET / — list projects with pagination + filters
  app.get('/', async (c) => {
    const query = c.req.query();
    const parsed = PaginationSchema.safeParse(query);
    const pagination = parsed.success ? parsed.data : { limit: 20, offset: 0 };

    const filters: { status?: ProjectStatus } = {};
    if (query['status']) filters.status = query['status'] as ProjectStatus;

    const result = await service.listProjects(filters, pagination);
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    return c.json(apiOk(result.value));
  });

  // GET /:id — single project
  app.get('/:id', async (c) => {
    const id = c.req.param('id');
    const result = await service.getProject(id);
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    if (result.value === null) return c.json(apiErr('Video project not found', 'NOT_FOUND'), 404);
    return c.json(apiOk(result.value));
  });

  // POST / — create project
  app.post('/', zValidator('json', CreateVideoProjectSchema), async (c) => {
    const body = c.req.valid('json');
    const result = await service.createProject({
      title: body.title,
      aspectRatio: body.aspectRatio,
      materialId: body.materialId,
    });
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    return c.json(apiOk(result.value), 201);
  });

  // PUT /:id — update project
  app.put('/:id', zValidator('json', UpdateVideoProjectSchema), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const updateData: Partial<Omit<VideoProject, 'id' | 'createdAt'>> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.globalStyle !== undefined) {
      const gs: VideoProject['globalStyle'] = {
        colorScheme: body.globalStyle.colorScheme,
        fontFamily: body.globalStyle.fontFamily,
      };
      if (body.globalStyle.musicTrackUrl !== undefined) {
        gs.musicTrackUrl = body.globalStyle.musicTrackUrl;
      }
      updateData.globalStyle = gs;
    }
    if (body.status !== undefined) updateData.status = body.status;
    const result = await service.updateProject(id, updateData);
    if (!result.ok) {
      if (result.error.code === 'NOT_FOUND') return c.json(apiErr(result.error.message, 'NOT_FOUND'), 404);
      return c.json(apiErr(result.error.message, result.error.code), 500);
    }
    return c.json(apiOk(result.value));
  });

  // DELETE /:id — delete project
  app.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const result = await service.deleteProject(id);
    if (!result.ok) {
      if (result.error.code === 'NOT_FOUND') return c.json(apiErr(result.error.message, 'NOT_FOUND'), 404);
      return c.json(apiErr(result.error.message, result.error.code), 500);
    }
    return c.json(apiOk({ deleted: true }));
  });

  // POST /:id/scenes — add scene
  app.post('/:id/scenes', zValidator('json', AddSceneSchema), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const sceneData = body.scene as unknown as Omit<EditableScene, 'id' | 'order'>;
    const result = await service.addScene(id, sceneData, body.afterSceneId);
    if (!result.ok) {
      if (result.error.code === 'NOT_FOUND') return c.json(apiErr(result.error.message, 'NOT_FOUND'), 404);
      return c.json(apiErr(result.error.message, result.error.code), 500);
    }
    return c.json(apiOk(result.value), 201);
  });

  // PUT /:id/scenes/reorder — reorder scenes (before /:id/scenes/:sceneId to avoid route conflict)
  app.put('/:id/scenes/reorder', zValidator('json', ReorderScenesSchema), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const result = await service.reorderScenes(id, body.sceneIds);
    if (!result.ok) {
      if (result.error.code === 'NOT_FOUND') return c.json(apiErr(result.error.message, 'NOT_FOUND'), 404);
      if (result.error.code === 'INVALID_INPUT') return c.json(apiErr(result.error.message, 'INVALID_INPUT'), 400);
      return c.json(apiErr(result.error.message, result.error.code), 500);
    }
    return c.json(apiOk(result.value));
  });

  // PUT /:id/scenes/:sceneId — update scene
  app.put('/:id/scenes/:sceneId', zValidator('json', UpdateSceneSchema), async (c) => {
    const id = c.req.param('id');
    const sceneId = c.req.param('sceneId');
    const body = c.req.valid('json');
    const result = await service.updateScene(id, sceneId, body);
    if (!result.ok) {
      if (result.error.code === 'NOT_FOUND') return c.json(apiErr(result.error.message, 'NOT_FOUND'), 404);
      return c.json(apiErr(result.error.message, result.error.code), 500);
    }
    return c.json(apiOk(result.value));
  });

  // DELETE /:id/scenes/:sceneId — remove scene
  app.delete('/:id/scenes/:sceneId', async (c) => {
    const id = c.req.param('id');
    const sceneId = c.req.param('sceneId');
    const result = await service.removeScene(id, sceneId);
    if (!result.ok) {
      if (result.error.code === 'NOT_FOUND') return c.json(apiErr(result.error.message, 'NOT_FOUND'), 404);
      return c.json(apiErr(result.error.message, result.error.code), 500);
    }
    return c.json(apiOk(result.value));
  });

  // POST /:id/render — trigger render (stub)
  app.post('/:id/render', async (c) => {
    const id = c.req.param('id');
    const result = await service.triggerRender(id);
    if (!result.ok) {
      if (result.error.code === 'NOT_FOUND') return c.json(apiErr(result.error.message, 'NOT_FOUND'), 404);
      return c.json(apiErr(result.error.message, result.error.code), 500);
    }
    return c.json(apiOk(result.value), 202);
  });

  // GET /:id/render/status — render status (stub)
  app.get('/:id/render/status', async (c) => {
    const id = c.req.param('id');
    const jobId = c.req.query('jobId') ?? '';
    const result = await service.getRenderStatus(id, jobId);
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    return c.json(apiOk(result.value));
  });

  return app;
}
