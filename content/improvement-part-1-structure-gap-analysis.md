# ContentForge 개선/고도화 제안 (Part 1)

## 목적
`CLAUDE.md`와 실제 코드/파일 트리를 함께 보고, **현재 구조에서 가장 먼저 정리해야 할 구조적 갭**을 정리한다.

## 핵심 결론
프로젝트는 모노레포 뼈대와 테스트 습관은 좋은 상태다. 다만 지금 가장 큰 리스크는 기능 미완성이 아니라 **"문서에 적힌 시스템"과 "코드가 실제로 하는 일"의 차이**다.

## 문서-코드 갭 요약

### 1) 채널 명세 불일치 (치명적)
근거:
- `packages/core/src/types.ts`: `x-thread`, `ig-carousel`, `ig-single`, `ig-story`
- `infra/supabase/migrations/001_initial.sql`: `x`, `ig_carousel`, `ig_single`, `ig_story`

영향:
- DB 적재 시 enum 매핑 계층 없으면 런타임 오류/데이터 불일치 발생
- 분석/리포트 집계 축이 분리되어 정확도 저하

개선:
- 단일 canonical 채널 스키마 도입 (`packages/core/config/channels.json`)
- DB enum/TS 타입/퍼블리셔 키를 codegen 또는 validation으로 동기화

### 2) 아키텍처 문서와 구현 상태 간 괴리 (높음)
근거:
- `CLAUDE.md`, `docs/agent-roles.md`: 10 에이전트 구조 설명
- 실제 `packages/agents/src/index.ts`: 7개 에이전트 export
- `docs/pipeline-specs.md`: TextPipeline 출력 채널 5개 설명
- 실제 `packages/pipelines/src/text-pipeline.ts`: `medium`, `linkedin`, `x-thread` 3개

영향:
- 신규 참여자가 잘못된 전제를 갖고 구현 시작
- 유지보수 비용 증가(문서 신뢰도 저하)

개선:
- docs에 `Planned`/`Implemented` 섹션 분리
- CI에서 “구현 상태 스냅샷” 자동 생성(agents/pipelines/channels)

### 3) Result 패턴 원칙과 실제 코드 충돌 (중간~높음)
근거:
- 원칙: `ARCHITECTURE.md`에 business logic throw 지양
- 실제 `packages/core/src/result.ts`의 `unwrap()`은 throw

영향:
- 팀 내 예외 처리 컨벤션 혼선

개선:
- `unwrap()`를 테스트/CLI 전용으로 명시
- 비즈니스 코드에서 `unwrap()` 금지 lint 규칙 추가

### 4) CLI가 패키지 경계 원칙을 우회하는 단일 오케스트레이터 (중간)
근거:
- `packages/cli/package.json`이 여러 패키지를 직접 import
- `packages/cli/src/cli.ts`에서 end-to-end 흐름 직접 구성

영향:
- 실행 경로가 늘어나면 재사용/관측/재시도 정책이 분산됨

개선:
- `packages/orchestrator` 신설
- CLI는 orchestrator 호출만 담당하는 thin adapter로 전환

### 5) 인프라 선언과 런타임 구현 불일치 (중간)
근거:
- 문서/ADR: Redis 기반 큐/락(Bull/Redlock)
- 실제: `InMemoryTaskQueue`, `InMemoryLockManager`

영향:
- 로컬 E2E와 운영 환경 동작 특성이 달라짐

개선:
- InMemory 구현을 `dev-only`로 명확히 분리
- Redis adapter를 같은 인터페이스로 추가하고 환경변수로 선택

### 6) `packages/web`는 설명 대비 스캐폴딩 상태 (중간)
근거:
- `packages/web/src/*`: `.gitkeep` 위주, `index.ts` 설명성 주석만 존재

영향:
- Phase 3 진척 오해 가능

개선:
- 최소 실행 가능한 Editor skeleton(라우팅/스토어/기본 페이지) 우선 구현
- 완료 전까지 문서 상태를 `Scaffold only`로 명시

## 우선순위 정리 (Part 1 범위)
1. 채널 스키마 단일화 (TS/DB/퍼블리셔 동기화)
2. 구현 상태 자동 문서화 (문서 신뢰 회복)
3. orchestrator 계층 도입
4. Redis adapter 이행
5. web 상태 표시 정정

