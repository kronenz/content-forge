# Oh My ClaudeCode로 ContentForge를 만드는 완전 가이드

---

## 전체 구조: OMC에서 무엇이 달라지는가

바닐라 Claude Code에서는 모든 오케스트레이션을 직접 설계해야 했습니다. OMC를 쓰면 그 부분은 OMC가 처리하고, 우리는 "프로젝트의 두뇌"만 잘 설계하면 됩니다.

```
┌──────────────────────────────────────────────────────────────────────┐
│                         우리가 직접 만드는 것                         │
│                                                                      │
│  CLAUDE.md (프로젝트 헌법)                                           │
│  docs/ (장기 기억 — 아키텍처, 구현 계획, 기술 결정)                    │
│  .omc/notepad.md (세션 내 단기 기억 — OMC 3-tier)                    │
│  하위 CLAUDE.md (모듈별 규칙)                                        │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                         OMC가 처리하는 것                             │
│                                                                      │
│  32개 전문 에이전트 자동 배정 (architect, executor, qa-tester 등)      │
│  스마트 모델 라우팅 (Opus/Sonnet/Haiku 자동 선택)                     │
│  병렬 실행 (Ultrawork — 최대 5 워커)                                 │
│  완료 보장 (Ralph — 끝날 때까지 멈추지 않음)                          │
│  Compaction에서도 살아남는 Notepad 메모리                             │
│  자동 스킬 활성화 (28개 스킬)                                        │
│  HUD 상태 표시                                                       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## STEP 0: OMC 설치 & 셋업

```bash
# 1. Claude Code에서 플러그인 설치
/plugin marketplace add https://github.com/Yeachan-Heo/oh-my-claudecode
/plugin install oh-my-claudecode

# 2. 셋업 실행 (CLAUDE.md에 OMC 오케스트레이션 프롬프트 자동 생성)
/oh-my-claudecode:omc-setup

