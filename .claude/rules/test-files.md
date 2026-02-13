---
globs: ["**/*.test.ts", "**/*.spec.ts"]
---
# 테스트 규칙
- Vitest 사용
- describe > it 구조
- AAA 패턴 (Arrange, Act, Assert)
- 외부 의존성은 모두 mock (Redis, Supabase, Claude API)
- 테스트 파일명: [module-name].test.ts
