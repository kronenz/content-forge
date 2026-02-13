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

1. 수집 에이전트 — 8개 소스에서 소재 수집, 점수화, 분류
2. 전략 디렉터 — 브랜드 바이블 관리, 소재→파이프라인 배정
3. 트렌드 리서처 — 키워드 리서치, 경쟁 분석, SEO
4. 콘텐츠 라이터 — 채널별 포맷 변환, 카피라이팅
5. 비주얼 디렉터 — Claude SVG 시각화, 씬별 비주얼 생성, 썸네일
6. 영상 프로듀서 — TTS, 아바타 립싱크, Remotion 렌더링, 자막
7. 휴먼라이크 필터 — AI 냄새 제거, 작성자 문체 적용
8. 브랜드 가디언 — 팩트체크, 톤 일관성, 법적 리스크
9. 퍼블리셔 — 16개 채널 API 발행, 스케줄, A/B 테스트
10. 애널리스트 — 성과 수집, BML 리포트, 전략 제안

## 6개 파이프라인
상세: @docs/pipeline-specs.md

- 텍스트 (5채널): Medium, LinkedIn, 브런치, 뉴스레터, 블로그
- 스레드 (3채널): X, Threads, 카카오
- 롱폼 영상 (1채널): YouTube 롱폼
- 숏폼 (3채널): Shorts, Reels, TikTok
- 스낵커블 (3채널): 캐러셀, 인포그래픽, 스토리
- 웹툰 (2채널): 웹툰 스트립, 인포그래픽

## 영상 파이프라인 아키텍처 (Phase 3)

### 설계 방향: Option D — 하이브리드 + Vue 에디터 (ADR-008, ADR-009)
- Remotion: **서버 렌더링만** (headless MP4 생성) — React 프론트엔드 없음
- 에디터 UI: **Vue 3** (Style L 디자인 시스템) — 타임라인, 인스펙터, 컨트롤
- 씬 미리보기: **iframe + HTML/CSS/SVG** — Claude 생성물을 브라우저에서 직접 렌더
- Remotion 씬 템플릿 (표준 씬) + Claude SVG 주입 (복잡한 시각화)
- AI 아바타 프레젠터 (개인 브랜딩, 립싱크)
- 플러거블 비주얼 소스 (7가지)

### 영상 제작 파이프라인

```
원본 소재 (RawContent)
  │
  ▼
Stage 1: Script Generation (Claude API)
  │ → VideoScript { scenes[], aspectRatio, estimatedDuration }
  │
  ├──────────────┬──────────────┬────────────────┐
  ▼              ▼              ▼                ▼
Stage 2:      Stage 3:       Stage 4:         (병렬)
TTS 생성      비주얼 생성     아바타 생성
(ElevenLabs)  (Claude SVG    (HeyGen /
              / AI Image     LivePortrait)
              / AI Video     → 립싱크 클립
              / Template)
  │              │              │
  └──────────────┴──────────────┘
                 │
                 ▼
Stage 5: Remotion Compose
  │ 메인 비주얼 (배경) + 아바타 PiP (오버레이)
  │ + 자막 + 트랜지션 + 오디오 트랙
  │ → MP4
  │
  ▼
ChannelContent → Publishers (YouTube, Shorts, Reels, TikTok)
```

### 4개 독립 레이어 (씬 단위)
1. **나레이션** — TTS 음성 (편집/재생성 가능)
2. **비주얼** — 7가지 소스 중 택 1 (claude-svg, ai-video, ai-image, remotion-template, stock, screen-recording, manual-upload)
3. **프레젠터** — AI 아바타 PiP (on/off, 위치/크기/제스처 제어)
4. **오버레이** — 자막, 하단 타이틀, 워터마크

### 비주얼 소스 타입

| 소스 | 설명 | 적합한 씬 |
|------|------|----------|
| claude-svg | Claude가 SVG/HTML 시각화 생성 | 다이어그램, 차트, 인포그래픽, 타임라인 |
| ai-video | AI 영상 생성 (Sora, Runway, Kling, Pika) | 시네마틱 B-roll |
| ai-image | AI 이미지 생성 (DALL-E, Flux, ComfyUI) + Ken Burns | 컨셉 아트, 배경 |
| remotion-template | 프리셋 템플릿 + props | 타이틀, 텍스트, 코드 |
| stock | 스톡 검색 (Pexels, Unsplash) | 일반 B-roll |
| screen-recording | 화면 녹화 | 튜토리얼, 데모 |
| manual-upload | 직접 업로드 | 수동 오버라이드 |

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
- video_projects: 영상 프로젝트 (씬 목록, 상태, 스타일)
- avatar_profiles: AI 아바타 프로필 (참조 사진, 프로바이더, 보이스 연결)

## 패키지 구조

```
packages/
  core/        — 공유 타입, 유틸, 설정, Result 패턴
  agents/      — 10개 AI 에이전트
  collectors/  — 8개 수집 소스
  pipelines/   — 6개 파이프라인 (text, thread, longform, shortform, snackable, webtoon)
  publishers/  — 16개 채널 발행 어댑터
  analytics/   — BML 피드백 루프, Grafana 연동
  humanizer/   — 휴먼라이크 필터
  cli/         — CLI 도구
  video/       — Remotion 씬 템플릿, 렌더러, 아바타 클라이언트
  web/         — Vue 3 에디터 프론트엔드 (씬 편집기, 대시보드)
```
