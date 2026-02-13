/**
 * Pipeline routes — assign and transform
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppDeps } from '../app.js';
import { apiOk, apiErr } from '../schemas/response.js';
import { AssignPipelineSchema, TransformSchema } from '../schemas/request.js';
import { PipelineService } from '../services/pipeline-service.js';

export function createPipelineRoutes(deps: AppDeps): Hono {
  const app = new Hono();
  const service = new PipelineService(deps.repos);

  // POST /assign — assign material to pipeline
  app.post('/assign', zValidator('json', AssignPipelineSchema), async (c) => {
    const body = c.req.valid('json');
    const result = await service.assignPipeline(body.materialId, body.pipelineType);
    if (!result.ok) {
      const status = result.error.code === 'NOT_FOUND' ? 404 : 500;
      return c.json(apiErr(result.error.message, result.error.code), status);
    }
    return c.json(apiOk(result.value));
  });

  // POST /transform — transform material to channels
  app.post('/transform', zValidator('json', TransformSchema), async (c) => {
    const body = c.req.valid('json');
    const result = await service.transform(body.materialId, body.channels);
    if (!result.ok) return c.json(apiErr(result.error.message, result.error.code), 500);
    return c.json(apiOk(result.value));
  });

  return app;
}
