/**
 * Task routes — agent task management
 */

import { Hono } from 'hono';
import type { AppDeps } from '../app.js';
import { apiOk, apiErr } from '../schemas/response.js';
import { PaginationSchema } from '../schemas/request.js';
import type { TaskStatus } from '@content-forge/core';

export function createTaskRoutes(deps: AppDeps): Hono {
  const app = new Hono();

  // GET / — list tasks with pagination + filters
  app.get('/', async (c) => {
    const query = c.req.query();
    const parsed = PaginationSchema.safeParse(query);
    const pagination = parsed.success ? parsed.data : { limit: 20, offset: 0 };

    const filters: {
      status?: TaskStatus;
      type?: string;
      agentId?: string;
    } = {};
    if (query['status']) filters.status = query['status'] as TaskStatus;
    if (query['type']) filters.type = query['type'];
    if (query['agentId']) filters.agentId = query['agentId'];

    const result = await deps.repos.tasks.findAll(filters, pagination);
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    return c.json(apiOk(result.value));
  });

  // GET /:id — single task
  app.get('/:id', async (c) => {
    const id = c.req.param('id');
    const result = await deps.repos.tasks.findById(id);
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    if (result.value === null) return c.json(apiErr('Task not found', 'NOT_FOUND'), 404);
    return c.json(apiOk(result.value));
  });

  return app;
}
