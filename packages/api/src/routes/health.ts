/**
 * Health check route (no auth required)
 */

import { Hono } from 'hono';

export function createHealthRoutes(): Hono {
  const app = new Hono();

  app.get('/', (c) =>
    c.json({
      ok: true,
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    }),
  );

  return app;
}
