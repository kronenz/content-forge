# ContentForge — Multi-Agent Content Publishing Platform

## WHY
1인 운영자가 전문성·신뢰성·진심이 느껴지는 콘텐츠를 16개 채널에 주기적으로 발행하고,
BML 피드백 루프로 시스템이 자기 진화하는 자동화 플랫폼.

## WHAT
- 8개 소스에서 소재 자동 수집
- 10개 AI 에이전트가 분석 → 변환 → 검증 → 발행 → 분석
- 6개 파이프라인: 텍스트, 스레드, 롱폼 영상, 숏폼, 스낵커블(인스타), 웹툰
- 16개 채널 자동 발행
- Build-Measure-Learn 피드백 루프
- 씬 기반 멀티모달 영상 에디터 (7가지 비주얼 소스 + AI 아바타 프레젠터)

## HOW — 기술 스택
- Runtime: Node.js 20+ / TypeScript 5.x strict mode
- Monorepo: Turborepo + pnpm
- 오케스트레이션: n8n (셀프호스트 Docker)
- AI: Claude API (Sonnet 4), OpenRouter 게이트웨이
- DB: Supabase (PostgreSQL) + Redis (태스크 큐, 락)
- 영상: Remotion (렌더링) + ElevenLabs (TTS)
- 이미지: ComfyUI
- 모니터링: Grafana + Langfuse
- 저장소: S3 호환 (MinIO or Cloudflare R2)

## 프로젝트 구조
LookAndFeel/ — 프론트엔드 디자인 가이드 + 샘플 페이지
packages/core — 공유 타입, 유틸, 설정, Result 패턴
packages/agents — 10개 AI 에이전트 (수집, 전략, 리서처, 라이터, 비주얼, 영상, 휴먼라이크, 가디언, 퍼블리셔, 애널리스트)
packages/collectors — 8개 수집 소스 (trend, rss, voice, bookmark, chat, competitor, community, worklog)
packages/pipelines — 6개 파이프라인 (text, thread, longform, shortform, snackable, webtoon)
packages/publishers — 16개 채널 발행 어댑터
packages/analytics — BML 피드백 루프, Grafana 연동
packages/humanizer — 휴먼라이크 필터 (문체 학습, AI 냄새 제거)
packages/video — Remotion 씬 템플릿, 렌더러, 아바타 클라이언트
packages/web — Vue 3 씬 기반 멀티모달 영상 에디터 (Style L 디자인)
packages/cli — CLI 도구
n8n/ — n8n 워크플로우 JSON
infra/ — Docker Compose, 환경 설정

## 명령어
- pnpm install — 의존성 설치
- pnpm dev — 전체 개발 서버
- pnpm test — 전체 테스트 (Vitest)
- pnpm test --filter=agents — 패키지 단위 테스트
- pnpm build — 프로덕션 빌드
- pnpm lint — ESLint + Prettier

## 코딩 규칙
- 함수형 스타일 우선 (순수 함수, 불변성)
- 모든 함수에 TypeScript 타입 필수
- async/await만 사용 (Promise 체이닝 금지)
- 에러: Result<T, E> 패턴 (throw 최소화)
- 네이밍: camelCase(변수/함수), PascalCase(타입/클래스), UPPER_SNAKE(상수)
- 파일당 하나의 주요 export
- 새 기능 = 테스트 파일 필수

## 에이전트 팀 구조
- 8개 전문 에이전트로 구성된 개발팀 (@AGENTS.md 참조)
- 에이전트 정의: .claude/agents/ 디렉토리
- 패키지 오너십, 협업 패턴, 코드 리뷰 플로우 정의됨
- 새 에이전트 추가 시 AGENTS.md 동기화 필수

## 작업 규칙 (중요)
- 작업 전 반드시 @docs/implementation-plan.md 확인
- 태스크 완료 시 해당 체크박스 [x] 체크
- 새 기술 결정 시 @docs/decisions.md에 ADR 추가
- 상세 참조: @docs/architecture.md, @docs/pipeline-specs.md, @docs/agent-roles.md, @docs/channel-formats.md, @docs/brand-bible.md

## 프론트엔드 디자인
- Design guide: `LookAndFeel/LookAndFeel.md` (Style L: Production Ready)
- Reference impl: `LookAndFeel/preview/src/StyleL_Dashboard.vue`
- Sample pages: `LookAndFeel/SamplePages/`
- Dark-first theme (Slate-950 base), Blue-600 primary, Cyan-500 accent
- App shell: expandable sidebar + sticky top bar + bottom pipeline status bar
- Cards with `ring-1 ring-slate-800/50` (NOT border), `rounded-xl`
- DO NOT use emojis for icons — always use the Lucide icon library
- Vue 3 (Composition API) + Tailwind CSS + lucide-vue-next

