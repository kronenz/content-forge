# ContentForge 파이프라인 모듈

## 규칙
- 모든 파이프라인은 BasePipeline 클래스를 상속
- 파이프라인 인터페이스: process(content: RawContent) → Promise<Result<ChannelContent[], PipelineError>>
- 파이프라인은 1개 이상의 채널 출력을 생성
- 각 단계는 독립 함수로 분리 (compose 가능)

## 파이프라인 상세 스펙
@docs/pipeline-specs.md 참조

## Claude 응답 검증
- Claude API 응답은 반드시 Zod 스키마(.safeParse())로 검증
- JSON.parse() 성공 ≠ 스키마 유효. 반드시 VideoScriptSchema 등으로 2차 검증
- 검증 실패 시 Zod error details를 에러 메시지에 포함

## 향후 개선 (TODO)
- 파이프라인 단계 enum 공통화 (script, audio, visual, render)
- BasePipeline에 stage telemetry 훅 추가
