# ContentForge Infrastructure

This directory contains the infrastructure setup for ContentForge.

## Services

- **PostgreSQL 15** (Supabase-compatible): Main database
- **Redis 7**: Task queue and distributed lock manager
- **n8n**: Workflow automation and orchestration

## Quick Start

### 1. Copy environment file

```bash
cp ../.env.example ../.env
# Edit .env with your actual values
```

### 2. Start all services

```bash
cd infra
docker-compose up -d
```

### 3. Verify services are running

```bash
docker-compose ps
```

All services should show as "healthy" or "Up".

### 4. Access the services

- **PostgreSQL**: localhost:54322 (user: postgres, password: postgres)
- **Redis**: localhost:6379
- **n8n**: http://localhost:5678 (user: admin, password: changeme)

## Database Migrations

Migrations are automatically applied when the database starts for the first time.

To manually run migrations:

```bash
# Using psql
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/migrations/001_initial.sql

# Or connect and run
docker-compose exec postgres psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/001_initial.sql
```

## Database Schema

The initial schema includes:

- **materials**: Collected raw content from various sources (with score 1-10, tags, status enum)
- **contents**: Transformed content for each channel (with channel enum, format, status enum)
- **tasks**: Agent task execution records (with task_type enum, task_status enum)
- **publications**: Publication records to external channels
- **metrics**: Performance metrics for published content

All tables use TIMESTAMPTZ for timestamps and include proper indexes on status columns and foreign keys.

## Stopping Services

```bash
docker-compose down
```

To remove volumes (WARNING: this deletes all data):

```bash
docker-compose down -v
```

## Development

### Viewing logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f n8n
```

### Restarting a service

```bash
docker-compose restart postgres
```

### Rebuilding services

```bash
docker-compose up -d --build
```

## Production Deployment

For production deployment:

1. Change all default passwords in `.env`
2. Update JWT secrets and encryption keys
3. Configure proper storage backend (S3/R2)
4. Set up SSL/TLS certificates
5. Configure proper backup strategy
6. Enable monitoring and alerting

## Troubleshooting

### Port conflicts

If ports 54322, 6379, or 5678 are already in use, modify the port mappings in `docker-compose.yml`.

### Database connection issues

Check if PostgreSQL is healthy:

```bash
docker-compose exec postgres pg_isready -U postgres
```

### Redis connection issues

Check if Redis is running:

```bash
docker-compose exec redis redis-cli ping
```

Should return `PONG`.

## Backup and Restore

### PostgreSQL backup

```bash
docker-compose exec postgres pg_dump -U postgres postgres > backup.sql
```

### PostgreSQL restore

```bash
cat backup.sql | docker-compose exec -T postgres psql -U postgres postgres
```

### Redis backup

Redis is configured with AOF (Append Only File) persistence, which automatically saves data to disk.

## CI/CD Pipeline

ContentForge uses GitHub Actions for continuous integration and a self-hosted runner for deployment.

### Pipeline Flow

```
PR / push to main
  └─ CI (.github/workflows/ci.yml)
       ├─ pnpm install (cached)
       ├─ lint + typecheck (parallel)
       ├─ build
       └─ test
            └─ (on main, CI success) Deploy (.github/workflows/deploy.yml)
                 ├─ checkout + install + build
                 ├─ docker compose up -d
                 ├─ health checks (PostgreSQL, Redis)
                 └─ rollback on failure
```

### Self-Hosted Runner Setup

The CD workflow runs on a self-hosted runner (your local machine).

1. Create a GitHub PAT with `repo` scope
2. Run the setup script:

```bash
GITHUB_TOKEN=ghp_xxxx bash scripts/setup-runner.sh OWNER/content-forge
```

3. Verify the runner is online: **GitHub > Settings > Actions > Runners**

The script installs the runner to `~/actions-runner` and registers a `actions-runner.service` systemd unit that starts on boot.

#### Runner Management

```bash
# Check status
sudo systemctl status actions-runner

# View logs
journalctl -u actions-runner -f

# Restart
sudo systemctl restart actions-runner
```

### Manual Deploy

To deploy without GitHub Actions:

```bash
bash scripts/deploy.sh
```

The script builds the project, restarts Docker services, and runs health checks. On failure it rolls back to the previous commit.

### Troubleshooting CI/CD

**CI lint/typecheck fails**: Run `pnpm lint` and `pnpm exec tsc --build --noEmit` locally to reproduce.

**Deploy health check timeout**: Check Docker service status with `docker compose -f infra/docker-compose.yml ps`. Ensure ports 54322 (PostgreSQL) and 6379 (Redis) are not blocked.

**Runner offline**: Check `sudo systemctl status actions-runner`. Re-register if the token expired by re-running `scripts/setup-runner.sh`.

---

## Environment Variables

See `.env.example` for all available environment variables and their descriptions.

Key variables:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `ANTHROPIC_API_KEY`: Claude API key
- `N8N_BASIC_AUTH_USER/PASSWORD`: n8n login credentials
