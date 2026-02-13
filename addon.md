현재 진행 중인 프로젝트들의 구체적인 구조를 먼저 확인해보겠습니다.이제 프로젝트 구조와 이전 대화 맥락을 충분히 파악했습니다. 현재 진행 중인 프로젝트(AI Agent World, ContentForge, Eterna)에 자기개선 방법론을 반영하는 실전 프롬프트 가이드를 작성하겠습니다.

---

# 자기개선 방법론을 프로젝트에 반영하는 프롬프팅 가이드

이 가이드는 앞서 설명한 Claude Code의 자기개선 메커니즘(Antfooding, CLAUDE.md 자기학습, Agent Skills, Context Engineering)을 실제 프로젝트에 적용하는 **구체적인 프롬프트와 파일 구조**입니다.

---

## 1단계: 자기개선 인프라 구축 — CLAUDE.md에 학습 시스템 내장

기존 CLAUDE.md에 다음 섹션을 추가합니다. 이것이 AI가 스스로 학습하는 토대가 됩니다.

### 루트 CLAUDE.md에 추가할 섹션

```markdown
# ═══════════════════════════════════════════════
# 자기개선 시스템 (Self-Improvement System)
# ═══════════════════════════════════════════════

## 세션 시작 프로토콜
1. 이 CLAUDE.md 전체를 읽는다
2. docs/implementation-plan.md에서 현재 진행 상태 확인
3. docs/learnings.md에서 최근 학습 내용 확인
4. .omc/notepad.md에서 마지막 세션 컨텍스트 확인

## 세션 종료 프로토콜
매 작업 세션이 끝날 때 반드시 다음을 수행한다:
1. docs/learnings.md에 세션 일기 추가:
   - 날짜, 작업 내용
   - 무엇을 시도했는지
   - 무엇이 잘 됐는지
   - 무엇이 안 됐는지 (실패 원인 분석)
   - 다음에 다르게 할 것
2. 반복된 실수가 있으면 이 CLAUDE.md의 "금지 사항"에 추가
3. docs/implementation-plan.md 체크박스 업데이트

## 학습된 금지 사항 (자동 누적)
<!-- 아래는 작업 중 발견된 실수 패턴입니다. 절대 반복하지 마세요. -->
- (아직 없음 — 작업하면서 여기에 누적됩니다)

## 학습된 모범 사례 (자동 누적)
<!-- 아래는 작업 중 잘 작동한 패턴입니다. 적극 재사용하세요. -->
- (아직 없음 — 작업하면서 여기에 누적됩니다)
```

---

## 2단계: docs/learnings.md — AI의 "일기장" 생성

이 파일이 Anthropic 엔지니어들이 쓰는 "일기 쓰기" 패턴의 구현입니다.

```markdown
# 프로젝트 학습 기록 (AI Session Diary)

> 이 파일은 AI 에이전트의 학습 기록입니다.
> 매 세션 종료 시 자동으로 업데이트됩니다.
> 새 세션 시작 시 최근 5개 항목을 읽고 시작합니다.

---

## 세션 기록

(세션이 완료될 때마다 아래 형식으로 추가)

### [날짜] — [작업 제목]
- **작업 내용**: 
- **성공한 것**: 
- **실패한 것**: 
- **원인 분석**: 
- **다음에 다르게 할 것**: 
- **CLAUDE.md 업데이트 필요 여부**: Yes/No
  - 업데이트 내용: 
```

---

## 3단계: Custom Skills 폴더 생성

프로젝트별 반복 작업을 Skills로 만들면 AI가 해당 도메인에서 점점 더 정확해집니다.

### 디렉토리 구조

```
skills/
├── review/
│   └── SKILL.md       ← PR 리뷰 체크리스트
├── deploy/
│   └── SKILL.md       ← 배포 전 검증 절차
├── test/
│   └── SKILL.md       ← 테스트 전략 및 패턴
├── content-pipeline/
│   └── SKILL.md       ← ContentForge 전용: 콘텐츠 파이프라인 실행
└── agent-debug/
    └── SKILL.md       ← AI Agent World 전용: 에이전트 디버깅 방법
```

