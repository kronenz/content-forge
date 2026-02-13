# ContentForge 에이전트 모듈

## 규칙
- 모든 에이전트는 BaseAgent 클래스를 상속
- 에이전트 인터페이스: execute(task: Task) → Promise<Result<TaskOutput, AgentError>>
- 락 획득/해제는 BaseAgent가 자동 처리
- 각 에이전트는 자신의 역할만 수행 (단일 책임)
- 로깅: structured JSON (agent_id, task_id, action, result)

## 에이전트 역할 상세
@docs/agent-roles.md 참조

## 테스트
- 각 에이전트마다 [agent-name].test.ts 필수
- mock: Redis, Supabase, Claude API

## 코드 품질 원칙
- task.input은 에이전트별 Zod 스키마로 검증 필수 (as unknown as ... 패턴 지양)
- Lock/Queue는 인터페이스 추상화 사용 (InMemory: dev, Redis: prod)

## 향후 구조 개선 (TODO)
- src/ 하위 디렉토리 분리: runtime/ (queue, lock, base), roles/ (writer, strategist, ...), contracts/ (task/result DTO), policies/ (채널 제한, 검증 규칙)
- "실행 인프라"와 "비즈니스 역할" 경계 강제
