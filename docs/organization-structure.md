# ContentForge 조직 구조 설계

## 문서 목적

ContentForge를 개발·운영하는 회사의 이상적인 조직 구조와 성장 로드맵을 정의합니다.
1인 운영에서 전문 조직으로 확장하기 위한 채용 우선순위와 팀 간 협업 구조를 제시합니다.

---

## 조직 구조도

### 스타트업 초기 단계 (~15명)

```
CEO / Founder
│
├─── Product & AI (5명)
│    ├── Head of Product (PM) ............................ [1]
│    ├── AI/ML Engineer (Agent & Pipeline) ............... [2]
│    ├── Full-stack Engineer (Platform Core) ............. [1]
│    └── Data Analyst (BML & Metrics) .................... [1]
│
├─── Engineering (5명)
│    ├── Tech Lead (Architecture) ........................ [1]
│    ├── Backend Engineer (API & Infra) .................. [2]
│    ├── Frontend Engineer (Editor & Dashboard) .......... [1]
│    └── DevOps Engineer (Infra & Monitoring) ............ [1]
│
├─── Content & Growth (3명)
│    ├── Content Strategist (Brand & Quality) ............ [1]
│    ├── Growth Marketer (채널 최적화) ................... [1]
│    └── Community Manager (사용자 피드백) ............... [1]
│
└─── Operations (2명)
     ├── Customer Success (Onboarding & Support) ......... [1]
     └── Business Operations (Legal, Finance, HR) ........ [1]
```

### 성장기 단계 (~30명)

```
CEO / Founder
│
├─── CTO (1)
│    │
│    ├─── Product & AI (9명)
│    │    ├── Head of Product ............................. [1]
│    │    ├── Product Manager (Core Platform) ............. [1]
│    │    ├── Product Manager (AI & Automation) ........... [1]
│    │    ├── AI/ML Engineer (Agent System) ............... [2]
│    │    ├── AI/ML Engineer (Pipeline & Rendering) ....... [2]
│    │    ├── Product Analyst (BML & Experiments) ......... [1]
│    │    └── UX Researcher (User Insights) ............... [1]
│    │
│    ├─── Platform Engineering (10명)
│    │    ├── Engineering Manager ......................... [1]
│    │    ├── Tech Lead (Backend) ......................... [1]
│    │    ├── Backend Engineer ............................ [4]
│    │    ├── Frontend Engineer ........................... [3]
│    │    └── DevOps Engineer ............................. [1]
│    │
│    └─── Quality & Security (3명)
│         ├── QA Engineer (Automation) .................... [2]
│         └── Security Engineer ........................... [1]
│
├─── Head of Growth & Content (1)
│    │
│    ├─── Content Strategy (3명)
│    │    ├── Content Strategist (Brand Voice) ............ [1]
│    │    ├── Content Ops Manager (Workflow) .............. [1]
│    │    └── Content QA Specialist ....................... [1]
│    │
│    └─── Marketing & Community (3명)
│         ├── Growth Marketing Manager .................... [1]
│         ├── Performance Marketer (채널 최적화) .......... [1]
│         └── Community Manager ........................... [1]
│
└─── Operations (4명)
     ├── Head of Operations ................................ [1]
     ├── Customer Success Manager .......................... [1]
     ├── Customer Success Specialist ....................... [1]
     └── Business Operations (Finance, Legal, HR) .......... [1]
```

### 안정기 단계 (~50명)