# 3. VM 메모리 확인 (멀티에이전트는 32GB+ 권장)
free -h
```

omc-setup을 실행하면 `~/.claude/CLAUDE.md`(글로벌)와 `.claude/CLAUDE.md`(프로젝트)에 OMC 오케스트레이션 프롬프트가 자동 생성됩니다. 여기에 ContentForge의 프로젝트 컨텍스트를 추가합니다.

---

## STEP 1: 프로젝트 디렉토리 & 파일 구조

```
content-forge/
│
├── CLAUDE.md                              ← 루트 헌법 (아래 내용 직접 작성)
├── CLAUDE.local.md                        ← 개인 설정 (gitignore)
│
├── .claude/
│   ├── CLAUDE.md                          ← OMC가 생성한 오케스트레이션 프롬프트
│   ├── settings.json                      ← Hooks, 권한
│   ├── commands/                          ← 커스텀 슬래시 명령어
│   │   ├── phase-status.md
│   │   ├── save-progress.md
│   │   └── next-task.md
│   ├── agents/                            ← OMC 기본 에이전트 (자동 생성됨)
│   └── rules/                             ← 파일 패턴별 규칙
│       ├── api-routes.md
│       └── test-files.md
│
├── .omc/
│   └── notepad.md                         ← OMC 3-tier 메모리 (자동 관리)
│
├── docs/                                  ← 장기 기억 (직접 관리)
│   ├── architecture.md                    ← 전체 아키텍처 (필요시 @참조)
│   ├── implementation-plan.md             ← Phase별 체크박스 진행 추적
│   ├── agent-roles.md                     ← 10개 ContentForge 에이전트 정의
│   ├── pipeline-specs.md                  ← 6개 파이프라인 상세 스펙
│   ├── channel-formats.md                 ← 16개 채널별 포맷/톤/API
│   ├── brand-bible.md                     ← 브랜드 바이블 (톤, 금기어, 페르소나)
│   └── decisions.md                       ← 기술 결정 기록 (ADR)
│
├── packages/
│   ├── core/                              ← 공유 타입, 유틸, 설정
│   │   └── CLAUDE.md                      ← 코어 모듈 규칙
│   ├── agents/                            ← 10개 ContentForge AI 에이전트
│   │   └── CLAUDE.md                      ← 에이전트 모듈 규칙
│   ├── collectors/                        ← 8개 소재 수집기
│   │   └── CLAUDE.md
│   ├── pipelines/                         ← 6개 콘텐츠 파이프라인
│   │   └── CLAUDE.md
│   ├── publishers/                        ← 16개 채널 발행 어댑터
│   │   └── CLAUDE.md
│   ├── analytics/                         ← BML 피드백 루프
│   │   └── CLAUDE.md
│   └── humanizer/                         ← 휴먼라이크 필터
│       └── CLAUDE.md
│
├── n8n/                                   ← n8n 워크플로우 JSON
├── infra/                                 ← Docker Compose, 환경 설정
└── tests/
```

---

## STEP 2: CLAUDE.md 작성 (프로젝트 루트)

이 파일은 OMC의 .claude/CLAUDE.md와 별개로, 프로젝트 루트에 위치합니다.
둘 다 매 세션 시작 시 자동 로드되며 합쳐져서 적용됩니다.
OMC CLAUDE.md = 오케스트레이션 규칙, 루트 CLAUDE.md = 프로젝트 규칙.

아래 내용을 `content-forge/CLAUDE.md`에 그대로 저장합니다:

---

```markdown
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
packages/core — 공유 타입, 유틸, 설정, Result 패턴
packages/agents — 10개 AI 에이전트 (수집, 전략, 리서처, 라이터, 비주얼, 영상, 휴먼라이크, 가디언, 퍼블리셔, 애널리스트)
packages/collectors — 8개 수집 소스 (trend, rss, voice, bookmark, chat, competitor, community, worklog)
packages/pipelines — 6개 파이프라인 (text, thread, longform, shortform, snackable, webtoon)
packages/publishers — 16개 채널 발행 어댑터
packages/analytics — BML 피드백 루프, Grafana 연동
packages/humanizer — 휴먼라이크 필터 (문체 학습, AI 냄새 제거)
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

## 작업 규칙 (중요)
- 작업 전 반드시 @docs/implementation-plan.md 확인
- 태스크 완료 시 해당 체크박스 [x] 체크
- 새 기술 결정 시 @docs/decisions.md에 ADR 추가
- 상세 참조: @docs/architecture.md, @docs/pipeline-specs.md, @docs/agent-roles.md, @docs/channel-formats.md, @docs/brand-bible.md

## 아키텍처 원칙
- 각 에이전트는 독립 실행 가능
- 에이전트 간 통신은 Redis 큐만 사용
- 락 기반 동시성 제어 (Redis)
- 파이프라인은 플러그인 방식 확장
- 모든 외부 API 호출에 재시도 + 서킷 브레이커
- 수집기·에이전트·파이프라인·퍼블리셔 각각 독립 패키지로 분리
```

---

## STEP 3: docs/ 파일 (장기 기억)

OMC의 3-tier notepad는 세션 내 단기 기억입니다.
docs/ 파일은 세션과 무관한 프로젝트의 장기 기억입니다.
둘은 보완 관계이며, 둘 다 필요합니다.

### docs/implementation-plan.md (체크박스 진행 추적)

이 파일은 프로젝트 전체 진행 상태의 단일 진실 원천입니다.

```markdown
# ContentForge 구현 계획

## Phase 1: 텍스트 파이프라인 MVP (1~2주)

### 1.1 프로젝트 초기화
- [ ] Turborepo + pnpm monorepo 셋업
- [ ] TypeScript strict mode 설정
- [ ] ESLint + Prettier 설정
- [ ] Vitest 테스트 프레임워크 설정
- [ ] packages/ 디렉토리 7개 생성 + tsconfig 구성
- [ ] core 패키지: 공유 타입 정의 (Agent, Pipeline, Channel, Material, Task)
- [ ] core 패키지: Result<T,E> 패턴 유틸리티
- [ ] core 패키지: 로깅 유틸리티 (structured logging)

