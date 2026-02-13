/**
 * Zod-validated environment configuration for the API server
 */

import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url().default('http://localhost:54321'),
  SUPABASE_SERVICE_KEY: z.string().min(1).default('test-key'),
  CONTENT_FORGE_API_KEY: z.string().min(1).default('test-api-key'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Collector settings
  RSS_FEED_URLS: z.string().default(''),
  TREND_GEO: z.string().default('KR'),
  RAINDROP_API_KEY: z.string().default(''),
  SCORING_KEYWORDS: z.string().default(''),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(): AppConfig {
  return envSchema.parse(process.env);
}
