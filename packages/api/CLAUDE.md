# API Package Rules

## Purpose
HTTP API server for ContentForge using Hono. Serves both n8n workflow automation (POST endpoints) and Vue frontend (GET/PUT endpoints).

## Architecture
- **App factory** (`src/app.ts`): `createApp({ repos, config })` with dependency injection
- **Middleware**: auth (Bearer token), CORS, error handler, request logger
- **Routes**: health, materials, contents, pipelines, publish, metrics, tasks, dashboard
- **Services**: thin bridges between routes and existing package logic
- **Schemas**: Zod validation for requests, `apiOk()`/`apiErr()` response helpers

## Rules
- All responses use `{ ok: true, data }` or `{ ok: false, error: { message, code? } }` format
- Routes access DB only through `Repositories` interface (injected via deps)
- Health endpoint (`GET /health`) requires no authentication
- All `/api/*` routes require `Authorization: Bearer <CONTENT_FORGE_API_KEY>`
- Request validation uses `@hono/zod-validator` with Zod schemas
- Channel inputs must be normalized via `normalizeChannel()` from core
- Use `createLogger()` for structured logging, never `console.log` (except server startup)

## Key Exports
- `createApp(deps)` — Hono app factory
- `loadConfig()` — Zod-validated environment config
- `AppConfig`, `AppDeps` types

## Testing
- Tests use `app.request()` (Hono built-in test helper, no HTTP server needed)
- All tests use `createInMemoryRepositories()` from `@content-forge/db/testing`
- Test config uses static values, no environment dependency

## Route Map
- `GET /health` — health check (no auth)
- `GET/POST /api/materials/*` — material CRUD + collection
- `GET/PUT /api/contents/*` — content CRUD + status updates
- `POST /api/pipelines/*` — pipeline assignment + transformation
- `POST /api/publish` — channel publishing
- `GET/POST /api/metrics/*` — performance metrics
- `GET /api/tasks/*` — task listing
- `GET /api/dashboard` — aggregated dashboard data
