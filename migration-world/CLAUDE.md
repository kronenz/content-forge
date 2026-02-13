# Project Template — Domain-Agnostic Multi-Agent Platform

## WHY
소수 인원 또는 1인 운영자가 AI 에이전트 조직을 통해 반복 업무를 자동화하고,
운영 지표를 기반으로 지속 개선하는 플랫폼.

## WHAT
- 소스 수집 -> 전략 라우팅 -> 변환 -> 검증 -> 전달 -> 분석
- 파이프라인 확장 구조
- Human-in-the-loop 개입 지원
- Build-Measure-Learn 루프

## HOW — Stack
- Runtime: Node.js 20+, TypeScript strict
- Monorepo: Turborepo + pnpm
- Queue/Lock: Redis
- DB: PostgreSQL/Supabase
- Monitoring: Grafana/Langfuse (선택)

## Project Structure
- packages/core: 타입/Result/Logger/공통 설정
- packages/agents: 에이전트 실행 계층
- packages/collectors: 데이터 수집 어댑터
- packages/pipelines: 도메인 변환 파이프라인
- packages/publishers: 목적지 전달 어댑터
- packages/analytics: 성과 수집/리포트
- packages/video: 멀티모달 렌더링 (선택)
- packages/web: 운영 UI
- packages/cli: 실행 엔트리
- docs: adr/spec/runbook/guide
- infra: 로컬 인프라

## Work Rules
- 작업 시작 전 `config/domain.json` 및 `docs/spec/architecture.md` 확인
- 기술 의사결정은 `docs/adr/`에 기록
- 업무 완료 후 관련 체크리스트 갱신
- 모듈별 규칙은 각 패키지의 `CLAUDE.md` 우선

## Coding Rules
- Result<T,E> 기반 오류 처리
- 비즈니스 로직에서 throw 최소화
- ESM import는 .js 확장자 사용
- 정책/채널/규정은 코드 상수보다 config 데이터 우선