```
CEO / Founder
│
├─── CTO (1)
│    │
│    ├─── VP of Engineering (1)
│    │    │
│    │    ├─── Platform Engineering (12명)
│    │    │    ├── Engineering Manager (Backend) ........... [1]
│    │    │    ├── Tech Lead (Core Platform) ............... [1]
│    │    │    ├── Senior Backend Engineer ................. [2]
│    │    │    ├── Backend Engineer ........................ [4]
│    │    │    ├── Engineering Manager (Frontend) .......... [1]
│    │    │    ├── Senior Frontend Engineer ................ [1]
│    │    │    └── Frontend Engineer ....................... [2]
│    │    │
│    │    ├─── AI & ML Engineering (8명)
│    │    │    ├── AI Engineering Manager .................. [1]
│    │    │    ├── Senior AI/ML Engineer (Agents) .......... [2]
│    │    │    ├── AI/ML Engineer (Pipelines) .............. [2]
│    │    │    ├── ML Ops Engineer ......................... [1]
│    │    │    ├── Computer Vision Engineer (Video) ........ [1]
│    │    │    └── NLP Engineer (Text) ..................... [1]
│    │    │
│    │    ├─── Infrastructure & DevOps (6명)
│    │    │    ├── Infrastructure Manager .................. [1]
│    │    │    ├── Senior DevOps Engineer .................. [1]
│    │    │    ├── DevOps Engineer ......................... [2]
│    │    │    ├── Site Reliability Engineer (SRE) ......... [1]
│    │    │    └── Cloud Cost Engineer ..................... [1]
│    │    │
│    │    └─── Quality & Security (5명)
│    │         ├── QA Engineering Manager .................. [1]
│    │         ├── Senior QA Engineer (Automation) ......... [1]
│    │         ├── QA Engineer ............................. [2]
│    │         └── Security Engineer ....................... [1]
│    │
│    └─── VP of Product (1)
│         │
│         ├─── Product Management (6명)
│         │    ├── Senior Product Manager (Core) ........... [1]
│         │    ├── Product Manager (AI & Automation) ....... [1]
│         │    ├── Product Manager (Creator Tools) ......... [1]
│         │    ├── Product Manager (Publishing) ............ [1]
│         │    ├── Technical Product Manager (API) ......... [1]
│         │    └── Associate Product Manager ............... [1]
│         │
│         └─── Product Operations (4명)
│              ├── Product Ops Manager ..................... [1]
│              ├── Senior Product Analyst .................. [1]
│              ├── Product Analyst ......................... [1]
│              └── UX Researcher ........................... [1]
│
├─── VP of Growth & Content (1)
│    │
│    ├─── Content Operations (5명)
│    │    ├── Content Strategy Manager .................... [1]
│    │    ├── Senior Content Strategist ................... [1]
│    │    ├── Content Operations Manager .................. [1]
│    │    ├── Content QA Lead ............................. [1]
│    │    └── Content QA Specialist ....................... [1]
│    │
│    └─── Growth Marketing (4명)
│         ├── Growth Marketing Manager .................... [1]
│         ├── Performance Marketer (Paid) ................. [1]
│         ├── SEO/Content Marketer ........................ [1]
│         └── Community Manager ........................... [1]
│
└─── VP of Operations (1)
     │
     ├─── Customer Success (5명)
     │    ├── Customer Success Manager ..................... [1]
     │    ├── Senior CS Specialist (Enterprise) ............ [1]
     │    ├── CS Specialist ................................ [2]
     │    └── Technical Support Engineer ................... [1]
     │
     └─── Business Operations (3명)
          ├── Operations Manager ........................... [1]
          ├── Finance & Accounting ......................... [1]
          └── People Operations (HR) ....................... [1]
```

---

## 팀별 책임 범위

### Product & AI Team

#### Head of Product
**책임**
- 제품 비전 및 로드맵 수립
- 우선순위 결정 (사용자 가치 기반)
- PRD 작성 및 스펙 정의
- Cross-functional 조정 (Eng, Content, Growth)

**핵심 역량**
- AI/ML 제품 경험 (LLM 기반 서비스 우대)
- B2B SaaS 제품 전략 경험
- 데이터 기반 의사결정 (A/B 테스트, BML)
- 기술적 이해도 (AI 에이전트 아키텍처)

