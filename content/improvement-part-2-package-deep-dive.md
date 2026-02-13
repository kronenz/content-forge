# ContentForge 개선/고도화 제안 (Part 2)

## 목적
패키지별로 "지금 코드 기준"에서 실무적으로 바로 적용 가능한 개선안을 정리한다.

## 1) `packages/core`
관찰:
- 타입 모델은 넓게 잘 잡혀 있음 (`types.ts`, `schemas.ts`).
- channel/pipeline 규칙은 타입 수준에 있고 정책 데이터 분리는 미흡.

개선:
- `core/config/channels.json` 도입
- `core/config/pipelines.json` 도입
- `schemas.ts`에서 config 검증 스키마 제공

효과:
- channel 정책 변경을 코드 릴리즈 없이 반영 가능
- `writer/guardian/publisher`의 중복 규칙 제거

## 2) `packages/agents`
관찰:
- BaseAgent/락 템플릿은 명확.
- 다수 agent가 "시뮬레이션" 로직 중심(특히 collector/publisher).
- `task.input as unknown as ...` 패턴이 반복되어 런타임 타입 안정성 약함.

개선:
- 각 에이전트 입력 Zod 스키마 강제
- `src/runtime`, `src/roles`, `src/contracts`, `src/policies`로 구조 분리
- lock/queue interface 추상화: `LockManager`, `TaskQueue`

효과:
- 실환경 전환 시 교체 비용 감소
- 잘못된 task payload 조기 차단

## 3) `packages/collectors`
관찰:
- RSS/Trend/Bookmark 수집기 기본기는 있음.
- scorer/dedup은 유틸 수준, 수집 파이프라인 orchestration 계층이 없음.

개선:
- `CollectorRunner` 추가: collect -> dedup -> score -> persist
- 수집 결과 provenance 필드 추가(collectorName, fetchedAt, rawHash)
- fetch 재시도/타임아웃 공통 wrapper 적용

효과:
- 추후 8개 소스 확장 시 품질 통제 쉬움
- 중복/누락 원인 추적 가능

## 4) `packages/pipelines`
관찰:
- Text/Snackable는 규칙 기반 생성으로 동작.
- Longform/Shortform은 Claude JSON 파싱 후 "기본 검증"만 수행.
- `any` 캐스팅(`Err(... ) as any`)이 존재.

개선:
- Claude 응답은 반드시 `VideoScriptSchema.parse` 통과
- 파이프라인 단계 enum(`script`, `audio`, `visual`, `render`)을 공통화
- `BasePipeline`에 stage telemetry 훅 추가

효과:
- JSON 파싱 성공해도 스키마 불일치로 깨지는 문제 예방
- 디버깅 시 어느 스테이지 실패인지 빠르게 식별

## 5) `packages/publishers`
관찰:
- BasePublisher + 채널별 validate 패턴은 좋음.
- 대부분 mock publish이며, 채널별 로직 중복이 큼.

개선:
- `PublisherSpec` 데이터화 (길이 제한, 포맷, API 모드)
- 공통 `validateBySpec()` 사용
- adapter 계층 분리: `MockAdapter`, `RealAdapter`

효과:
- 16채널 확대 시 중복 코드 급감
- 실 API 전환 시 회귀 위험 감소

## 6) `packages/analytics`
관찰:
- 현재는 mock metrics 생성 중심.
- 주간 리포트 생성기는 구조 양호.

개선:
- `AnalyticsProvider` 인터페이스 도입 (mock / real)
- metric 수집 시 idempotency key(채널+publication+측정주기)
- 레포트에 confidence/coverage 지표 추가

효과:
- 실제 채널 API 연결 시 구조 변경 최소화
- 통계 신뢰도 판단 가능

## 7) `packages/video`
관찰:
- scene 컴포넌트와 sanitize/preview 유틸이 빠르게 확장됨.
- `dangerouslySetInnerHTML` 경로가 많아 sanitize 경계 중요.

개선:
- SVG sanitization policy test 강화(악성 payload 회귀 테스트)
- scene props를 전부 Zod로 사전검증
- 렌더 성능 budget(프레임 드랍 기준) 도입

효과:
- 보안/안정성 회귀 방지
- 생성형 입력(Claude SVG) 품질 안전장치 강화

## 8) `packages/web`
관찰:
- 현재는 실질 구현 없음(스캐폴딩).

개선:
- 최소 3페이지 우선:
  - `ProjectList`
  - `SceneEditor`
  - `RenderStatus`
- 스토어 계약을 `video-contracts` 패키지에서 import

효과:
- video 파이프라인 실사용 검증이 가능해짐
- 타입 드리프트 조기 발견

## 9) `packages/cli`
관찰:
- 실제 데모/수동 실행에 유용.
- console 기반 출력/파일쓰기 중심이며 운영 실행 계층과 분리되지 않음.

개선:
- CLI는 `orchestrator.runJob()`만 호출
- `--dry-run`, `--from-material-id`, `--resume-task` 옵션 추가

효과:
- 운영/수동 실행 경로 통일
- 재처리/복구 작업 단순화

