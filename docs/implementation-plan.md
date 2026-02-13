# ContentForge 구현 계획

## Phase 1: 텍스트 파이프라인 MVP (1~2주)

### 1.1 프로젝트 초기화
- [x] Turborepo + pnpm monorepo 셋업
- [x] TypeScript strict mode 설정
- [x] ESLint + Prettier 설정
- [x] Vitest 테스트 프레임워크 설정
- [x] packages/ 디렉토리 7개 생성 + tsconfig 구성
- [x] core 패키지: 공유 타입 정의 (Agent, Pipeline, Channel, Material, Task)
- [x] core 패키지: Result<T,E> 패턴 유틸리티
- [x] core 패키지: 로깅 유틸리티 (structured logging)

### 1.2 데이터베이스 & 인프라
- [x] Supabase 프로젝트 설정
- [x] DB 스키마: materials (소재), contents (콘텐츠), tasks (태스크), publications (발행 기록), metrics (성과)
- [x] Supabase 마이그레이션 파일 작성
- [x] Redis 연동 (태스크 큐 + 락 매니저)
- [x] Docker Compose (Supabase local + Redis + n8n)
- [x] 환경변수 관리 (.env.example + dotenv)

### 1.3 수집 파이프라인 (MVP: 3개)
- [x] collectors/base: 수집기 인터페이스 + 베이스 클래스
- [x] collectors/rss: RSS 피드 수집기 (configurable URL 목록)
- [x] collectors/trend: Google Trends 한국 데이터 수집
- [x] collectors/bookmark: Raindrop API 연동
- [x] 소재 점수화 로직 (키워드 기반 관련도 1~10 평가, MVP)
- [x] 중복 제거 로직 (URL + 제목 유사도)
- [x] Supabase materials 테이블 저장
- [x] 수집기별 테스트 작성 (30 tests)

### 1.4 콘텐츠 변환 (MVP: 3채널)
- [x] Claude API 연동 모듈 (재시도 + rate limit 핸들링)
- [x] pipelines/text: 텍스트 파이프라인 베이스 클래스
- [x] publishers/medium: Medium 포맷 어댑터 (롱폼 2,000~4,000자)
- [x] publishers/linkedin: LinkedIn 포맷 어댑터 (인사이트 300~800자)
- [x] publishers/x-thread: X 스레드 포맷 어댑터 (5~15트윗)
- [x] 변환 품질 검증 테스트 (pipelines 15 + publishers 16 tests)

### 1.5 에이전트 시스템 (MVP: 3개)
- [x] agents/base: 에이전트 인터페이스 + 베이스 클래스 (락 획득/해제, 로깅)
- [x] agents/strategist: 전략 디렉터 (소재 선별, 파이프라인 배정)
- [x] agents/writer: 콘텐츠 라이터 (채널별 변환 실행)
- [x] agents/guardian: 브랜드 가디언 (톤 일관성, 팩트 기본 체크)
- [x] 인메모리 태스크 큐 + 락 매니저 (Redis 연동은 Phase 2)
- [x] 에이전트 실행 로그 Supabase 저장
- [x] 에이전트 통합 테스트 (60 tests)

### 1.6 통합 & 수동 발행
- [x] CLI 도구: 원고 파일 입력 → 3채널 변환 출력
- [x] 변환 결과 미리보기 (터미널 or 로컬 웹)
- [x] 발행 전 사람 승인 게이트 (y/n)
- [x] Phase 1 E2E 테스트: 원고.md → Medium + LinkedIn + X 출력

---

## Phase 2: 스레드 + 스낵커블 확장 (2~4주)

### 2.1 에이전트 확장
- [x] agents/collector: 수집 에이전트 (스케줄 기반 자동 수집)
- [x] agents/researcher: 트렌드 리서처 (키워드, 경쟁 분석)
- [x] agents/publisher: 퍼블리셔 에이전트 (API 발행 자동화)
- [x] agents/humanizer: 휴먼라이크 필터 (문체 학습, AI 냄새 제거)

### 2.2 채널 확장
- [x] publishers/threads: Threads 어댑터
- [x] publishers/brunch: 브런치 어댑터
- [x] publishers/newsletter: 뉴스레터 어댑터 (Buttondown or Substack)
- [x] publishers/kakao: 카카오 채널 어댑터
- [x] publishers/blog: 기술 블로그 어댑터