### 1.2 데이터베이스 & 인프라
- [ ] Supabase 프로젝트 설정
- [ ] DB 스키마: materials (소재), contents (콘텐츠), tasks (태스크), publications (발행 기록), metrics (성과)
- [ ] Supabase 마이그레이션 파일 작성
- [ ] Redis 연동 (태스크 큐 + 락 매니저)
- [ ] Docker Compose (Supabase local + Redis + n8n)
- [ ] 환경변수 관리 (.env.example + dotenv)

### 1.3 수집 파이프라인 (MVP: 3개)
- [ ] collectors/base: 수집기 인터페이스 + 베이스 클래스
- [ ] collectors/rss: RSS 피드 수집기 (configurable URL 목록)
- [ ] collectors/trend: Google Trends 한국 데이터 수집
- [ ] collectors/bookmark: Raindrop API 연동
- [ ] 소재 점수화 로직 (Claude API로 관련도 1~10 평가)
- [ ] 중복 제거 로직 (URL + 제목 유사도)
- [ ] Supabase materials 테이블 저장
- [ ] 수집기별 테스트 작성

### 1.4 콘텐츠 변환 (MVP: 3채널)
- [ ] Claude API 연동 모듈 (재시도 + rate limit 핸들링)
- [ ] pipelines/text: 텍스트 파이프라인 베이스 클래스
- [ ] publishers/medium: Medium 포맷 어댑터 (롱폼 2,000~4,000자)
- [ ] publishers/linkedin: LinkedIn 포맷 어댑터 (인사이트 300~800자)
- [ ] publishers/x-thread: X 스레드 포맷 어댑터 (5~15트윗)
- [ ] 변환 품질 검증 테스트 (입력 원고 → 3채널 출력 검증)

### 1.5 에이전트 시스템 (MVP: 3개)
- [ ] agents/base: 에이전트 인터페이스 + 베이스 클래스 (락 획득/해제, 로깅)
- [ ] agents/strategist: 전략 디렉터 (소재 선별, 파이프라인 배정)
- [ ] agents/writer: 콘텐츠 라이터 (채널별 변환 실행)
- [ ] agents/guardian: 브랜드 가디언 (톤 일관성, 팩트 기본 체크)
- [ ] Redis 기반 태스크 큐 + 락 매니저
- [ ] 에이전트 실행 로그 Supabase 저장
- [ ] 에이전트 통합 테스트 (수집 → 전략 → 변환 → 검증 E2E)

### 1.6 통합 & 수동 발행
- [ ] CLI 도구: 원고 파일 입력 → 3채널 변환 출력
- [ ] 변환 결과 미리보기 (터미널 or 로컬 웹)
- [ ] 발행 전 사람 승인 게이트 (y/n)
- [ ] Phase 1 E2E 테스트: 원고.md → Medium + LinkedIn + X 출력

---

## Phase 2: 스레드 + 스낵커블 확장 (2~4주)

### 2.1 에이전트 확장
- [ ] agents/collector: 수집 에이전트 (스케줄 기반 자동 수집)
- [ ] agents/researcher: 트렌드 리서처 (키워드, 경쟁 분석)
- [ ] agents/publisher: 퍼블리셔 에이전트 (API 발행 자동화)
- [ ] agents/humanizer: 휴먼라이크 필터 (문체 학습, AI 냄새 제거)

### 2.2 채널 확장
- [ ] publishers/threads: Threads 어댑터
- [ ] publishers/brunch: 브런치 어댑터
- [ ] publishers/newsletter: 뉴스레터 어댑터 (Buttondown or Substack)
- [ ] publishers/kakao: 카카오 채널 어댑터
- [ ] publishers/blog: 기술 블로그 어댑터