### 예시: skills/review/SKILL.md

```markdown
---
name: code-review
description: PR 코드 리뷰를 수행할 때 이 Skill을 참조합니다
---

# Code Review Skill

## 리뷰 체크리스트
1. 타입 안전성: any 타입 사용 여부 확인
2. 에러 처리: Result 패턴 준수 여부
3. 테스트: 변경된 코드에 대한 테스트 존재 여부
4. 성능: N+1 쿼리, 불필요한 re-render 확인
5. 보안: 하드코딩된 시크릿, SQL injection 가능성

## 리뷰 출력 형식
- ✅ 통과 항목
- ⚠️ 개선 권장 항목 (설명 포함)
- ❌ 수정 필수 항목 (이유 + 제안)

## 학습된 리뷰 패턴
<!-- 리뷰하면서 발견된 반복 이슈를 여기에 누적 -->
- (아직 없음)
```

---

## 4단계: 자기개선이 작동하는 실전 프롬프트

### 4-1. 프로젝트 부트스트랩 (최초 1회)

```
프로젝트에 자기개선 시스템을 셋업해.

1. docs/learnings.md 파일 생성 (세션 일기 기록용)
2. skills/ 폴더에 review, test, deploy SKILL.md 생성
3. CLAUDE.md에 "자기개선 시스템" 섹션 추가:
   - 세션 시작 프로토콜 (learnings.md 확인)
   - 세션 종료 프로토콜 (일기 작성 + 체크박스 업데이트)
   - 학습된 금지 사항 (빈 리스트, 작업하면서 누적)
   - 학습된 모범 사례 (빈 리스트, 작업하면서 누적)
4. .claude/commands/에 커스텀 명령어 생성:
   - session-start.md: learnings.md 최근 5개 + 현재 진행 상태 확인
   - session-end.md: 일기 작성 + CLAUDE.md 업데이트 + 체크박스 마킹
   - learn.md: 현재 세션에서 배운 것을 learnings.md에 추가
```

### 4-2. 매일 작업 시작 프롬프트

```
/session-start

(또는 커스텀 명령어가 없을 때)

@docs/learnings.md 최근 5개 세션 기록을 확인하고,
@docs/implementation-plan.md에서 현재 진행 상태를 파악해.
그리고 다음 미완료 태스크를 알려줘.

특히 최근 세션에서 실패한 패턴이 있으면 
이번 작업에서 같은 실수를 반복하지 않도록 주의해.
```

### 4-3. 작업 실행 + 학습 루프 프롬프트 (OMC 사용 시)

```
autopilot: Phase 1.3 수집기 구현을 계속 진행해.
@docs/implementation-plan.md에서 미완료 태스크 확인하고 순서대로.

작업 규칙:
1. 각 태스크 완료 시 implementation-plan.md 체크박스 업데이트
2. 예상과 다른 동작이 발생하면 docs/learnings.md에 기록
3. 새로운 패턴을 발견하면 CLAUDE.md의 "학습된 모범 사례"에 추가
4. 실수를 발견하면 CLAUDE.md의 "학습된 금지 사항"에 추가
```

### 4-4. 작업 종료 프롬프트

```
/session-end

(또는 커스텀 명령어가 없을 때)

이번 세션을 마무리해.
1. docs/learnings.md에 세션 일기를 작성해:
   - 오늘 무엇을 작업했는지
   - 무엇이 잘 됐는지
   - 무엇이 안 됐는지, 왜 안 됐는지
   - 다음 세션에서 다르게 할 것
2. CLAUDE.md 업데이트가 필요하면 수행해:
   - 반복된 실수 → "학습된 금지 사항"에 추가
   - 잘 작동한 패턴 → "학습된 모범 사례"에 추가
3. docs/implementation-plan.md 체크박스 최종 업데이트
4. 다음 세션에서 이어서 할 작업을 한 줄로 요약해서 
   .omc/notepad.md에 기록
```