#### AI/ML Engineer (Agent & Pipeline)
**책임**
- 10개 AI 에이전트 설계 및 구현
- 6개 콘텐츠 파이프라인 개발
- Claude API 최적화 (프롬프트 엔지니어링)
- BML 피드백 루프 구현 (자기 진화 시스템)

**핵심 역량**
- LLM 프롬프트 엔지니어링 (Claude, GPT-4)
- Python/TypeScript + AI 프레임워크 (LangChain, AutoGen)
- 멀티 에이전트 시스템 설계 경험
- 콘텐츠 생성 AI 경험 (텍스트, 이미지, 영상)

#### Full-stack Engineer (Platform Core)
**책임**
- Turborepo 모노레포 아키텍처 유지
- Core 패키지 개발 (타입 시스템, Result 패턴)
- Supabase + Redis 연동
- n8n 워크플로우 통합

**핵심 역량**
- TypeScript + Node.js 전문성
- Monorepo 관리 (Turborepo, pnpm)
- PostgreSQL, Redis 실전 경험
- 함수형 프로그래밍 패턴

#### Data Analyst (BML & Metrics)
**책임**
- 16개 채널 성과 데이터 수집 자동화
- Grafana 대시보드 구축
- 주간/월간 BML 리포트 생성
- 실험 설계 및 통계 분석

**핵심 역량**
- SQL, Python (pandas, numpy)
- Grafana, Langfuse, Mixpanel
- A/B 테스트 설계 및 분석
- 콘텐츠 성과 지표 이해 (CTR, engagement, conversion)

---

### Engineering Team

#### Tech Lead (Architecture)
**책임**
- 전체 시스템 아키텍처 설계
- 기술 스택 선정 및 ADR 작성
- 코드 리뷰 및 품질 관리
- 성능 최적화 및 확장성 설계

**핵심 역량**
- 분산 시스템 아키텍처 (마이크로서비스, 이벤트 기반)
- 고가용성 설계 (Redis 락, 서킷 브레이커)
- TypeScript/Node.js 대규모 프로젝트 경험
- AI/ML 인프라 이해 (모델 서빙, GPU)

#### Backend Engineer (API & Infra)
**책임**
- REST/GraphQL API 개발
- Supabase 스키마 설계 및 마이그레이션
- Redis 기반 태스크 큐 및 락 시스템
- 외부 API 연동 (16개 채널 퍼블리셔)

**핵심 역량**
- Node.js + TypeScript
- PostgreSQL 스키마 설계 및 최적화
- Redis (Bull queue, Redlock)
- RESTful API 설계 (재시도, rate limit, 서킷 브레이커)

#### Frontend Engineer (Editor & Dashboard)
**책임**
- Vue 3 씬 기반 영상 에디터 개발
- 대시보드 UI (Style L 디자인 시스템)
- Remotion 프리뷰 인터페이스
- 실시간 렌더링 상태 표시

**핵심 역량**
- Vue 3 Composition API
- Tailwind CSS + 디자인 시스템
- Canvas/WebGL (영상 프리뷰)
- 복잡한 UI 상태 관리 (Pinia)

#### DevOps Engineer (Infra & Monitoring)
**책임**
- Docker Compose 인프라 관리
- CI/CD 파이프라인 (GitHub Actions)
- Grafana + Langfuse 모니터링
- Supabase, Redis, n8n 운영

**핵심 역량**
- Docker, Docker Compose
- CI/CD (GitHub Actions, GitLab CI)
- Grafana, Prometheus, Sentry
- AWS/GCP 또는 셀프호스트 인프라

---

### Content & Growth Team

#### Content Strategist (Brand & Quality)
**책임**
- 브랜드 바이블 작성 및 유지 (톤, 페르소나, 금기어)
- 에이전트 프롬프트 검수 (브랜드 일관성)
- 콘텐츠 품질 기준 정의
- 채널별 포맷 가이드라인 작성

