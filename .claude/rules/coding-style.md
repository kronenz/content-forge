---
globs: ["packages/**/*.ts"]
---
# Coding Style Rules
- TypeScript strict mode always enabled
- ESM only: use .js extensions in all imports
- Prefer immutable data: use readonly, const, spread over mutation
- One primary export per file
- Result<T, E> pattern for error handling (no throw except truly exceptional cases)
- Structured JSON logging via createLogger() - never console.log
- camelCase for variables/functions, PascalCase for types/classes, UPPER_SNAKE for constants
- async/await only (no Promise chaining or callbacks)
- Explicit return types on public methods
- No unused imports or variables (TypeScript strict catches these)
