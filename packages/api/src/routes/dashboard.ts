/**
 * Dashboard routes — aggregated overview data
 */

import { Hono } from 'hono';
import type { AppDeps } from '../app.js';
import { apiOk, apiErr } from '../schemas/response.js';
import { MetricsService } from '../services/metrics-service.js';

export function createDashboardRoutes(deps: AppDeps): Hono {
  const app = new Hono();
  const metricsService = new MetricsService(deps.repos);

  // GET / — dashboard summary
  app.get('/', async (c) => {
    const result = await metricsService.getDashboardSummary();
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    return c.json(apiOk(result.value));
  });

  return app;
}
