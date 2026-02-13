/**
 * Server entry point — starts the Hono HTTP server
 */

import { serve } from '@hono/node-server';
import { loadConfig } from './config.js';
import { createApp } from './app.js';
import { createInMemoryRepositories } from '@content-forge/db/testing';

const config = loadConfig();
const repos = createInMemoryRepositories();
const app = createApp({ repos, config });

serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  console.log(`ContentForge API running on http://localhost:${info.port}`);
});