**핵심 역량**
- 콘텐츠 전략 경험 (멀티채널 운영)
- 브랜드 보이스 정의 및 관리
- AI 생성 콘텐츠 품질 평가 능력
- 16개 채널 플랫폼 이해 (Medium, YouTube, X 등)

#### Growth Marketer (채널 최적화)
**책임**
- 16개 채널 성과 최적화 (A/B 테스트)
- SEO 전략 (키워드, 메타데이터)
- 발행 시간 최적화
- 채널별 알고리즘 이해 및 대응

**핵심 역량**
- Performance Marketing 경험
- 멀티채널 성과 분석 (GA, YouTube Analytics, LinkedIn Insights)
- SEO 전문성
- A/B 테스트 설계 및 실행

#### Community Manager (사용자 피드백)
**책임**
- 초기 사용자 온보딩
- 피드백 수집 및 정리
- 사용자 인터뷰 및 케이스 스터디
- 커뮤니티 운영 (Discord, Slack)

**핵심 역량**
- 커뮤니티 빌딩 경험
- 고객 인터뷰 및 인사이트 추출
- SaaS 고객 성공 사례 작성
- 공감 능력 및 커뮤니케이션

---

### Operations Team

#### Customer Success (Onboarding & Support)
**책임**
- 신규 사용자 온보딩
- 기술 지원 (버그 리포트, 사용법 안내)
- 사용자 성공 사례 수집
- 문서화 (튜토리얼, FAQ)

**핵심 역량**
- SaaS 고객 지원 경험
- 기술적 이해도 (AI, 워크플로우)
- 문서 작성 능력
- 고객 공감 능력

#### Business Operations (Legal, Finance, HR)
**책임**
- 법적 검토 (AI 저작권, 플랫폼 ToS)
- 재무 관리 (예산, 지출)
- 인사 관리 (채용, 온보딩)
- 계약 관리 (API 라이선스, 클라우드)

**핵심 역량**
- 스타트업 운영 경험
- 기본 법률 지식 (AI, 저작권)
- 재무 관리 능력
- 멀티태스킹

---

## 1인 → 팀 확장 채용 우선순위 로드맵

### Phase 1: 1인 → 3인 (MVP 출시 전)
**목표**: 텍스트 파이프라인 MVP 완성 (Medium, LinkedIn, X)

**채용 순서**
1. **AI/ML Engineer** — 에이전트 시스템 핵심 개발
2. **Full-stack Engineer** — 플랫폼 코어 + 인프라

**창업자 역할**
- Product Manager (전략, PRD)
- Tech Lead (아키텍처 결정)
- Content Strategist (브랜드 바이블)

---

### Phase 2: 3인 → 8인 (Beta 런칭)
**목표**: 6개 파이프라인 완성, 16개 채널 자동 발행

**채용 순서**
3. **Backend Engineer** — API + 퍼블리셔 확장
4. **DevOps Engineer** — 인프라 안정화, 모니터링
5. **Data Analyst** — BML 피드백 루프, 대시보드
6. **Frontend Engineer** — 영상 에디터 UI
7. **Content Strategist** — 브랜드 일관성 관리
8. **Customer Success** — 초기 사용자 온보딩

**창업자 역할 변화**
- Product Manager + CEO
- 채용, 투자 유치, 전략 집중

---

### Phase 3: 8인 → 15인 (Product-Market Fit)
**목표**: 사용자 확대, 품질 안정화

**채용 순서**
9. **AI/ML Engineer** (추가) — 에이전트 고도화
10. **Backend Engineer** (추가) — 확장성 대응
11. **Growth Marketer** — 채널 최적화
12. **Community Manager** — 사용자 커뮤니티
13. **QA Engineer** — 자동화 테스트
14. **Head of Product** — 제품 전략 전담
15. **Business Operations** — 운영 체계화

---

### Phase 4: 15인 → 30인 (스케일업)
**목표**: 조직 구조화, 엔터프라이즈 진입

