# 프로젝트 학습 기록 (AI Session Diary)

> 이 파일은 AI 에이전트의 학습 기록입니다.
> 매 세션 종료 시 자동으로 업데이트됩니다.
> 새 세션 시작 시 최근 5개 항목을 읽고 시작합니다.

---

## 세션 기록

### 2026-02-13 — 자기개선 시스템 구축 + 전체 Lint 수정
- **작업 내용**: (1) 자기개선 시스템 인프라 구축 (learnings.md, skills/ 6개, 커스텀 명령어 4개, GitHub Actions, CLAUDE.md 자기개선 섹션) (2) 전체 12개 패키지 ESLint 에러 ~120개 수정 (3) 빌드 타입 에러 수정
- **성공한 것**: Build 12/12, Lint 12/12, Test 24/24 전부 통과. 자기개선 시스템 파일 구조 완성.
- **실패한 것**: build-fixer 에이전트가 async 제거 시 모든 return 경로에 Promise.resolve()를 감싸지 않아 추가 수정 필요했음. .eslintignore가 패키지별 CWD에서 읽히지 않아 .eslintrc.cjs의 ignorePatterns로 이동 필요.
- **원인 분석**: (1) async 인터페이스 구현체에서 async 제거 시 Ok() 경로만 Promise.resolve()로 감싸고 Err() 경로를 누락하는 패턴 (2) turbo가 각 패키지 디렉토리에서 lint를 실행하므로 루트 .eslintignore가 적용되지 않음
- **다음에 다르게 할 것**: async 제거 시 모든 return 경로(Ok + Err + catch)를 함께 확인. 또는 인터페이스 구현체는 async를 유지하고 `await Promise.resolve()` 한 줄 추가하는 방식이 더 안전.
- **CLAUDE.md 업데이트 필요 여부**: Yes
  - "학습된 금지 사항": async 인터페이스 구현체에서 async 제거 시 주의사항 추가
  - "학습된 모범 사례": eslint ignorePatterns는 .eslintrc.cjs에 넣어야 모노레포 전체 적용됨
