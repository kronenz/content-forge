/**
 * Content routes — CRUD + status updates
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppDeps } from '../app.js';
import { apiOk, apiErr } from '../schemas/response.js';
import {
  PaginationSchema,
  UpdateContentStatusSchema,
  CreateContentSchema,
} from '../schemas/request.js';
import type { ContentStatus, Channel } from '@content-forge/core';

export function createContentRoutes(deps: AppDeps): Hono {
  const app = new Hono();

  // GET / — list with pagination + filters
  app.get('/', async (c) => {
    const query = c.req.query();
    const parsed = PaginationSchema.safeParse(query);
    const pagination = parsed.success ? parsed.data : { limit: 20, offset: 0 };

    const filters: {
      status?: ContentStatus;
      channel?: Channel;
      materialId?: string;
    } = {};
    if (query['status']) filters.status = query['status'] as ContentStatus;
    if (query['channel']) filters.channel = query['channel'] as Channel;
    if (query['materialId']) filters.materialId = query['materialId'];

    const result = await deps.repos.contents.findAll(filters, pagination);
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    return c.json(apiOk(result.value));
  });

  // GET /:id — single content
  app.get('/:id', async (c) => {
    const id = c.req.param('id');
    const result = await deps.repos.contents.findById(id);
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    if (result.value === null) return c.json(apiErr('Content not found', 'NOT_FOUND'), 404);
    return c.json(apiOk(result.value));
  });

  // POST / — create content
  app.post('/', zValidator('json', CreateContentSchema), async (c) => {
    const body = c.req.valid('json');
    const result = await deps.repos.contents.create({
      materialId: body.materialId,
      channel: body.channel,
      format: body.format,
      body: body.body,
      metadata: body.metadata,
      status: 'draft',
    });
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    return c.json(apiOk(result.value), 201);
  });

  // PUT /:id/status — update status
  app.put('/:id/status', zValidator('json', UpdateContentStatusSchema), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const result = await deps.repos.contents.updateStatus(id, body.status);
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    return c.json(apiOk(result.value));
  });

  return app;
}
