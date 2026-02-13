# Core Module Rules

## Purpose
Shared types, utilities, and configuration for all ContentForge packages.

## Rules
- All shared TypeScript types/interfaces defined here
- No external API dependencies
- Zero side effects in utility functions
- 100% test coverage for utility functions

## 채널 스키마
- 채널 정책은 config/channels.json 데이터 파일로 관리 (코드 상수 아님)
- TS 타입, DB enum, publisher 키는 canonical 스키마에서 파생
- 채널 추가 시: channels.json 수정 → 타입 자동 동기화

## 향후 개선 (TODO)
- packages/video-contracts 신설: web/video 간 타입 공유 패키지
- config/pipelines.json 도입: 파이프라인 정책 데이터화
