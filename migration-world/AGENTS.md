# Development Agent Team

## Team Topology
```
                system-architect
                       |
      +----------------+----------------+
      |                |                |
backend-engineer  frontend-engineer  workflow-operator
      |                |                |
  ai-engineer      devops-engineer   domain-analyst
      |
 quality-engineer
```

## Agent Roles
- system-architect: 구조/경계/의사결정 검토
- backend-engineer: core/agents/collectors/pipelines/publishers/cli
- frontend-engineer: web UI/상호작용
- workflow-operator: 운영 시나리오/HITL 개입/실행 관리
- ai-engineer: prompt/LLM integration/schema validation
- devops-engineer: infra/CI-CD/observability
- domain-analyst: 도메인 정책/품질 기준/규정 해석
- quality-engineer: test strategy/e2e/contracts

## Ownership Map
- packages/core -> backend-engineer
- packages/agents -> backend-engineer + ai-engineer
- packages/collectors -> backend-engineer
- packages/pipelines -> backend-engineer + ai-engineer + domain-analyst
- packages/publishers -> backend-engineer + workflow-operator
- packages/analytics -> ai-engineer + domain-analyst
- packages/video -> frontend-engineer (optional)
- packages/web -> frontend-engineer + workflow-operator
- infra/ -> devops-engineer
- docs/ -> system-architect + domain-analyst
