/**
 * CORS middleware
 */

import { cors } from 'hono/cors';
import type { AppConfig } from '../config.js';
import type { MiddlewareHandler } from 'hono';

export function corsMiddleware(config: AppConfig): MiddlewareHandler {
  return cors({
    origin: config.CORS_ORIGIN,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  });
}
