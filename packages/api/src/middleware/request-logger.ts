/**
 * Request logging middleware
 */

import { createMiddleware } from 'hono/factory';
import { createLogger } from '@content-forge/core';

const logger = createLogger({ agentId: 'api-server' });

export function requestLogger() {
  return createMiddleware(async (c, next) => {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    logger.info('request', {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration,
    });
  });
}
