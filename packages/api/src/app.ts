/**
 * Hono app factory — creates the application with injected dependencies
 */

import { Hono } from 'hono';
import type { Repositories } from '@content-forge/db';
import type { AppConfig } from './config.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { corsMiddleware } from './middleware/cors.js';
import { authMiddleware } from './middleware/auth.js';
import { createHealthRoutes } from './routes/health.js';
import { createMaterialRoutes } from './routes/materials.js';
import { createContentRoutes } from './routes/contents.js';
import { createPipelineRoutes } from './routes/pipelines.js';
import { createPublishRoutes } from './routes/publish.js';
import { createMetricRoutes } from './routes/metrics.js';
import { createTaskRoutes } from './routes/tasks.js';
import { createDashboardRoutes } from './routes/dashboard.js';
import { createVideoRoutes } from './routes/videos.js';

export interface AppDeps {
  repos: Repositories;
  config: AppConfig;
}

export function createApp(deps: AppDeps): Hono {
  const app = new Hono();

  // Global middleware
  app.use('*', errorHandler());
  app.use('*', requestLogger());
  app.use('*', corsMiddleware(deps.config));

  // Health check (no auth)
  app.route('/health', createHealthRoutes());

  // Protected API routes
  app.use('/api/*', authMiddleware(deps.config));
  app.route('/api/materials', createMaterialRoutes(deps));
  app.route('/api/contents', createContentRoutes(deps));
  app.route('/api/pipelines', createPipelineRoutes(deps));
  app.route('/api/publish', createPublishRoutes(deps));
  app.route('/api/metrics', createMetricRoutes(deps));
  app.route('/api/tasks', createTaskRoutes(deps));
  app.route('/api/dashboard', createDashboardRoutes(deps));
  app.route('/api/videos', createVideoRoutes(deps));

  return app;
}
