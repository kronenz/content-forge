# ContentForge Agent Roles

## 공통 패턴
- 모든 에이전트는 `BaseAgent` 추상 클래스를 확장
- 템플릿 메서드: `run(task)` = 락 획득 → `execute(task)` → 락 해제
- 에러 처리: `Result<T, E>` 패턴
- 로깅: structured logging (packages/core/logger)

## 1. 수집 에이전트 (CollectorAgent)
- **역할**: 8개 소스에서 소재 자동 수집, 점수화, 분류
- **소스**: RSS, Google Trends, Raindrop 북마크, 음성 메모, 채팅 로그, 경쟁사 모니터링, 커뮤니티, 작업 일지
- **출력**: Material[] (점수 1~10, 태그, 중복 제거 완료)
- **상태**: 구현 완료 (Phase 2)

## 2. 전략 디렉터 (StrategistAgent)
- **역할**: 브랜드 바이블 기반 소재 선별, 파이프라인 배정
- **로직**: 콘텐츠 길이/유형에 따라 text, thread, longform, shortform, snackable 파이프라인 배정
- **출력**: Task[] (파이프라인별 작업 생성)
- **상태**: 구현 완료 (Phase 1)

## 3. 트렌드 리서처 (ResearcherAgent)
- **역할**: 키워드 리서치, 경쟁 분석, SEO 최적화 데이터
- **입력**: Material (소재)
- **출력**: 키워드 목록, 경쟁 콘텐츠 분석, SEO 추천
- **상태**: 구현 완료 (Phase 2)

## 4. 콘텐츠 라이터 (WriterAgent)
- **역할**: 채널별 포맷 변환, 카피라이팅
- **입력**: RawContent + Pipeline
- **출력**: ChannelContent[] (채널별 변환 결과)
- **상태**: 구현 완료 (Phase 1)

## 5. 비주얼 디렉터 (VisualDirectorAgent) — Phase 3
- **역할**: 씬별 비주얼 생성 총괄
- **기능**:
  - Claude API로 SVG/HTML 시각 자료 생성 (다이어그램, 차트, 인포그래픽, 타임라인)
  - 씬별 비주얼 소스 자동 추천 (claude-svg / ai-image / ai-video / template)
  - AI 이미지 생성 프롬프트 작성 (DALL-E, Flux, ComfyUI)
  - 썸네일 자동 생성 (A/B 테스트용 2~3개)
  - Zod 스키마로 Claude 출력 검증 + SVG 새니타이징
- **입력**: VideoScriptScene + Material
- **출력**: SceneVisualOutput[] (비주얼 데이터 + 프리뷰)
- **상태**: Phase 3 예정

## 6. 영상 프로듀서 (VideoProducerAgent) — Phase 3
- **역할**: 영상 제작 전체 오케스트레이션
- **기능**:
  - TTS 생성 관리 (ElevenLabs, 씬별 타이밍 결정)
  - AI 아바타 생성 관리 (HeyGen/LivePortrait, 립싱크)
  - Remotion 렌더링 트리거 (씬 합성, 최종 MP4)
  - 숏폼 파생 (롱폼 하이라이트 추출)
  - 자막 생성 (Whisper word-level)
- **입력**: VideoProject (편집 완료된 프로젝트)
- **출력**: MP4 파일 경로 + 렌더링 메타데이터
- **상태**: Phase 3 예정

## 7. 휴먼라이크 필터 (HumanizerAgent)
- **역할**: AI 냄새 제거, 작성자 문체 학습 적용
- **입력**: ChannelContent (AI 생성 콘텐츠)
- **출력**: ChannelContent (문체 적용된 콘텐츠)
- **상태**: 구현 완료 (Phase 2)

## 8. 브랜드 가디언 (GuardianAgent)
- **역할**: 톤 일관성 검증, 팩트 기본 체크, 법적 리스크 검토
- **입력**: ChannelContent
- **출력**: 검증 결과 (통과/수정 필요/거부)
- **상태**: 구현 완료 (Phase 1)

## 9. 퍼블리셔 (PublisherAgent)
- **역할**: 16개 채널 API 발행 자동화, 스케줄링
- **지원 채널**: Medium, LinkedIn, X, Threads, 브런치, 뉴스레터, 블로그, 카카오, YouTube, Shorts, Reels, TikTok, IG 캐러셀/싱글/스토리, 웹툰
- **출력**: PublishResult (외부 URL, ID, 타임스탬프)
- **상태**: 구현 완료 (Phase 2)

## 10. 애널리스트 (AnalystAgent) — Phase 3
- **역할**: 성과 수집, BML 리포트, 전략 제안
- **기능**:
  - 채널별 성과 데이터 수집 (조회수, 참여, 전환)
  - 주간/월간 BML 리포트 자동 생성
  - 고성과 패턴 추출 → 전략 디렉터 피드백
  - 콘텐츠별 48시간 초기 반응 분석
- **입력**: Metric[] (채널 성과 데이터)
- **출력**: BML 리포트 + 전략 제안
- **상태**: analytics 모듈 구현 완료, 에이전트 Phase 3 예정
