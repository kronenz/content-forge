---
name: code-review
description: PR 코드 리뷰를 수행할 때 이 Skill을 참조합니다
---

# Code Review Skill

## 리뷰 체크리스트

### 타입 안전성
- any 타입 사용 여부
- as 타입 캐스팅 남용 여부
- Result<T, E> 패턴 준수 (throw 대신 Result 반환)

### 에러 처리
- Result 패턴으로 에러 전파
- unwrap()이 테스트/CLI 외부에서 사용되지 않는지
- 외부 API 호출에 재시도 + 서킷 브레이커 적용 여부

### 테스트
- 변경된 코드에 대한 테스트 존재 여부
- AAA 패턴 (Arrange, Act, Assert) 준수
- 외부 의존성 mock 처리 여부
- 최소 4개 테스트 (happy path, error case, edge case, boundary)

### 성능
- N+1 쿼리 여부
- 불필요한 동기 블로킹 여부
- 대용량 데이터 스트리밍 처리 여부

### 보안
- 하드코딩된 시크릿 여부
- SQL injection 가능성
- 외부 입력 새니타이징 여부

### ContentForge 전용
- 채널 참조 canonical 형식 사용 여부
- normalizeChannel() 적용 여부
- Claude API 응답 Zod 스키마 검증 여부
- AI 스멜 단어 사용 여부 ("~적", "~화", "다양한")

## 리뷰 출력 형식
- PASS: 통과 항목
- WARN: 개선 권장 항목 (설명 포함)
- FAIL: 수정 필수 항목 (이유 + 제안)

## 학습된 리뷰 패턴
<!-- 리뷰하면서 발견된 반복 이슈를 여기에 누적 -->
