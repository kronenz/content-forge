---
globs: ["**/*"]
---
# Git Workflow Rules
- Commit message format: type(scope): description
  - Types: feat, fix, refactor, test, docs, chore, ci
  - Scope: package name (core, agents, publishers, pipelines, collectors, analytics, cli)
  - Example: feat(agents): add HumanizerAgent with AI pattern detection
- Never commit console.log, debugger, or TODO/HACK comments
- Never commit .env files or files containing secrets
- Never commit node_modules/, dist/, or build artifacts
- One logical change per commit
- Run build + test before committing
