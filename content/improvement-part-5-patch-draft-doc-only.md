# ContentForge 개선/고도화 제안 (Part 5)

## 목적
우선순위 1~2번(`channel-schema-unification`, `status-doc-autogen`)에 대해
**코드를 실제 수정하지 않고**, 구현자가 바로 작업할 수 있는 패치 초안을 문서로 제공한다.

## A. Patch Draft #1 — Channel Schema Unification

## 목표
TS 타입/DB enum/publisher 키를 단일 canonical schema로 정렬한다.

## 제안 파일 변경(초안)
- 신규: `packages/core/config/channels.json`
- 신규: `packages/core/src/channel-schema.ts`
- 수정: `packages/core/src/types.ts` (channel 타입 소스 통합)
- 신규: `docs/channel-schema-mapping.md`
- 신규(또는 수정): DB enum migration 파일

## `channels.json` 예시(초안)
```json
{
  "canonical": [
    "medium", "linkedin", "x-thread", "threads", "brunch", "newsletter",
    "blog", "kakao", "youtube", "shorts", "reels", "tiktok",
    "ig-carousel", "ig-single", "ig-story", "webtoon"
  ],
  "legacyAlias": {
    "x": "x-thread",
    "ig_carousel": "ig-carousel",
    "ig_single": "ig-single",
    "ig_story": "ig-story"
  }
}
```

## 구현 가이드
1. 런타임 입력(특히 DB/외부 API)은 alias를 canonical로 normalize
2. 내부 로직 타입은 canonical만 사용
3. 출력 직전(DB 저장 계층)에서 필요한 DB 표현으로 변환

## 테스트 초안
- unit: alias -> canonical normalize
- unit: canonical 외 채널 값 거부
- integration: publisher/analytics/guardian 경로에서 채널 변환 일관성 확인

## 완료 조건
- 코드베이스 내부의 채널 리터럴이 canonical로 통일
- DB enum 매핑 테이블이 문서와 1:1 일치

---

## B. Patch Draft #2 — Status Doc Auto Generation

## 목표
구현 상태 문서를 코드에서 자동 추출해 문서 드리프트를 방지한다.

## 제안 파일 변경(초안)
- 신규: `scripts/generate-status-doc.ts`
- 신규: `docs/implementation-status.md` (자동 생성 산출물)
- 수정: 루트 `package.json` scripts
- 수정: CI workflow 파일(문서 드리프트 검증)

## 스크립트 동작(초안)
- 입력 소스:
  - `packages/agents/src/index.ts` export 목록
  - `packages/pipelines/src/index.ts` export 목록
  - `packages/publishers/src/index.ts` export 목록
  - `packages/web/src` 실파일 유무
- 출력:
  - 구현됨/스캐폴딩/계획 항목 분류
  - 마지막 생성 시각 기록

## `package.json` 스크립트 추가안(초안)
```json
{
  "scripts": {
    "docs:status": "tsx scripts/generate-status-doc.ts",
    "docs:status:check": "pnpm docs:status && git diff --exit-code docs/implementation-status.md"
  }
}
```

## CI 체크 초안
1. `pnpm docs:status:check` 실행
2. 변경 발생 시 실패 처리 + "문서 갱신 필요" 메시지

## 완료 조건
- 구현 상태 문서를 수동 갱신하지 않아도 됨
- 실제 export 변경이 문서에 즉시 반영됨

---

## 작업자 전달 메모
- 이 문서는 "패치 초안"이며 현재 브랜치에 코드 적용은 하지 않음
- claude code 작업 충돌 방지를 위해, 실제 적용 시 feature branch 분리 권장