**채용 전략**
- **Engineering 확장**: Backend 4명, Frontend 3명, QA 2명
- **AI/ML 팀 분리**: Agent 전담 2명, Pipeline 전담 2명, ML Ops 1명
- **Product 조직화**: PM 3명, Analyst 1명, UX Researcher 1명
- **Growth 팀 강화**: Performance Marketer, Content Ops Manager
- **Leadership 영입**: CTO, Head of Growth

---

### Phase 5: 30인 → 50인 (안정기)
**목표**: VP 레벨 리더십, 전문화된 팀

**채용 전략**
- **VP 레벨 영입**: VP of Engineering, VP of Product, VP of Operations
- **전문화**: Security, SRE, Cloud Cost, Technical PM
- **지역 확장 대비**: International Growth, Localization

---

## 팀 간 협업 구조

### 주간 협업 흐름

```
월요일
├── Product Sync (PM + Eng Lead + AI Lead) ........... 주간 우선순위
├── Sprint Planning (Eng Team) ....................... 이번 주 태스크
└── Content Strategy Meeting (PM + Content + Growth) . 콘텐츠 전략

화~목
├── Daily Standup (전체) ............................. 15분, 블로커 공유
├── Pair Programming (Eng) ........................... AI 에이전트, 복잡한 로직
└── Content Review (Content + AI Engineer) ........... 프롬프트 검수

금요일
├── Demo Day (전체) .................................. 이번 주 완성 기능 시연
├── Retrospective (Eng Team) ......................... 프로세스 개선
└── Weekly BML Review (PM + Analyst + Growth) ........ 성과 리뷰, 다음 주 실험
```

### 밀접한 협업 관계

| 팀 A | 팀 B | 협업 내용 | 빈도 |
|------|------|-----------|------|
| AI/ML Engineer | Content Strategist | 프롬프트 최적화, 브랜드 톤 적용 | 주 2~3회 |
| AI/ML Engineer | Backend Engineer | 에이전트 API 연동, Redis 큐 설계 | 매일 |
| Frontend Engineer | Product Manager | 에디터 UX, 피처 스펙 정의 | 주 2회 |
| Data Analyst | Growth Marketer | 성과 분석, A/B 테스트 설계 | 주 1회 |
| DevOps Engineer | Backend Engineer | 인프라 배포, 모니터링 알림 | 매일 |
| Customer Success | Product Manager | 사용자 피드백, 기능 요청 우선순위 | 주 1회 |
| Content Strategist | Growth Marketer | 채널별 콘텐츠 전략, SEO | 주 1회 |

---

## 핵심 역량 매트릭스

### 기술 역량

| 역할 | TypeScript | AI/ML | Infra | Frontend | Data | Content |
|------|-----------|-------|-------|----------|------|---------|
| AI/ML Engineer | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐ |
| Full-stack Engineer | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Backend Engineer | ⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐ |
| Frontend Engineer | ⭐⭐⭐ | ⭐ | ⭐ | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐ |
| DevOps Engineer | ⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐ |
| Data Analyst | ⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Content Strategist | ⭐ | ⭐⭐ | ⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Product Manager | ⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

⭐⭐⭐⭐⭐ = 필수 전문성
⭐⭐⭐ = 실전 경험 필요
⭐⭐ = 기본 이해도
⭐ = 선택적

---

## 조직 문화 및 운영 원칙

### 핵심 가치

1. **AI-First Mindset**
   - 모든 팀원이 AI를 도구로 활용 (Claude, GPT-4, Copilot)
   - "AI가 대체할 수 없는 인간의 가치"에 집중

2. **Build-Measure-Learn**
   - 모든 기능에 측정 지표 정의
   - 주간 BML 사이클 준수
   - 데이터 기반 의사결정

3. **Extreme Ownership**
   - 작은 팀, 큰 책임
   - 에이전트부터 퍼블리셔까지 end-to-end 소유

