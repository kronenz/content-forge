---
globs: ["packages/publishers/**/*.ts", "packages/collectors/**/*.ts"]
---
# 외부 API 호출 규칙
- 모든 HTTP 호출에 재시도 로직 (3회, 지수 백오프)
- rate limit 감지 시 429 핸들링
- 타임아웃 30초
- 에러 로깅 (structured JSON)