### 4-5. PR 리뷰 피드백 → CLAUDE.md 환류 프롬프트

사람이 PR 리뷰에서 피드백을 줬을 때, 그 피드백을 시스템에 반영하는 프롬프트입니다.

```
PR #{번호}에서 다음 리뷰 피드백을 받았어:
"(리뷰 내용을 여기에 붙여넣기)"

이 피드백을 시스템에 반영해:
1. 해당 코드를 수정해
2. 이런 유형의 실수를 다시 하지 않도록 
   CLAUDE.md의 "학습된 금지 사항"에 규칙 추가
3. skills/review/SKILL.md의 체크리스트에도 
   이 항목을 추가해서 다음 리뷰 시 자동 검출
4. docs/learnings.md에 이 피드백과 학습 내용 기록
```

### 4-6. 주간 회고 프롬프트

```
이번 주 작업을 회고해.

1. @docs/learnings.md에서 이번 주 세션 기록 모두 읽어
2. 반복된 패턴을 분석해:
   - 가장 많이 반복된 실수 Top 3
   - 가장 효과적이었던 접근법 Top 3
3. CLAUDE.md를 정제해:
   - "학습된 금지 사항"에서 중복 제거, 우선순위 정리
   - "학습된 모범 사례"에서 핵심만 남기기
4. skills/ 폴더에 새 Skill이 필요한 영역이 있으면 제안해
5. 다음 주 작업 우선순위를 docs/implementation-plan.md 
   기준으로 정리해
```

---

## 5단계: 커스텀 슬래시 명령어 파일

### .claude/commands/session-start.md

```markdown
@docs/learnings.md의 최근 5개 세션 기록을 읽고,
@docs/implementation-plan.md에서 현재 진행 상태를 확인해.

다음을 알려줘:
1. 최근 세션에서 배운 핵심 교훈 (한 줄씩)
2. 현재 Phase와 진행률
3. 다음으로 할 미완료 태스크 (최대 3개)
4. 주의할 금지 사항 (CLAUDE.md의 학습된 금지 사항 중 관련된 것)
```

### .claude/commands/session-end.md

```markdown
이번 세션을 마무리합니다. 다음을 순서대로 수행하세요:

1. docs/learnings.md에 세션 일기 추가:
   날짜: (오늘 날짜)
   작업 내용: (이번 세션에서 한 것 요약)
   성공한 것: (잘 된 것)
   실패한 것: (안 된 것 + 원인)
   다음에 다르게 할 것: (개선 방향)

2. CLAUDE.md 업데이트 (해당 시):
   - 반복 실수 → "학습된 금지 사항" 추가
   - 좋은 패턴 → "학습된 모범 사례" 추가

3. docs/implementation-plan.md 체크박스 업데이트

4. 다음 세션 이어갈 내용을 한 줄로 요약
```

### .claude/commands/learn.md

```markdown
이번 작업에서 중요한 학습이 발생했습니다.
다음 내용을 docs/learnings.md에 추가하세요:

$ARGUMENTS

그리고 이 학습이 CLAUDE.md의 금지 사항이나 모범 사례에 
추가되어야 하는지 판단하고, 필요하면 업데이트하세요.
```

---

## 6단계: 프로젝트별 맞춤 적용

### AI Agent World 프로젝트

```markdown
## CLAUDE.md 추가 학습 규칙 (AI Agent World 전용)

### 학습된 금지 사항
- LLM 호출을 감정/관계 계산에 사용하지 말 것 (코드 로직으로 처리, LLM 10% 원칙)
- (작업하면서 누적)

### 학습된 모범 사례
- 에이전트 행동 테스트 시 24시간 시뮬레이션 돌려서 분포 확인
- (작업하면서 누적)

### Custom Skills 필요 목록
- skills/agent-behavior/ → 에이전트 행동 로직 디버깅 절차
- skills/llm-cost/ → LLM 비용 최적화 점검 체크리스트
- skills/broadcast/ → OBS + YouTube 연동 트러블슈팅
```

