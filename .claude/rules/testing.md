---
globs: ["**/*.test.ts", "**/*.spec.ts"]
---
# Testing Rules
- Framework: Vitest
- Structure: describe > it with clear test names
- Pattern: AAA (Arrange, Act, Assert)
- Mock all external dependencies (Redis, Supabase, Claude API, fetch)
- File naming: [module-name].test.ts
- Every new feature requires a test file
- Test edge cases: empty input, invalid input, boundary values
- No console.log in test files (use vitest spy if needed)
- Test files co-located with source in __tests__/ directory
- Minimum: 4 tests per module (happy path, error case, edge case, boundary)