### 2.3 스낵커블 파이프라인
- [ ] pipelines/snackable: 캐러셀·인포그래픽·스토리 파이프라인
- [ ] publishers/ig-carousel: 인스타 캐러셀 생성 (브랜드 템플릿 기반)
- [ ] publishers/ig-single: 인포그래픽 1장 생성
- [ ] publishers/ig-story: 스토리 3~5장 생성

### 2.4 BML 측정 시작
- [ ] analytics/collector: 채널별 성과 데이터 수집기
- [ ] Grafana 대시보드 초기 구축
- [ ] 주간 리포트 자동 생성

---

## Phase 3: 영상 파이프라인 (4~8주)

### 3.1 롱폼 영상
- [ ] pipelines/longform: 스크립트 생성 → TTS → Remotion 렌더링
- [ ] ElevenLabs TTS 연동 (한국어 커스텀 보이스)
- [ ] Remotion 템플릿 설계 + 렌더링 파이프라인
- [ ] 썸네일 자동 생성 (A/B 테스트용 2~3개)
- [ ] publishers/youtube: YouTube Data API 업로드

### 3.2 숏폼 영상
- [ ] pipelines/shortform: 롱폼 하이라이트 추출 → 세로 영상
- [ ] 자막 자동 삽입 (Whisper 기반)
- [ ] publishers/shorts, publishers/reels, publishers/tiktok

### 3.3 에이전트 완성
- [ ] agents/visual: 비주얼 디렉터 (AI 이미지 프롬프트, 썸네일)
- [ ] agents/video: 영상 프로듀서 (TTS, 렌더링, 자막)
- [ ] agents/analyst: 애널리스트 (BML 리포트, 전략 제안)

### 3.4 BML 학습 루프
- [ ] 주간 루프: 지난주 성과 → 이번 주 전략 자동 조정
- [ ] 콘텐츠별 루프: 발행 48시간 후 초기 반응 분석
- [ ] 프롬프트 진화: 고성과 패턴 자동 추출 → 에이전트 프롬프트 반영

---

## Phase 4: 웹툰 + 풀 오토메이션 (8주~)

### 4.1 웹툰 파이프라인
- [ ] pipelines/webtoon: 시나리오 → ComfyUI 이미지 → 자동 조립
- [ ] publishers/webtoon-strip, publishers/infographic

### 4.2 풀 자동화
- [ ] n8n 워크플로우 전체 연결 (수집 → 발행 E2E)
- [ ] 스케줄 발행 자동화 (채널별 최적 시간)
- [ ] A/B 테스트 자동화 (제목, 썸네일, CTA, 발행 시간)
- [ ] 월간 BML 리포트 자동 발행

### 4.3 운영 안정화
- [ ] 발행 실패 자동 재시도 + 알림
- [ ] Sentry 에러 추적
- [ ] Langfuse AI 호출 추적
- [ ] 16채널 풀 커버리지 통합 테스트

---

## Blockers / 미해결 이슈
(작업 중 발생한 블로커를 여기에 기록)

```

### docs/architecture.md

```markdown
# ContentForge 아키텍처

## 시스템 흐름

8개 수집 소스 → 수집 에이전트 → Supabase 소재 DB
  → 전략 디렉터 (소재 선별 + 파이프라인 배정)
    → 6개 파이프라인 (각각 전문 에이전트 팀이 처리)
      → 휴먼라이크 필터 (진정성 확보)
        → 브랜드 가디언 (품질 검증)
          → 퍼블리셔 (16개 채널 자동 발행)
            → 애널리스트 (성과 수집 → BML 루프 → 전략 디렉터 피드백)

## 10개 에이전트
상세: @docs/agent-roles.md