### 2.3 스낵커블 파이프라인
- [x] pipelines/snackable: 캐러셀·인포그래픽·스토리 파이프라인
- [x] publishers/ig-carousel: 인스타 캐러셀 생성 (브랜드 템플릿 기반)
- [x] publishers/ig-single: 인포그래픽 1장 생성
- [x] publishers/ig-story: 스토리 3~5장 생성

### 2.4 BML 측정 시작
- [x] analytics/collector: 채널별 성과 데이터 수집기
- [x] Grafana 대시보드 초기 구축
- [x] 주간 리포트 자동 생성

---

## Phase 3: 영상 파이프라인 — 씬 기반 멀티모달 에디터 (4~8주)

아키텍처: Option D (하이브리드) — Remotion 씬 템플릿 + Claude SVG 주입 + 플러거블 비주얼 소스 + AI 아바타 프레젠터

### 3.0 타입 & 스키마 정의
- [x] core/types.ts: VideoProject, EditableScene, VisualSource, AvatarProfile 등 타입 추가
- [x] core/schemas.ts: Zod 스키마 (VideoScript, SceneVisualOutput, EditableScene 검증용)
- [x] 타입 테스트 작성 (27 tests)

### 3.1 스크립트 생성 + TTS
- [x] pipelines/longform-pipeline.ts: LongformPipeline (BasePipeline 확장)
- [x] pipelines/shortform-pipeline.ts: ShortformPipeline (BasePipeline 확장)
- [x] pipelines/tts-client.ts: ElevenLabs TTS 래퍼 (Result<T,E> 패턴, 재시도, 한국어 보이스)
- [x] Claude 대본 생성 프롬프트: 소재 → VideoScript (씬 분할, 비주얼 타입 추천, 아바타 on/off 자동 추천)
- [x] TTS 테스트 + 파이프라인 단위 테스트 (21 tests)

### 3.2 Remotion 서버 렌더러 + SVG 새니타이저 + 미리보기 (packages/video/)
- [x] packages/video/ Remotion + React 의존성 추가 (서버 렌더링 전용)
- [x] compositions/LongformVideo.tsx: 16:9 서버 렌더링 루트 컴포지션
- [x] compositions/ShortformVideo.tsx: 9:16 서버 렌더링 루트 컴포지션
- [x] scenes/TitleCardScene.tsx: 타이틀 카드 (Remotion 서버 컴포넌트)
- [x] scenes/TextRevealScene.tsx: 텍스트 순차 등장
- [x] scenes/ListRevealScene.tsx: 리스트 스태거 애니메이션
- [x] scenes/CustomSVGScene.tsx: Claude SVG 주입 슬롯 (새니타이징 포함)
- [x] utils/svg-sanitizer.ts: SVG 새니타이징 (순수 TypeScript, DOMPurify 불필요)
- [x] utils/scene-registry.ts: SceneType 메타데이터 레지스트리
- [x] utils/preview-renderer.ts: HTML/CSS/SVG 미리보기 HTML 생성 (에디터 iframe용)
- [x] render.ts: Remotion headless bundle + render → MP4 (서버 전용)
- [x] 씬 템플릿 + 새니타이저 단위 테스트 (34 tests)

### 3.3 Claude SVG 비주얼 생성
- [x] agents/visual-director.ts: VisualDirector 에이전트 (BaseAgent 확장)
  - Claude에게 씬별 SVG/HTML 시각 자료 생성 지시
  - Zod 스키마로 출력 검증
  - SVG 새니타이징 적용
- [x] 씬 타입별 비주얼 프롬프트 템플릿 (diagram, chart, timeline, infographic, comparison, code-highlight, quote)
- [x] scenes/DiagramScene.tsx, ChartScene.tsx, ComparisonScene.tsx, TimelineScene.tsx, CodeHighlightScene.tsx, QuoteScene.tsx 추가
- [x] 비주얼 생성 테스트 (146 agent tests)

