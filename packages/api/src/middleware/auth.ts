/**
 * Bearer token authentication middleware
 */

import { createMiddleware } from 'hono/factory';
import type { AppConfig } from '../config.js';
import { apiErr } from '../schemas/response.js';

export function authMiddleware(config: AppConfig) {
  return createMiddleware(async (c, next) => {
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return c.json(apiErr('Missing authorization', 'UNAUTHORIZED'), 401);
    }
    const token = auth.slice(7);
    if (token !== config.CONTENT_FORGE_API_KEY) {
      return c.json(apiErr('Invalid API key', 'FORBIDDEN'), 403);
    }
    return next();
  });
}