1. 🔭 수집 에이전트 — 8개 소스에서 소재 수집, 점수화, 분류
2. 🧠 전략 디렉터 — 브랜드 바이블 관리, 소재→파이프라인 배정
3. 🔍 트렌드 리서처 — 키워드 리서치, 경쟁 분석, SEO
4. ✏️ 콘텐츠 라이터 — 채널별 포맷 변환, 카피라이팅
5. 🎨 비주얼 디렉터 — 썸네일, 캐러셀, 웹툰, AI 이미지
6. 🎬 영상 프로듀서 — TTS, Remotion 렌더링, 자막
7. 🫀 휴먼라이크 필터 — AI 냄새 제거, 작성자 문체 적용
8. 🛡️ 브랜드 가디언 — 팩트체크, 톤 일관성, 법적 리스크
9. 📮 퍼블리셔 — 16개 채널 API 발행, 스케줄, A/B 테스트
10. 📈 애널리스트 — 성과 수집, BML 리포트, 전략 제안

## 6개 파이프라인
상세: @docs/pipeline-specs.md

📝 텍스트 (5채널): Medium, LinkedIn, 브런치, 뉴스레터, 블로그
🧵 스레드 (3채널): X, Threads, 카카오
🎬 롱폼 영상 (1채널): YouTube 롱폼
⚡ 숏폼 (3채널): Shorts, Reels, TikTok
🍿 스낵커블 (3채널): 캐러셀, 인포그래픽, 스토리
🎨 웹툰 (2채널): 웹툰 스트립, 인포그래픽

## 동시성 제어
- Redis 기반 분산 락 (Redlock 패턴)
- 에이전트 워크플로우: pull → 락 획득 → 작업 → 테스트 → push → 락 해제
- 태스크 큐: Bull (Redis 기반 작업 큐)

## 데이터 모델 (Supabase)
- materials: 수집된 소재 (점수, 태그, 상태)
- contents: 변환된 콘텐츠 (채널, 포맷, 승인 상태)
- tasks: 에이전트 태스크 (타입, 상태, 할당, 로그)
- publications: 발행 기록 (채널, URL, 타임스탬프)
- metrics: 성과 데이터 (조회, 참여, 전환)
```

### docs/decisions.md

```markdown
# 기술 결정 기록 (ADR)

## ADR-001: Turborepo + pnpm 선택
- 날짜:
- 결정: monorepo 도구로 Turborepo + pnpm
- 이유: packages/ 간 의존성 관리, 빌드 캐싱, 병렬 빌드

## ADR-002: Result 패턴
- 날짜:
- 결정: throw 대신 Result<T, E> 패턴 사용
- 이유: 에이전트 간 에러 전파를 명시적으로 제어

## ADR-003: Redis for 태스크 큐 & 락
- 날짜:
- 결정: Bull + Redlock
- 이유: 에이전트 병렬 실행 시 안전한 동시성 제어

(새 결정이 생기면 여기에 추가)
```

---

## STEP 4: 커스텀 슬래시 명령어

`.claude/commands/` 에 다음 파일들을 생성합니다.

### .claude/commands/phase-status.md

```markdown
@docs/implementation-plan.md를 읽고 다음을 알려줘:
1. 현재 Phase와 전체 진행률 (완료 수 / 전체 수)
2. 최근 완료된 태스크 3개
3. 다음으로 진행할 미완료 태스크 3개
4. Blockers 섹션에 미해결 이슈가 있는지
간결하게 요약해.
```

### .claude/commands/save-progress.md

```markdown
현재 세션에서 수행한 작업을 정리해서:
1. @docs/implementation-plan.md의 완료된 태스크 체크박스를 [x]로 업데이트
2. 새로운 기술 결정이 있었으면 @docs/decisions.md에 ADR 추가
3. 미해결 이슈가 있으면 implementation-plan.md 하단 Blockers 섹션에 기록
4. 현재 작업 중인 태스크가 있으면 notepad에 working memory로 기록

<remember priority>Phase [N] 진행 중, 마지막 완료: [태스크명]</remember>
```

### .claude/commands/next-task.md

```markdown
@docs/implementation-plan.md를 확인하고:
1. 현재 Phase에서 첫 번째 미완료 [ ] 태스크를 찾아
2. 해당 태스크에 필요한 docs/ 파일을 @참조해서 컨텍스트 확보
3. 바로 구현을 시작해
4. 완료 후 체크박스를 [x]로 업데이트

