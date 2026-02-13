# DB Package Rules

## Purpose
Database repository layer for ContentForge. Provides typed access to Supabase PostgreSQL via the Repository pattern.

## Architecture
- **Repository interfaces** (`src/repositories/interfaces.ts`): contracts for all 5 entities
- **Supabase implementations** (`src/repositories/supabase/`): production DB access via @supabase/supabase-js
- **InMemory implementations** (`src/repositories/in-memory/`): for testing, no DB required
- **Row types** (`src/types.ts`): snake_case DB rows + camelCase domain model converters

## Rules
- All repository methods return `Promise<Result<T, DbError>>` (never throw)
- Channel values must be converted between canonical (`x-thread`) and DB enum (`x`) using mapping functions
- Date fields: DB returns ISO strings, domain model uses Date objects
- Use `createInMemoryRepositories()` from `@content-forge/db/testing` for tests
- Never import Supabase client directly in other packages — use repository interfaces

## Key Exports
- `Repositories`, `MaterialRepository`, `ContentRepository`, etc. (interfaces)
- `createSupabaseRepositories(client)` (production factory)
- `createInMemoryRepositories()` (test factory, from `/testing` subpath)
- `initDbClient(url, key)`, `getDbClient()` (Supabase singleton)
- Row types and conversion functions

## Testing
- Tests use InMemory implementations (no DB dependency)
- Each repository has its own test file verifying interface contract
- `mapping.test.ts` verifies snake_case/camelCase and channel conversions
