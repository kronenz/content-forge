# Analytics Module Rules

## Purpose
BML (Build-Measure-Learn) feedback loop.

## Rules
- Collect performance metrics from all channels
- Feed insights back to agents for optimization
- Privacy-first data handling
- Aggregated metrics only, no PII

## 코드 품질 원칙
- Claude 응답(패턴, 전략 조정 등)은 Zod 스키마로 검증
- AnalyticsProvider 인터페이스로 mock/real 구현 분리

## 향후 개선 (TODO)
- metric 수집 시 idempotency key 도입 (채널+publicationId+측정주기)
- 리포트에 confidence/coverage 지표 추가
- 실제 채널 API 연결 시 구조 변경 최소화를 위한 provider 추상화