테스트 파일도 함께 작성해.
```

---

## STEP 5: 하위 CLAUDE.md (모듈별 규칙)

OMC가 해당 디렉토리 파일을 작업할 때 자동으로 읽습니다.

### packages/agents/CLAUDE.md

```markdown
# ContentForge 에이전트 모듈

## 규칙
- 모든 에이전트는 BaseAgent 클래스를 상속
- 에이전트 인터페이스: execute(task: Task) → Promise<Result<TaskOutput, AgentError>>
- 락 획득/해제는 BaseAgent가 자동 처리
- 각 에이전트는 자신의 역할만 수행 (단일 책임)
- 로깅: structured JSON (agent_id, task_id, action, result)

## 에이전트 역할 상세
@docs/agent-roles.md 참조

## 테스트
- 각 에이전트마다 [agent-name].test.ts 필수
- mock: Redis, Supabase, Claude API
```

### packages/pipelines/CLAUDE.md

```markdown
# ContentForge 파이프라인 모듈

## 규칙
- 모든 파이프라인은 BasePipeline 클래스를 상속
- 파이프라인 인터페이스: process(content: RawContent) → Promise<Result<ChannelContent[], PipelineError>>
- 파이프라인은 1개 이상의 채널 출력을 생성
- 각 단계는 독립 함수로 분리 (compose 가능)

## 파이프라인 상세 스펙
@docs/pipeline-specs.md 참조
```

### packages/publishers/CLAUDE.md

```markdown
# ContentForge 발행 모듈

## 규칙
- 모든 퍼블리셔는 BasePublisher 클래스를 상속
- 퍼블리셔 인터페이스: publish(content: ChannelContent) → Promise<Result<PublishResult, PublishError>>
- 모든 API 호출: 재시도 3회 + 지수 백오프
- rate limit 핸들링 필수
- 발행 결과는 Supabase publications 테이블에 기록

## 채널별 포맷
@docs/channel-formats.md 참조
```

---

## STEP 6: OMC 3-Tier Notepad 활용법

OMC의 notepad(.omc/notepad.md)는 context compaction에서도 살아남는 세션 내 메모리입니다.
docs/의 체크박스와 조합하면 완벽한 메모리 시스템이 됩니다.

```
장기 기억 (세션 간 영구 보존)
├── CLAUDE.md — 프로젝트 헌법 (거의 안 바뀜)
├── docs/implementation-plan.md — 진행 상태 (태스크 완료 시 업데이트)
├── docs/decisions.md — 기술 결정 (새 ADR 추가 시 업데이트)
└── docs/architecture.md — 아키텍처 (Phase 변경 시 업데이트)

단기 기억 (세션 내, compaction 생존)
├── .omc/notepad.md MANUAL — 절대 잊으면 안 되는 것 (자동 안 지워짐)
├── .omc/notepad.md PRIORITY — 현재 작업의 핵심 컨텍스트
└── .omc/notepad.md WORKING — 현재 작업 중 메모 (자동 정리됨)
```

중요한 발견은 notepad에, 프로젝트 진행은 체크박스에 기록합니다.

```
# notepad 기록 예시
/oh-my-claudecode:note --manual "Result 패턴 구현: packages/core/src/result.ts"
/oh-my-claudecode:note --priority "현재 Phase 1.3 수집기 구현 중"
/oh-my-claudecode:note "RSS 수집기에서 인코딩 이슈 발견, iconv-lite 필요"
```

---

## STEP 7: 실행 프롬프트 (OMC 네이티브)

### 프롬프트 1: 프로젝트 부트스트랩 (최초 1회)

```
autopilot: ContentForge 프로젝트를 처음부터 셋업해.

