# Pipeline Specs

기본 파이프라인 타입(템플릿):
- standard-flow
- expedited-flow
- high-risk-flow
- batch-flow
- realtime-flow

각 파이프라인은 Result<T,E> 기반으로 단계별 실패를 명시적으로 반환한다.
각 도메인은 `config/domain.json`의 `pipelineStages`를 기준으로 실제 단계를 재정의한다.