4. **Async-First Communication**
   - 문서 우선 (Notion, Linear, Slack)
   - 동기 회의 최소화 (주 3회 이내)
   - 타임존 무관 협업 (글로벌 확장 대비)

---

## 성장 단계별 KPI

### 스타트업 초기 (~15명)
- **Product**: MVP 출시, 초기 10명 사용자 확보
- **Engineering**: 99% 업타임, API 응답 < 500ms
- **Content**: 브랜드 바이블 완성, 채널별 가이드라인
- **Growth**: 주간 1명 신규 사용자, NPS > 50

### 성장기 (~30명)
- **Product**: Product-Market Fit 달성, 100명 활성 사용자
- **Engineering**: 99.9% 업타임, 16개 채널 발행 성공률 > 95%
- **AI**: 에이전트 품질 만족도 > 4.0/5.0
- **Growth**: 월간 20% 사용자 증가, Retention > 60%

### 안정기 (~50명)
- **Product**: 엔터프라이즈 고객 10개, ARR $1M+
- **Engineering**: 99.95% 업타임, 자동화율 > 90%
- **AI**: BML 피드백 루프 완전 자동화
- **Growth**: 월간 10% 안정적 성장, NPS > 70

---

## 채용 시 주의사항

### 반드시 검증할 것

1. **AI/ML Engineer**
   - 포트폴리오: LLM 기반 실제 제품 경험
   - 과제: Claude API로 멀티 에이전트 시스템 설계
   - 질문: "프롬프트 엔지니어링에서 가장 어려웠던 점은?"

2. **Backend Engineer**
   - 코딩 테스트: Result 패턴, 비동기 처리, 에러 핸들링
   - 질문: "Redis 분산 락을 어떻게 구현할 것인가?"
   - 경험: 대규모 API 서버 운영 (QPS 1000+)

3. **Frontend Engineer**
   - 포트폴리오: 복잡한 UI 상태 관리 경험
   - 과제: Vue 3 Composition API로 영상 타임라인 구현
   - 질문: "Canvas 기반 렌더링 최적화 경험은?"

4. **Content Strategist**
   - 포트폴리오: 멀티채널 콘텐츠 전략 사례
   - 과제: ContentForge 브랜드 바이블 초안 작성
   - 질문: "AI 생성 콘텐츠의 품질을 어떻게 평가하는가?"

### 초기 팀에 맞지 않는 프로필

- 대기업 프로세스에 익숙한 사람 (스타트업 속도 부적응)
- AI에 회의적이거나 기술 학습 의지 없는 사람
- 명확한 지시만 기다리는 수동적 성향
- 멀티태스킹 불가능한 사람 (초기 팀은 역할 중복 필수)

---

## 다음 단계 (이 문서 활용법)

1. **현재 단계 파악**: 1인 운영 → 3인 목표 (Phase 1)
2. **첫 채용 준비**: AI/ML Engineer JD 작성 (이 문서 참조)
3. **조직 문화 정의**: Notion에 "ContentForge Way" 문서 작성
4. **채용 파이프라인**: AngelList, LinkedIn, AI 커뮤니티에서 소싱
5. **온보딩 자료**: docs/architecture.md, CLAUDE.md 기반 온보딩 가이드

---

## 참조 문서

- `/home/bsh/develop/content-forge/ARCHITECTURE.md` — 기술 아키텍처
- `/home/bsh/develop/content-forge/docs/agent-roles.md` — 10개 AI 에이전트 정의
- `/home/bsh/develop/content-forge/docs/pipeline-specs.md` — 6개 파이프라인 스펙
- `/home/bsh/develop/content-forge/docs/channel-formats.md` — 16개 채널 포맷
- `/home/bsh/develop/content-forge/docs/implementation-plan.md` — 구현 로드맵

---

**문서 버전**: v1.0
**작성일**: 2026-02-12
**다음 리뷰**: 첫 채용 완료 후 (3인 팀 구성 시)