이 프로젝트는 하나의 인사이트를 작성하면 10개 AI 에이전트가 6개 파이프라인을 통해
16개 채널(Medium, LinkedIn, X, 브런치, 뉴스레터, 블로그, Threads, 카카오,
YouTube 롱폼, Shorts, Reels, TikTok, 인스타 캐러셀/인포그래픽/스토리, 웹툰)에
자동 변환/발행하는 플랫폼이야.

해야 할 일:
1. Turborepo + pnpm monorepo 초기화
2. packages/ 7개 (core, agents, collectors, pipelines, publishers, analytics, humanizer) + n8n/ + infra/ 생성
3. TypeScript strict mode + ESLint + Prettier + Vitest 설정
4. core 패키지에 공유 타입 정의 (Agent, Pipeline, Channel, Material, Task, Result)
5. Docker Compose 작성 (Supabase local + Redis)
6. Supabase 마이그레이션 (materials, contents, tasks, publications, metrics)
7. docs/ 파일들이 아직 없으면 CLAUDE.md의 @참조 경로에 맞춰 생성

docs/implementation-plan.md의 Phase 1.1과 1.2를 완료하고 체크박스를 업데이트해.
```

### 프롬프트 2: 수집 파이프라인 (Phase 1.3)

```
ralph: docs/implementation-plan.md의 Phase 1.3 수집 파이프라인을 구현해.
끝날 때까지 멈추지 마.

참조할 문서:
- @docs/architecture.md (전체 구조)
- @docs/pipeline-specs.md (파이프라인 스펙)

구현할 것:
- collectors/base: 수집기 인터페이스 + 베이스 클래스
- collectors/rss, collectors/trend, collectors/bookmark
- 소재 점수화 (Claude API), 중복 제거, Supabase 저장

각 수집기마다 테스트 파일 작성.
완료된 태스크는 implementation-plan.md에서 체크.
```

### 프롬프트 3: 에이전트 시스템 (Phase 1.5)

```
ralph ulw: docs/implementation-plan.md의 Phase 1.5 에이전트 시스템을 구현해.

참조:
- @docs/agent-roles.md (에이전트 역할 정의)
- @docs/architecture.md (동시성 제어)

3개 에이전트를 병렬로 구현해:
- agents/strategist: 소재 선별, 파이프라인 배정
- agents/writer: 채널별 변환 실행
- agents/guardian: 톤 일관성, 팩트 기본 체크

+ Redis 태스크 큐, 락 매니저, 통합 테스트.
완료 후 체크박스 업데이트.
```

### 프롬프트 4: Phase 2 확장 (스레드 + 스낵커블)

```
autopilot: Phase 2를 시작해.
@docs/implementation-plan.md에서 Phase 2 태스크를 순서대로 진행해.

우선순위:
1. 에이전트 4개 추가 (collector, researcher, publisher, humanizer)
2. 채널 5개 추가 (Threads, 브런치, 뉴스레터, 카카오, 블로그)
3. 스낵커블 파이프라인 (인스타 캐러셀, 인포그래픽, 스토리)
4. Grafana BML 측정 대시보드

각 태스크 완료 시 체크박스 업데이트.
중요한 결정은 @docs/decisions.md에 ADR 추가.
```

### 프롬프트 5: 매일 이어가기 (표준 시작 프롬프트)

```
/phase-status

