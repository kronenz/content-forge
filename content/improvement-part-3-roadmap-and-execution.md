# ContentForge 개선/고도화 제안 (Part 3)

## 목적
앞선 개선안을 실제로 적용할 때, 리스크를 낮추고 속도를 유지하는 실행 순서를 제시한다.

## 제안 로드맵 (6주)

## Week 1-2: 정합성 복구
목표: 문서/코드/DB 스키마를 맞춘다.

작업:
- 채널 canonical spec 도입 (`core/config/channels.json`)
- TS 타입 + SQL enum + publisher 키 매핑 통합
- `docs/*`에 `Implemented vs Planned` 섹션 추가
- `scripts/generate-status-doc.ts`로 상태 문서 자동 생성

완료 기준(DoD):
- 채널 명세 불일치 0건
- CI에서 상태 문서 자동 업데이트 검증 통과

## Week 3-4: 실행 계층 분리
목표: CLI와 운영 오케스트레이션 경계를 분리한다.

작업:
- `packages/orchestrator` 생성
- `agents`의 queue/lock interface 추상화
- Redis adapter 추가 (in-memory는 dev profile로 유지)
- task payload Zod 검증 도입

완료 기준(DoD):
- 동일 job을 CLI/worker에서 동일 엔진으로 실행
- lock/queue 구현 교체 테스트 통과

## Week 5: 파이프라인/퍼블리셔 안정화
목표: 생성형 출력 검증과 채널 정책을 데이터화한다.

작업:
- Claude 응답 스키마 강제 (`VideoScriptSchema`)
- `PublisherSpec` 기반 공통 validator
- 파이프라인 stage telemetry 추가

완료 기준(DoD):
- invalid JSON/스키마 에러 재현 테스트 추가
- publisher 중복 검증 코드 50% 이상 축소

## Week 6: 비디오-웹 계약 고정
목표: Phase 3 리스크(계약 붕괴)를 미리 제거한다.

작업:
- `packages/video-contracts` 신설
- web 최소 에디터 스켈레톤 구현
- video scene props 계약 테스트

완료 기준(DoD):
- web/video 간 타입 공유 사용률 100%
- 샘플 프로젝트 1개 end-to-end preview 성공

## 운영 품질 가드레일
- CI Stage:
  - `lint:invariants`
  - `typecheck`
  - `unit`
  - `contract`
  - `integration` (nightly)
- 릴리즈 가드:
  - channel spec 변경 시 DB migration 동반 여부 검사
  - docs 상태 문서 미반영 시 merge 차단

## 우선 실행할 5개 티켓
1. `channel-schema-unification`
2. `status-doc-autogen`
3. `orchestrator-bootstrap`
4. `redis-adapter-for-lock-queue`
5. `video-script-schema-hard-validation`

## 리스크와 완화
- 리스크: spec 통합 시 기존 테스트 대량 수정
- 완화: `legacyAlias` 필드로 1~2주 병행 지원

- 리스크: Redis adapter 전환 중 동시성 버그
- 완화: lock contract test suite를 구현별 공통 실행

- 리스크: web 선구현 부족으로 Phase 3 지연
- 완화: 편집기 핵심 3페이지만 먼저, 나머지는 feature flag

