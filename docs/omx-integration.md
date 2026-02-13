# oh-my-codex 통합 안내

## 개요
- `oh-my-codex`(OMX)는 OpenAI Codex CLI의 확장점(`AGENTS.md`, `~/.codex/prompts`, `~/.agents/skills`, `config.toml`)을 활용해 30개 역할 프롬프트, 39개 워크플로 스킬, 멀티 에이전트 파이프라인(autopilot, team, ralph 등), 상태/메모리 MCP 서버, 검증 루프를 얹는다. citeturn1view0

## 사전 조건
1. Node.js >= 20, 전역 `@openai/codex` 설치, OpenAI API 키가 필요하다. citeturn1view0
2. `npm install -g oh-my-codex`으로 OMX를 설치한다. citeturn1view0
3. `omx setup`을 실행해 Codex CLI 홈에 프롬프트(`~/.codex/prompts/*.md`), 스킬(`~/.agents/skills/*/SKILL.md`), MCP 서버/notify/feature 설정, `.omx/` 상태 저장소를 기록한다. citeturn1view0
4. `omx doctor`로 설치 상태와 사전 조건을 점검한다. citeturn1view0

## Content Forge와 맞추기
- Codex CLI 세션마다 OMX가 `AGENTS.md`를 읽어 오케스트레이터 역할을 하기 때문에 our repo의 `AGENTS.md`(ContentForge 팀 정의)와 `CLAUDE.md`를 지속 업데이트해 방향을 정확히 전달한다. citeturn1view0
- `AGENTS`이벤트 정의는 `docs/agent-roles.md`와 `organization-structure.md` 내용을 반영하여 OMX가 파이프라인을 적절히 루팅하도록 유지한다.
- 필요시 OMX의 `config.toml` `features`(`collab`, `child_agents_md`)과 `agent` 상태 서버(`omx_state`, `omx_memory`)를 Content Forge 운영 가이드에 맞게 커스터마이즈한다. citeturn1view0
- `.omx/` 노트패드/메모리 파일과 MCP 상태를 `docs/runbook/operations.md`에서 참조해 히스토리를 연결해 두면 OMX의 프로젝트 메모리와 우리의 ADR/Runbook이 동기화된다. citeturn1view0

## 실행 워크플로
1. 오케스트레이션 후속 명령은 Codex CLI 입력에서 `/prompts:<agent>` 형태로 호출한다. 예: `/prompts:architect`로 설계 검토, `/prompts:executor`로 코드 구현 등. citeturn1view0
2. `$autopilot`, `$ralph`, `$team`, `$ultrawork`, `$pipeline` 등의 스킬을 활용해 단일 또는 병렬 파이프라인을 실행하며, 각 스킬이 계획→작성→검증→수정 루프를 자동으로 순환한다. citeturn1view0
3. 마법 키워드(autopilot, team, ralph 등)를 입력한 뒤 `$skill`로 요약하면 자동 스킬이 활성화되며, `$note`에는 상태/증거를 저장한다. citeturn1view0
4. `$team 3:executor "<목표>"`처럼 팀 단위를 정의하고 `team-plan`→`team-prd`→`team-exec`→`team-verify`→`team-fix` 시퀀스를 활용해 고립된 파이프라인을 단일 세션에서 관리한다. citeturn1view0

## 운영 팁
- `omx-setup` 이후 자동으로 추가되는 HUD, 메모리, notify 모듈을 `docs/implementation-plan.md`나 `scripts/` 내 운영 스크립트와 연계해 상태를 수집한다. citeturn1view0
- `AGENTS.md`를 수정할 때는 OMX가 매 턴마다 읽으므로 `AGENTS.md`에 새로운 역할을 적을 때 반드시 `.omx/` plan/notes와 연계된 `AGENTS` entry도 함께 갱신한다. citeturn1view0
- 간단한 호출로 `$team 5:frontend-engineer "<작업>"`처럼 역할을 분리해 각 하위 에이전트를 해당 패키지(owner)로 매핑한다. Docs/ownership map과 일치시켜 `AGENTS.md`를 관리한다.
- `npm run omx:setup`은 설치 여부를 확인하고 `omx setup`을 실행해서 Codex 홈에 필요한 프롬프트/스킬/설정을 명시적으로 남긴다.

## 다음 단계 제안
1. `docs/agent-roles.md`를 OMX 스키마(collector/strategist/researcher 등)와 정합시켜 보강한다.
2. 주요 자동화 흐름을 `$pipeline`/`$team` 스킬로 재현하며 `docs/pipeline-specs.md`에 사례를 남긴다.
3. `scripts/`에 `omx` 명령을 감싸는 npm script(예: `npm run omx:setup`)을 추가해 개발자 경험을 단순화한다.
