# Pipeline Specifications

## 1. 텍스트 파이프라인 (TextPipeline)
- **타입**: text
- **출력 채널**: medium, linkedin, brunch, newsletter, blog
- **입력**: RawContent (소재 + 타겟 채널)
- **처리**: Claude API로 채널별 포맷 변환
- **출력**: ChannelContent[] (채널별 제목 + 본문 + 메타데이터)
- **상태**: 구현 완료 (Phase 1)

## 2. 스레드 파이프라인 (ThreadPipeline)
- **타입**: thread
- **출력 채널**: x-thread, threads, kakao
- **입력**: RawContent
- **처리**: Claude API로 스레드 형태 분할 (5~15개 트윗/포스트)
- **출력**: ChannelContent[] (각 트윗/포스트 단위)
- **상태**: 텍스트 파이프라인에 포함 (Phase 1)

## 3. 스낵커블 파이프라인 (SnackablePipeline)
- **타입**: snackable
- **출력 채널**: ig-carousel, ig-single, ig-story
- **입력**: RawContent
- **처리**: Claude API로 비주얼 콘텐츠 생성 (캐러셀 슬라이드, 인포그래픽, 스토리)
- **출력**: ChannelContent[] (슬라이드별 텍스트 + 레이아웃 지시)
- **상태**: 구현 완료 (Phase 2)

## 4. 롱폼 영상 파이프라인 (LongformPipeline)
- **타입**: longform
- **출력 채널**: youtube
- **입력**: RawContent (소재) + VideoProject (편집 상태)
- **처리 단계**:
  1. Script Generation: Claude → VideoScript (씬 분할, 나레이션, 비주얼 프롬프트)
  2. TTS: ElevenLabs → AudioSegment[] (씬별 음성 + 타이밍)
  3. Visual Generation: Claude SVG / AI Image / AI Video → SceneVisualOutput[]
  4. Avatar Generation: HeyGen/LivePortrait → 립싱크 클립
  5. Remotion Compose: 비주얼 + 아바타 PiP + 자막 + 오디오 → MP4
  6. Thumbnail: Claude SVG → Puppeteer PNG (A/B 2~3개)
- **씬 비주얼 소스 (7가지)**: claude-svg, ai-video, ai-image, remotion-template, stock, screen-recording, manual-upload
- **아바타 프레젠터**: 씬별 on/off, 위치/크기/제스처 제어
- **편집 모드**: 씬 기반 에디터에서 개별 조정 가능
- **출력**: ChannelContent (MP4 파일 경로 + 썸네일 + 메타데이터)
- **상태**: Phase 3 예정

## 5. 숏폼 영상 파이프라인 (ShortformPipeline)
- **타입**: shortform
- **출력 채널**: shorts, reels, tiktok
- **입력**: RawContent 또는 기존 VideoProject (롱폼 파생)
- **처리 경로**:
  - Path A (파생): 롱폼 VideoScript에서 하이라이트 1~3씬 추출 → 9:16 리렌더 + 자막
  - Path B (독립): 소재 → 60초 이내 3~5씬 숏폼 스크립트 직접 생성
- **자막**: Whisper 기반 word-level 타임스탬프
- **출력**: ChannelContent[] (채널별 MP4 파일 경로 + 메타데이터)
- **상태**: Phase 3 예정

## 6. 웹툰 파이프라인 (WebtoonPipeline)
- **타입**: webtoon
- **출력 채널**: webtoon, infographic (확장 예정: webtoon-strip)
- **입력**: RawContent
- **처리**: Claude 시나리오 → ComfyUI 이미지 생성 → 자동 조립
- **출력**: ChannelContent[] (이미지 시퀀스 + 메타데이터)
- **상태**: Phase 4 예정

## 공통 패턴
- 모든 파이프라인은 `BasePipeline` 추상 클래스를 확장
- `process(content: RawContent)` → `Result<ChannelContent[], PipelineError>` 반환
- Claude API 호출은 `callClaude()` 함수 사용 (재시도 + rate limit)
- 에러 처리는 `Result<T, E>` 패턴 (throw 최소화)
