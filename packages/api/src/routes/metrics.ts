/**
 * Metrics routes — performance data
 */

import { Hono } from 'hono';
import type { AppDeps } from '../app.js';
import { apiOk, apiErr } from '../schemas/response.js';
import { PaginationSchema } from '../schemas/request.js';
import type { Channel } from '@content-forge/core';

export function createMetricRoutes(deps: AppDeps): Hono {
  const app = new Hono();

  // GET / — list metrics with pagination
  app.get('/', async (c) => {
    const query = c.req.query();
    const parsed = PaginationSchema.safeParse(query);
    const pagination = parsed.success ? parsed.data : { limit: 20, offset: 0 };

    const filters: { publicationId?: string } = {};
    if (query['publicationId']) filters.publicationId = query['publicationId'];

    const result = await deps.repos.metrics.findAll(filters, pagination);
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    return c.json(apiOk(result.value));
  });

  // GET /summary/:publicationId — aggregated metrics for a publication
  app.get('/summary/:publicationId', async (c) => {
    const publicationId = c.req.param('publicationId');
    const result = await deps.repos.metrics.getSummary(publicationId);
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    if (result.value === null) return c.json(apiErr('No metrics found', 'NOT_FOUND'), 404);
    return c.json(apiOk(result.value));
  });

  // GET /publications — list publications with filters
  app.get('/publications', async (c) => {
    const query = c.req.query();
    const parsed = PaginationSchema.safeParse(query);
    const pagination = parsed.success ? parsed.data : { limit: 20, offset: 0 };

    const filters: { channel?: Channel; contentId?: string } = {};
    if (query['channel']) filters.channel = query['channel'] as Channel;
    if (query['contentId']) filters.contentId = query['contentId'];

    const result = await deps.repos.publications.findAll(filters, pagination);
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    return c.json(apiOk(result.value));
  });

  return app;
}