## 아키텍처 원칙
- 각 에이전트는 독립 실행 가능
- 에이전트 간 통신은 Redis 큐만 사용
- 락 기반 동시성 제어 (Redis)
- 파이프라인은 플러그인 방식 확장
- 모든 외부 API 호출에 재시도 + 서킷 브레이커
- 수집기·에이전트·파이프라인·퍼블리셔 각각 독립 패키지로 분리

## 코드 품질 원칙
- Result<T, E> 패턴의 `unwrap()`은 테스트/CLI 전용. 비즈니스 로직에서 사용 금지
- 모든 채널 참조는 canonical 형식 사용 (packages/core/config/channels.json 참조)
- 외부 입력(DB, API)의 채널 값은 반드시 `normalizeChannel()`로 정규화
- Claude API 응답은 반드시 Zod 스키마로 검증 (JSON.parse만으로 불충분)

## 향후 아키텍처 개선 (TODO)
- CLI를 thin wrapper로 전환, packages/orchestrator 신설 (실행 로직 집중)
- docs/ 재구조화: adr/ (의사결정), runbook/ (운영 절차), spec/ (제품 스펙), guide/ (온보딩)
- 테스트 구조 분리: __tests__/unit/, __tests__/contract/, tests/integration/
- CI 단계: lint -> typecheck -> unit -> contract -> integration(nightly)

---

## 자기개선 시스템 (Self-Improvement System)

### 세션 시작 프로토콜
1. 이 CLAUDE.md 전체를 읽는다
2. docs/implementation-plan.md에서 현재 진행 상태 확인
3. docs/learnings.md에서 최근 5개 세션 학습 내용 확인
4. docs/review-feedback-log.md에서 최근 PR 피드백 확인
5. .omc/notepad.md에서 마지막 세션 컨텍스트 확인

### 세션 종료 프로토콜
매 작업 세션이 끝날 때 반드시 다음을 수행한다:
1. docs/learnings.md에 세션 일기 추가 (날짜, 작업, 성공, 실패, 개선 방향)
2. 반복된 실수가 있으면 아래 "학습된 금지 사항"에 추가
3. 잘 작동한 패턴이 있으면 아래 "학습된 모범 사례"에 추가
4. docs/implementation-plan.md 체크박스 업데이트

### 커스텀 명령어
- /session-start: 세션 시작 (learnings + 진행 상태 확인)
- /session-end: 세션 종료 (일기 작성 + CLAUDE.md 업데이트)
- /learn [내용]: 학습 내용을 learnings.md + CLAUDE.md에 반영
- /weekly-retro: 주간 회고 (반복 패턴 분석 + CLAUDE.md 정제)
- /phase-status: 현재 Phase 진행률
- /next-task: 다음 미완료 태스크 시작
- /save-progress: 작업 진행 저장

### Skills 참조
- skills/review/: PR 코드 리뷰 체크리스트
- skills/test/: 테스트 전략 및 패턴
- skills/deploy/: 배포 전 검증 절차
- skills/content-pipeline/: 콘텐츠 파이프라인 실행 절차
- skills/humanize/: AI 냄새 제거 체크리스트
- skills/publish/: 16개 채널 발행 전 검증 절차

### 학습된 금지 사항 (자동 누적)
<!-- 아래는 작업 중 발견된 실수 패턴입니다. 절대 반복하지 마세요. -->
- AI 생성 텍스트에 "~적", "~화", "다양한" 같은 AI 스멜 단어 사용 금지
- 수집기에서 rate limit 처리 없이 API 호출하지 말 것
- Claude API 응답을 Zod 검증 없이 JSON.parse만으로 신뢰하지 말 것
- async 인터페이스 구현체에서 async 제거 시 모든 return 경로(Ok, Err, catch)에 Promise.resolve() 감싸기 필수. 하나라도 누락하면 타입 에러 발생. 차라리 async 유지 + `await Promise.resolve()` 한 줄 추가가 더 안전
- .eslintignore는 모노레포에서 패키지별 CWD에서 읽히지 않음. 반드시 .eslintrc.cjs의 ignorePatterns에 설정할 것

### 학습된 모범 사례 (자동 누적)
<!-- 아래는 작업 중 잘 작동한 패턴입니다. 적극 재사용하세요. -->
- 콘텐츠 파이프라인 테스트 시 실제 소재 3개로 E2E 확인
- 새 수집기 추가 시 fixture 데이터 먼저 작성 후 테스트 주도 개발
- 모노레포 ESLint 설정은 .eslintrc.cjs의 ignorePatterns로 통합 관리 (테스트 파일, dist 등)
- lint 에러 대량 수정 시 turbo가 첫 실패에서 멈추므로, 개별 패키지 lint를 병렬 실행하여 전체 에러를 먼저 파악한 후 일괄 수정
- build-fixer 에이전트 병렬 위임 (패키지 그룹별 3개 동시)으로 대량 lint 수정 시간 단축
