/**
 * Global error handler middleware
 */

import { createMiddleware } from 'hono/factory';
import { createLogger } from '@content-forge/core';
import { apiErr } from '../schemas/response.js';

const logger = createLogger({ agentId: 'api-server' });

export function errorHandler() {
  return createMiddleware(async (c, next) => {
    try {
      return await next();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      logger.error('unhandled_error', { error: message, path: c.req.path });
      return c.json(apiErr(message, 'INTERNAL_ERROR'), 500);
    }
  });
}