### 3.4 AI 아바타 프레젠터
- [x] video/avatar/avatar-client.ts: 아바타 프로바이더 추상화 (BaseAvatarProvider)
- [x] video/avatar/heygen-provider.ts: HeyGen API 래퍼 (커스텀 아바타, 립싱크)
- [x] video/avatar/liveportrait-provider.ts: LivePortrait 셀프호스트 래퍼
- [x] compositions/PresenterOverlay.tsx: Remotion PiP 오버레이 컴포넌트 (위치, 크기, 모양, 배경)
- [x] AvatarProfile 관리 API (프로필 생성, 사진 업로드, 아바타 학습)
- [x] 씬별 아바타 on/off 자동 추천 로직 (avatar-recommender.ts)
- [x] 아바타 생성 + PiP 합성 테스트 (98 video tests)

### 3.5 에디터 프론트엔드 (packages/web/)
- [x] packages/web/ 패키지 초기화 (Vue 3 + Vite + Tailwind + Pinia + Style L 디자인)
- [x] 프로젝트 목록 페이지 (VideoProject CRUD)
- [x] 씬 타임라인 UI (드래그앤드롭 순서 변경, 씬 추가/삭제)
- [x] 씬 인스펙터 패널 (나레이션 편집, 비주얼 소스 선택, 아바타 토글, 오버레이 설정)
- [x] 비주얼 소스 스위처 (claude-svg / ai-video / ai-image / template / stock / upload)
- [x] 씬별 미리보기 + 전체 영상 미리보기
- [x] 버전 히스토리 (비주얼 되돌리기)
- [x] 렌더링 진행률 + 최종 MP4 다운로드
- [x] 백엔드 API (Hono): 프로젝트/씬 CRUD + 생성 엔드포인트

### 3.6 플러거블 비주얼 소스 확장
- [x] AI Image 소스: DALL-E, Flux, ComfyUI 프로바이더 + Ken Burns 애니메이션
- [x] AI Video 소스: Runway, Kling, Pika 프로바이더
- [x] Stock 소스: Pexels, Unsplash API 연동
- [x] 수동 업로드: 이미지/영상 파일 업로드 + Remotion 통합

### 3.7 숏폼 파이프라인
- [x] Path A: 롱폼 파생 — 하이라이트 씬 추출 → 9:16 리렌더 + 자막
- [x] Path B: 독립 생성 — 60초 이내 3~5씬 숏폼 스크립트
- [x] 자막 자동 삽입 (Whisper 기반 word-level 타임스탬프)
- [x] publishers/youtube.ts: YouTube Data API 업로드
- [x] publishers/shorts.ts, publishers/reels.ts, publishers/tiktok.ts (86 tests)

### 3.8 에이전트 완성
- [x] agents/video-producer.ts: 영상 프로듀서 (전체 파이프라인 오케스트레이션)
- [x] agents/analyst.ts: 애널리스트 (BML 리포트, 전략 제안)
- [x] 썸네일 자동 생성 (Claude SVG, 3가지 스타일, 186 agent tests)

### 3.9 BML 학습 루프
- [x] 주간 루프: 지난주 성과 → 이번 주 전략 자동 조정
- [x] 콘텐츠별 루프: 발행 48시간 후 초기 반응 분석
- [x] 프롬프트 진화: 고성과 패턴 자동 추출 → 에이전트 프롬프트 반영

---

## Phase 4: 웹툰 + 풀 오토메이션 (8주~)

### 4.1 웹툰 파이프라인
- [x] pipelines/webtoon: 시나리오 → ComfyUI 이미지 → 자동 조립
- [x] publishers/webtoon-strip, publishers/infographic

### 4.2 풀 자동화
- [x] n8n 워크플로우 전체 연결 (수집 → 발행 E2E)
- [x] 스케줄 발행 자동화 (채널별 최적 시간)
- [x] A/B 테스트 자동화 (제목, 썸네일, CTA, 발행 시간)
- [x] 월간 BML 리포트 자동 발행

### 4.3 운영 안정화
- [x] 발행 실패 자동 재시도 + 알림
- [x] Sentry 에러 추적
- [x] Langfuse AI 호출 추적
- [x] 16채널 풀 커버리지 통합 테스트

### 4.4 에디터 고도화
- [x] 멀티 프로젝트 대시보드
- [x] 팀 협업 (프로젝트 공유, 댓글, 승인 워크플로우)
- [x] 템플릿 마켓플레이스 (씬 템플릿 저장/공유)
- [x] 모바일 반응형 에디터

---

## Blockers / 미해결 이슈
(작업 중 발생한 블로커를 여기에 기록)
