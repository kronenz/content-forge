# ContentForge Development Agent Team

## Team Structure (Development Phase)

```
                    content-architect (System Architect)
                           |
          +----------------+----------------+
          |                |                |
   backend-engineer  video-engineer  frontend-engineer
          |                |                |
   ai-engineer      devops-engineer  content-strategist
          |
   pipeline-tester
```

## Agent Roster (8 agents)

### Architecture & Quality

| Agent | Role | Scope | Tools |
|-------|------|-------|-------|
| content-architect | System Architect | Package boundaries, data flow, design decisions | Read-only |
| pipeline-tester | Test Specialist | Unit/integration/E2E tests, CI validation | Read + Write + Bash |

### Implementation

| Agent | Role | Scope | Tools |
|-------|------|-------|-------|
| backend-engineer | Backend Engineer | core, agents, collectors, pipelines, publishers, analytics, humanizer, cli | Read + Write + Bash |
| video-engineer | Video Engineer | video (Remotion scenes, avatar, visual providers, SVG security) | Read + Write + Bash |
| frontend-engineer | Frontend Engineer | web (Vue 3 editor, Style L design, components, stores) | Read + Write + Bash |
| ai-engineer | AI/ML Engineer | Claude API, prompts, BML loops, Zod validation, TTS | Read + Write + Bash |

### Operations & Strategy

| Agent | Role | Scope | Tools |
|-------|------|-------|-------|
| devops-engineer | DevOps Engineer | Docker, CI/CD, n8n workflows, Supabase, monitoring | Read + Write + Bash |
| content-strategist | Content Strategist | Channel specs, brand voice, quality standards, A/B testing | Read-only |

## Package Ownership

```
packages/core        -> backend-engineer (shared types, Result, channel schema)
packages/agents      -> backend-engineer + ai-engineer (agent logic + prompts)
packages/collectors  -> backend-engineer (8 source collectors)
packages/pipelines   -> backend-engineer + ai-engineer (6 pipelines + Claude integration)
packages/publishers  -> backend-engineer (16 channel adapters)
packages/analytics   -> ai-engineer (BML loops, A/B testing, reports)
packages/humanizer   -> ai-engineer (style learning, AI smell removal)
packages/video       -> video-engineer (Remotion, avatar, visual providers)
packages/web         -> frontend-engineer (Vue 3 editor, dashboard)
packages/cli         -> backend-engineer (CLI wrapper)
infra/               -> devops-engineer (Docker, Supabase migrations)
n8n/                 -> devops-engineer (workflow definitions)
docs/                -> content-strategist + content-architect
```

## Collaboration Patterns

### New Feature Flow
1. **content-strategist** defines channel requirements and quality criteria
2. **content-architect** reviews design, validates patterns
3. **backend-engineer** / **video-engineer** / **frontend-engineer** implement
4. **ai-engineer** handles Claude API integration and prompt engineering
5. **pipeline-tester** writes tests and validates E2E flow
6. **devops-engineer** updates CI/CD and infrastructure

### Code Review Flow
1. **content-architect** reviews architecture and pattern compliance
2. Domain-specific engineer reviews implementation detail
3. **pipeline-tester** validates test coverage

### Cross-Cutting Concerns
- **Channel schema changes**: content-architect + backend-engineer + content-strategist
- **Claude API changes**: ai-engineer + backend-engineer
- **SVG security**: video-engineer + content-architect
- **Design system changes**: frontend-engineer + content-strategist
- **Infrastructure changes**: devops-engineer + content-architect

## Agent Definition Files

All agent definitions are in `.claude/agents/`:
- `content-architect.md` - System architecture reviewer
- `pipeline-tester.md` - Test specialist
- `backend-engineer.md` - Backend implementation
- `video-engineer.md` - Video/multimedia pipeline
- `frontend-engineer.md` - Vue 3 editor frontend
- `ai-engineer.md` - AI/ML and prompt engineering
- `devops-engineer.md` - Infrastructure and CI/CD
- `content-strategist.md` - Content strategy and quality