그리고 다음 미완료 태스크부터 이어서 작업해.
```

### 프롬프트 6: 세션 종료 전 (표준 종료 프롬프트)

```
/save-progress
```

---

## STEP 8: .claude/rules/ (파일 패턴별 자동 규칙)

### .claude/rules/api-routes.md

```markdown
---
globs: ["packages/publishers/**/*.ts", "packages/collectors/**/*.ts"]
---
# 외부 API 호출 규칙
- 모든 HTTP 호출에 재시도 로직 (3회, 지수 백오프)
- rate limit 감지 시 429 핸들링
- 타임아웃 30초
- 에러 로깅 (structured JSON)
```

### .claude/rules/test-files.md

```markdown
---
globs: ["**/*.test.ts", "**/*.spec.ts"]
---
# 테스트 규칙
- Vitest 사용
- describe > it 구조
- AAA 패턴 (Arrange, Act, Assert)
- 외부 의존성은 모두 mock (Redis, Supabase, Claude API)
- 테스트 파일명: [module-name].test.ts
```

---

## STEP 9: 일일 워크플로우 요약

```
┌─────────────────────────────────────────────────────────────────┐
│ 매일 아침                                                       │
│                                                                  │
│ 1. claude code 실행                                             │
│ 2. /phase-status  ← 현재 진행 상태 확인                         │
│ 3. /next-task  또는 직접 프롬프트                                │
│    "ralph: Phase 1.3의 나머지 수집기 구현해"                     │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ 작업 중                                                         │
│                                                                  │
│ - OMC가 자동으로 에이전트 배정, 모델 라우팅, 병렬 실행            │
│ - 중요 발견 시: <remember priority>발견 내용</remember>          │
│ - 또는: /oh-my-claudecode:note --priority "발견 내용"           │
│ - HUD로 진행 상태 모니터링                                       │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ 세션 종료 전                                                     │
│                                                                  │
│ 1. /save-progress  ← 체크박스 업데이트 + 결정 기록               │
│ 2. 다음 세션에서 /phase-status로 바로 이어감                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 핵심 원칙 5가지

1. **CLAUDE.md는 간결하게, docs/는 상세하게.**
   CLAUDE.md에는 매 세션 필요한 핵심만. 상세 내용은 docs/에 두고 @참조.

2. **체크박스가 프로젝트의 진실.**
   docs/implementation-plan.md의 체크박스가 유일한 진행 상태 원천.
   세션이 끊겨도, 에이전트가 바뀌어도, 체크박스만 보면 어디까지 했는지 안다.

3. **OMC notepad는 세션 내 기억, docs/는 세션 간 기억.**
   notepad의 MANUAL 티어로 compaction을 버티고,
   docs/의 체크박스로 세션 간 연속성을 유지.

4. **하나의 프롬프트에 하나의 Phase(또는 서브 Phase).**
   "autopilot: Phase 1.3 수집기 전부 구현해"처럼 범위를 명확히.
   여러 Phase를 섞지 않는다.

5. **세션 시작은 /phase-status, 종료는 /save-progress.**
   이 두 명령어가 세션 간 연속성의 핵심.


   OMC 네이티브로 완전히 재설계한 가이드입니다. 이전 버전과 달라진 핵심을 정리하면:
OMC가 대체한 것 — 에이전트 오케스트레이션, 모델 라우팅, 병렬 실행, compaction 생존 메모리를 전부 OMC에 위임했습니다. 바닐라 Claude Code에서 직접 설계해야 했던 "/compact 타이밍 관리", "에이전트 분업 지시" 같은 것들이 autopilot:, ralph:, ralph ulw: 한 줄로 대체됩니다.
우리가 직접 관리하는 것 — 9개 STEP으로 구성했습니다:

STEP 0~1: OMC 설치 + 프로젝트 디렉토리 구조
STEP 2: 루트 CLAUDE.md (WHY/WHAT/HOW — OMC 프롬프트와 분리)
STEP 3: docs/ 장기 기억 (implementation-plan.md 체크박스가 진행 상태의 단일 진실 원천, architecture.md, decisions.md ADR)
STEP 4: 커스텀 명령어 3개 (/phase-status, /save-progress, /next-task)
STEP 5: 모듈별 하위 CLAUDE.md (agents/, pipelines/, publishers/)
STEP 6: OMC notepad(단기 기억) + docs/(장기 기억) 이중 메모리 전략
STEP 7: 실행 프롬프트 6개 (부트스트랩 → 수집기 → 에이전트 → Phase 2 → 매일 이어가기 → 세션 종료)
STEP 8: .claude/rules/ 파일 패턴별 자동 규칙
STEP 9: 일일 워크플로우 (아침 → 작업 → 종료)
