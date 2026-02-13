# ContentForge Architecture

This is a high-level map of the codebase. It is NOT a comprehensive reference.
Read this first when onboarding. For details, follow the pointers.

## Bird's-Eye View

```
Input (markdown/insight)
  |
  v
[Collectors] --> [Materials DB] --> [Strategist Agent]
                                        |
                                        v
                                 [Pipeline Router]
                           /      |      |      |      \
                        text  thread  snackable  longform  shortform
                          |      |      |          |         |
                          v      v      v          v         v
                      [Writer Agent] (channel-specific transformation)
                          |
                          v
                    [Humanizer Agent] (AI pattern removal)
                          |
                          v
                    [Guardian Agent] (validation + compliance)
                          |
                          v
                    [Publisher Agent] --> 16 channels
                          |
                          v
                    [Analytics] --> BML feedback --> Strategist
```

## Package Boundaries

Each package is independently buildable and testable.
Dependencies flow DOWN this list, never UP.

```
@content-forge/core          # Types, Result<T,E>, Logger. ZERO external deps.
  ^
  |--- @content-forge/collectors   # 3 collectors (RSS, Trends, Bookmark) + scorer + dedup
  |--- @content-forge/pipelines    # 2 pipelines (Text, Snackable) + Claude API module
  |--- @content-forge/publishers   # 11 publishers (all mock APIs for now)
  |--- @content-forge/agents       # 7 agents (Strategist, Writer, Guardian, Collector, Researcher, Publisher, Humanizer)
  |--- @content-forge/analytics    # Metrics collector + Weekly report generator
  |--- @content-forge/humanizer    # (scaffold, logic lives in HumanizerAgent for now)
  |--- @content-forge/cli          # CLI entry point, imports all above
```

## Invariants (mechanically enforced)

These rules are checked by `scripts/lint-invariants.ts`. Breaking them fails CI.

1. **No throw in business logic.** All functions return `Result<T, E>`.
2. **ESM imports use .js extension.** Always `./foo.js`, never `./foo` or `./foo.ts`.
3. **No console.log in source files.** Use `createLogger()` for all output.
4. **No secrets in source.** API keys come from env vars only.
5. **Dependency direction.** Packages import from `core` only. No cross-package imports except through `core`.
6. **Every source file has a test.** New `.ts` in `src/` requires matching `.test.ts` in `__tests__/`.

## Data Flow

```
Material --> RawContent --> ChannelContent --> PublishResult
   |            |               |                  |
   id,url,     material,       channel,           channel,
   title,      pipelineType,   title,             externalUrl,
   content,    targetChannels  body,              externalId,
   score,tags                  metadata           publishedAt
```

## Agent Pattern

All agents follow the template method in `BaseAgent`:

```
run(task) --> acquireLock(task) --> execute(task) --> releaseLock(task)
                                       ^
                                       |
                              Subclass implements this
```

Input/output through `task.input` / `TaskOutput.result` (both `Record<string, unknown>`).

## Publisher Pattern

All publishers follow `BasePublisher`:

```
publish(content) --> validateContent(content) --> withRetry(() => publishToXxx(content))
```

Retry: exponential backoff, 3 attempts max, 429 gets longer backoff.

## Where things live

| What | Where |
|------|-------|
| Shared types | `packages/core/src/types.ts` |
| Result pattern | `packages/core/src/result.ts` |
| Channel limits | `packages/agents/src/guardian-agent.ts` (CHANNEL_LIMITS) |
| Channel specs | `packages/agents/src/writer-agent.ts` (CHANNEL_SPECS) |
| DB schema | `infra/supabase/migrations/001_initial.sql` |
| Docker services | `infra/docker-compose.yml` |
| Design guide | `LookAndFeel/LookAndFeel.md` |
| Implementation plan | `docs/implementation-plan.md` |
| Decisions (ADR) | `docs/decisions.md` |
