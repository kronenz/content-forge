# ContentForge 개선/고도화 제안 (Part 4)

## 목적
Part 1~3의 우선 과제를 바로 실행할 수 있도록, 실제 생성 가능한 GitHub Issue 템플릿 형태로 분해한다.

## Issue 1: Channel Schema Unification
### Title
`[Core] Unify channel schema across TS types, DB enum, and publishers`

### Background
현재 채널 키가 TS(`x-thread`, `ig-carousel`)와 SQL(`x`, `ig_carousel`)에서 불일치한다.

### Scope
- canonical 채널 스펙 정의 파일 추가
- TS 타입, DB enum, publisher mapping 정렬
- legacy alias 매핑(임시)

### Tasks
- [ ] `packages/core/config/channels.json` 생성
- [ ] 채널 스키마 Zod 검증 추가
- [ ] DB enum 매핑 표 문서화
- [ ] publisher 키 매핑 통합
- [ ] 호환 레이어(legacy alias) 추가

### Acceptance Criteria
- [ ] 채널 불일치 관련 테스트 모두 통과
- [ ] `x-thread`/`x`, `ig-carousel`/`ig_carousel` 충돌 없음
- [ ] 문서에 canonical 스키마 반영

### Risks
- 기존 테스트 다수 수정 필요

### Labels
`area:core`, `area:db`, `priority:P0`, `type:refactor`

---

## Issue 2: Status Doc Autogen
### Title
`[Docs/CI] Auto-generate implementation status snapshot`

### Background
문서의 계획 상태와 실제 구현 상태가 쉽게 어긋난다.

### Scope
- 구현 상태 자동 수집 스크립트 작성
- CI에서 문서 최신성 검증

### Tasks
- [ ] `scripts/generate-status-doc.ts` 추가
- [ ] `docs/implementation-status.md` 생성 자동화
- [ ] CI에 문서 드리프트 체크 추가

### Acceptance Criteria
- [ ] agents/pipelines/publishers 구현 목록 자동 반영
- [ ] 문서 미갱신 시 CI 실패

### Labels
`area:docs`, `area:ci`, `priority:P0`, `type:automation`

---

## Issue 3: Orchestrator Bootstrap
### Title
`[Architecture] Introduce orchestrator package and thin CLI wrapper`

### Background
현재 CLI가 여러 패키지를 직접 조립해 운영 실행 경로와 분리되어 있다.

### Scope
- orchestrator 패키지 생성
- CLI는 orchestrator 호출 전용으로 축소

### Tasks
- [ ] `packages/orchestrator` 생성
- [ ] `runJob()` 엔트리 설계
- [ ] CLI 옵션 -> orchestrator 파라미터 매핑

### Acceptance Criteria
- [ ] 동일 잡이 CLI/worker에서 같은 엔진 사용
- [ ] CLI 비즈니스 로직 80% 이상 축소

### Labels
`area:architecture`, `area:cli`, `priority:P1`, `type:refactor`

---

## Issue 4: Redis Adapter for Lock/Queue
### Title
`[Agents] Add Redis-backed lock manager and task queue adapters`

### Background
문서상 Redis 기반인데 구현은 in-memory 중심이다.

### Scope
- 인터페이스 추상화
- Redis 구현 추가
- env 기반 구현 선택

### Tasks
- [ ] `LockManager`, `TaskQueue` interface 정의
- [ ] `RedisLockManager`, `RedisTaskQueue` 구현
- [ ] dev/prod profile 분리

### Acceptance Criteria
- [ ] in-memory/redis 계약 테스트 공통 통과
- [ ] 동시 실행 시 락 충돌 방지 검증

### Labels
`area:agents`, `area:infra`, `priority:P1`, `type:feature`

---

## Issue 5: Video Script Hard Validation
### Title
`[Pipelines] Enforce strict schema validation for Claude video script output`

### Background
현재 JSON 파싱 중심이라 스키마 미스매치가 런타임에서 늦게 발견된다.

### Scope
- `VideoScriptSchema` 강제
- parse 에러 분기 표준화

### Tasks
- [ ] Longform/Shortform에 스키마 검증 강제
- [ ] invalid payload 테스트 추가
- [ ] 오류 코드/로그 포맷 정리

### Acceptance Criteria
- [ ] malformed JSON/invalid schema 모두 deterministic failure
- [ ] stage별 오류 원인 추적 가능

### Labels
`area:pipelines`, `priority:P1`, `type:hardening`

