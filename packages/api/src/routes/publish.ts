/**
 * Publish routes — trigger content publishing
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppDeps } from '../app.js';
import { apiOk, apiErr } from '../schemas/response.js';
import { PublishSchema } from '../schemas/request.js';
import { PublishService } from '../services/publish-service.js';

export function createPublishRoutes(deps: AppDeps): Hono {
  const app = new Hono();
  const service = new PublishService(deps.repos);

  // POST / — publish content to channels
  app.post('/', zValidator('json', PublishSchema), async (c) => {
    const body = c.req.valid('json');
    const result = await service.publish(body.contentId, body.channels);
    if (!result.ok) {
      const status = result.error.code === 'NOT_FOUND' ? 404 : 500;
      return c.json(apiErr(result.error.message, result.error.code), status);
    }
    return c.json(apiOk(result.value));
  });

  return app;
}
