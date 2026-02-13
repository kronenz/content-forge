# 기술 결정 기록 (ADR)

## ADR-001: Turborepo + pnpm 선택
- 날짜: 2026-02-12
- 결정: monorepo 도구로 Turborepo + pnpm
- 이유: packages/ 간 의존성 관리, 빌드 캐싱, 병렬 빌드

## ADR-002: Result 패턴
- 날짜: 2026-02-12
- 결정: throw 대신 Result<T, E> 패턴 사용
- 이유: 에이전트 간 에러 전파를 명시적으로 제어

## ADR-003: Redis for 태스크 큐 & 락
- 날짜: 2026-02-12
- 결정: Bull + Redlock
- 이유: 에이전트 병렬 실행 시 안전한 동시성 제어

## ADR-004: Mock API 퍼블리셔 패턴
- 날짜: 2026-02-12
- 결정: 모든 퍼블리셔를 mock API로 구현 후 실제 API 연동은 점진적 교체
- 이유: 채널 확장 속도 우선, 실제 API 키 없이 E2E 테스트 가능, BasePublisher.withRetry() 패턴으로 교체 시 변경 최소화

## ADR-005: Buttondown 뉴스레터
- 날짜: 2026-02-12
- 결정: 뉴스레터 플랫폼으로 Buttondown 선택 (Substack 대신)
- 이유: API 친화적, 자동화 용이, 무료 티어 충분, 커스텀 도메인 지원

## ADR-006: HumanizerAgent AI 패턴 감지
- 날짜: 2026-02-12
- 결정: 15개 AI 특유 패턴 룰 기반 감지 + 대체어 치환
- 이유: LLM 호출 없이 빠른 처리, 패턴 목록 확장 용이, aiPatternScore(0-100)로 정량 측정

## ADR-007: Grafana BML 대시보드
- 날짜: 2026-02-12
- 결정: Grafana JSON provisioning으로 대시보드 자동 배포
- 이유: 코드로 관리 가능, Docker Compose 연동, 채널별 성과 시각화

## ADR-008: Option D 하이브리드 영상 파이프라인
- 날짜: 2026-02-12
- 결정: Remotion 씬 템플릿 + Claude SVG 주입 하이브리드 방식
- 대안: (A) Claude TSX 직접 생성, (B) Puppeteer 프레임 캡처, (C) 템플릿 only
- 이유: 템플릿으로 안정성 확보 + Claude SVG로 창의적 시각화, SVG 새니타이징으로 보안 확보

## ADR-009: Remotion 서버 렌더링 + Vue 에디터
- 날짜: 2026-02-12
- 결정: Remotion은 서버 MP4 렌더링만 사용, 에디터는 Vue 3, 미리보기는 HTML/CSS/SVG iframe
- 대안: (1) React 전환, (2) Vue+Remotion iframe 하이브리드
- 이유: Vue 3 + Style L 디자인 시스템 유지, React-Vue 충돌 회피, Claude SVG/HTML은 브라우저에서 직접 렌더 가능, 미리보기는 근사치로 충분, 최종 품질은 서버 Remotion이 보장

## ADR-010: AI 아바타 프레젠터
- 날짜: 2026-02-12
- 결정: 씬별 AI 아바타 PiP 오버레이 (HeyGen 우선, LivePortrait 후순위)
- 이유: 개인 브랜딩 + 신뢰성 확보, 씬별 on/off 제어, 프로바이더 교체 가능한 추상화

(새 결정이 생기면 여기에 추가)
