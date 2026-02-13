---
name: test-strategy
description: 테스트 전략 및 패턴을 정의합니다
---

# Test Strategy Skill

## 테스트 구조
- Framework: Vitest
- 구조: describe > it (명확한 테스트명)
- 패턴: AAA (Arrange, Act, Assert)
- 파일명: [module-name].test.ts
- 위치: 소스 파일과 같은 디렉토리의 __tests__/

## 테스트 작성 체크리스트
1. Happy path: 정상 입력 → 기대 출력
2. Error case: 잘못된 입력 → Result.err 반환
3. Edge case: 빈 입력, null, undefined, 빈 배열
4. Boundary: 최솟값, 최댓값, 타임아웃

## Mock 규칙
- Redis: vi.mock으로 전체 mock
- Supabase: vi.mock으로 전체 mock
- Claude API: vi.mock으로 전체 mock
- fetch: vi.mock 또는 MSW 사용
- 타이머: vi.useFakeTimers()

## ContentForge 전용 테스트 패턴
- 수집기: 실제 API 호출 없이 fixture 데이터로 테스트
- 파이프라인: 입력 소재 → 변환 결과 스키마 검증
- 에이전트: 락 획득/해제 흐름 + 실행 로그 저장 검증
- 퍼블리셔: 채널 포맷 규격 준수 검증

## 학습된 테스트 패턴
<!-- 테스트하면서 발견된 유용한 패턴을 여기에 누적 -->
