# Domain Adaptation Guide

이 템플릿은 특정 산업에 고정되지 않는다. 아래 3단계를 먼저 확정한다.

## 1) Domain Contract 확정
- `config/domain.template.json`을 복제해 `config/domain.json` 생성
- 핵심 엔티티 이름을 도메인 용어로 치환
  - 예: material/content/channel -> case/file/endpoint

## 2) Role Pack 선택
- `templates/role-packs/`에서 기본 역할 조합을 선택
- 필요 시 `AGENTS.md`와 `.claude/agents/*`를 조직 구조에 맞게 재배치

## 3) Pipeline/Policy Pack 적용
- `docs/spec/pipeline-specs.md`를 도메인 단계로 재작성
- `docs/spec/agent-roles.md`를 도메인 책임 기준으로 재정의
- `packages/*/CLAUDE.md`에서 도메인 금지사항/품질 게이트를 명시

## Recommended Sequence
1. domain.json
2. architecture.md
3. agent-roles.md
4. pipeline-specs.md
5. package-level CLAUDE.md