### ContentForge 프로젝트

```markdown
## CLAUDE.md 추가 학습 규칙 (ContentForge 전용)

### 학습된 금지 사항
- AI 생성 텍스트에 "~적", "~화", "다양한" 같은 AI 스멜 단어 사용 금지
- 수집기에서 rate limit 처리 없이 API 호출하지 말 것
- (작업하면서 누적)

### 학습된 모범 사례
- 콘텐츠 파이프라인 테스트 시 실제 소재 3개로 E2E 확인
- (작업하면서 누적)

### Custom Skills 필요 목록
- skills/content-pipeline/ → 콘텐츠 변환 파이프라인 실행 절차
- skills/humanize/ → AI 냄새 제거 체크리스트
- skills/publish/ → 16개 채널 발행 전 검증 절차
```

---

## 7단계: GitHub Actions 연동 — 자동화된 지식 환류

PR이 머지될 때 자동으로 학습 기록을 트리거하는 GitHub Actions를 설정합니다.

```yaml
# .github/workflows/knowledge-feedback.yml
name: Knowledge Feedback Loop

on:
  pull_request_review:
    types: [submitted]
  pull_request:
    types: [closed]

jobs:
  track-feedback:
    if: github.event.review.state == 'changes_requested'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Log Review Feedback
        run: |
          echo "## PR #${{ github.event.pull_request.number }} — 변경 요청" >> docs/review-feedback-log.md
          echo "- 날짜: $(date +%Y-%m-%d)" >> docs/review-feedback-log.md
          echo "- 리뷰어: ${{ github.event.review.user.login }}" >> docs/review-feedback-log.md
          echo "- 내용: ${{ github.event.review.body }}" >> docs/review-feedback-log.md
          echo "---" >> docs/review-feedback-log.md
      - name: Commit Log
        run: |
          git config user.name "knowledge-bot"
          git config user.email "bot@team.dev"
          git add docs/review-feedback-log.md
          git commit -m "docs: PR 리뷰 피드백 기록 (#${{ github.event.pull_request.number }})"
          git push
```

이렇게 하면 사람의 PR 리뷰 피드백이 자동으로 `docs/review-feedback-log.md`에 누적되고, 다음 세션에서 AI가 이 파일을 참조하여 같은 실수를 반복하지 않게 됩니다.

---

## 핵심 원리 요약

전체 시스템이 작동하는 흐름을 한 눈에 보면 이렇습니다:

```
세션 시작
  ├── CLAUDE.md 읽기 (금지 사항 + 모범 사례 확인)
  ├── docs/learnings.md 확인 (최근 학습 내용)
  ├── docs/implementation-plan.md 확인 (어디까지 했는지)
  └── skills/ 필요 시 로딩
      ↓
작업 수행
  ├── 코드 구현
  ├── 실수 발견 → 즉시 CLAUDE.md 금지 사항에 추가
  ├── 좋은 패턴 → 즉시 CLAUDE.md 모범 사례에 추가
  └── 체크박스 업데이트
      ↓
세션 종료 (/session-end)
  ├── docs/learnings.md에 일기 작성
  ├── CLAUDE.md 정제
  └── 다음 작업 요약
      ↓
PR 생성 → 사람 리뷰
  ├── 승인 → 머지
  └── 변경 요청 → AI 재작업
      + 피드백을 CLAUDE.md에 반영
      + skills/ 체크리스트에 항목 추가
      ↓
주간 회고
  ├── 반복 패턴 분석
  ├── CLAUDE.md 대청소
  ├── skills/ 신규 생성/개선
  └── 다음 주 우선순위 정리
```

**이 루프가 돌 때마다 CLAUDE.md가 점점 더 정교해지고, AI의 실수율이 측정 가능하게 떨어지며, 프로젝트가 진행될수록 AI가 더 정확해집니다.** 이것이 앞서 설명한 Claude Code의 자기개선 메커니즘을 우리 팀 규모에 맞게 구현한 것입니다.