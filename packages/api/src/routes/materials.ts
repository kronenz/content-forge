/**
 * Material routes — CRUD + collect/score triggers
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppDeps } from '../app.js';
import { apiOk, apiErr } from '../schemas/response.js';
import {
  PaginationSchema,
  CollectMaterialsSchema,
  ScoreMaterialsSchema,
  CreateMaterialSchema,
} from '../schemas/request.js';
import { MaterialService } from '../services/material-service.js';
import type { MaterialStatus } from '@content-forge/core';

export function createMaterialRoutes(deps: AppDeps): Hono {
  const app = new Hono();
  const service = new MaterialService(deps.repos, deps.config);

  // GET / — list with pagination + filters
  app.get('/', async (c) => {
    const query = c.req.query();
    const parsed = PaginationSchema.safeParse(query);
    const pagination = parsed.success ? parsed.data : { limit: 20, offset: 0 };

    const filters: {
      status?: MaterialStatus;
      source?: string;
      minScore?: number;
    } = {};
    if (query['status']) filters.status = query['status'] as MaterialStatus;
    if (query['source']) filters.source = query['source'];
    if (query['minScore']) filters.minScore = Number(query['minScore']);

    const result = await deps.repos.materials.findAll(filters, pagination);
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    return c.json(apiOk(result.value));
  });

  // GET /:id — single material
  app.get('/:id', async (c) => {
    const id = c.req.param('id');
    const result = await deps.repos.materials.findById(id);
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    if (result.value === null) return c.json(apiErr('Material not found', 'NOT_FOUND'), 404);
    return c.json(apiOk(result.value));
  });

  // POST / — create a material
  app.post('/', zValidator('json', CreateMaterialSchema), async (c) => {
    const body = c.req.valid('json');
    const result = await deps.repos.materials.create({
      source: body.source,
      url: body.url,
      title: body.title,
      content: body.content,
      score: body.score,
      tags: body.tags,
      status: 'new',
      collectedAt: new Date(),
    });
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    return c.json(apiOk(result.value), 201);
  });

  // POST /collect — trigger collection
  app.post('/collect', zValidator('json', CollectMaterialsSchema), async (c) => {
    const body = c.req.valid('json');
    const result = await service.collectMaterials(body.sources);
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    return c.json(apiOk(result.value));
  });

  // POST /score — trigger scoring
  app.post('/score', zValidator('json', ScoreMaterialsSchema), async (c) => {
    const body = c.req.valid('json');
    const result = await service.scoreMaterials(body.materialIds);
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    return c.json(apiOk(result.value));
  });

  return app;
}
