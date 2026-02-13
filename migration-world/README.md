# migration-world

도메인에 종속되지 않는 멀티 에이전트 자동화 플랫폼 템플릿.

## 목적
- AI 에이전트 조직 구조를 기반으로 반복 업무를 자동화
- Human-in-the-loop 개입과 품질 게이트를 함께 운영
- 도메인별 정책/용어/파이프라인만 교체해 재사용

## 포함 내용
- Monorepo 뼈대 (`pnpm` + `turbo` + TypeScript)
- 패키지 구조 (`core/agents/collectors/pipelines/publishers/analytics/humanizer/video/web/cli`)
- 문서 구조 (`docs/adr`, `docs/spec`, `docs/runbook`, `docs/guide`)
- 에이전트 조직 체계 (`AGENTS.md`, `.claude/agents/*`)
- 도메인 프로필/역할 팩 (`templates/domain-profiles`, `templates/role-packs`)

## 빠른 시작
```bash
cd migration-world
pnpm install
pnpm run init:domain
pnpm run lint:invariants
```

## 도메인 전환 순서
1. `config/domain.json` 작성 (`config/domain.template.json` 기반)
2. `docs/spec/architecture.md`를 도메인 흐름으로 수정
3. `AGENTS.md`/`.claude/agents/*`를 조직 구조에 맞게 수정
4. `docs/spec/pipeline-specs.md`를 실제 파이프라인으로 정의
5. `packages/*/CLAUDE.md`에 도메인 금지사항/품질 기준 반영
