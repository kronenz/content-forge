#!/usr/bin/env bash
# ContentForge Deploy Script
# Called by GitHub Actions CD workflow on self-hosted runner.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/infra/docker-compose.yml"
HEALTH_TIMEOUT=30
HEALTH_INTERVAL=3

log() { echo "[deploy] $(date '+%H:%M:%S') $*"; }
err() { echo "[deploy] ERROR: $*" >&2; }

# ── Save rollback point ────────────────────────────────────────────
PREV_COMMIT=$(git -C "$REPO_ROOT" rev-parse HEAD~1 2>/dev/null || true)

rollback() {
  err "Deployment failed — rolling back to $PREV_COMMIT"
  if [ -n "$PREV_COMMIT" ]; then
    git -C "$REPO_ROOT" checkout "$PREV_COMMIT" -- .
    pnpm install --frozen-lockfile --dir "$REPO_ROOT"
    pnpm --dir "$REPO_ROOT" build
    docker compose -f "$COMPOSE_FILE" up -d
    log "Rollback complete"
  else
    err "No previous commit to rollback to"
  fi
  exit 1
}

# ── 1. Install & Build ─────────────────────────────────────────────
log "Installing dependencies..."
pnpm install --frozen-lockfile --dir "$REPO_ROOT"

log "Building packages..."
pnpm --dir "$REPO_ROOT" build

# ── 2. Restart infrastructure ──────────────────────────────────────
log "Restarting Docker services..."
docker compose -f "$COMPOSE_FILE" up -d

# ── 3. Health checks ──────────────────────────────────────────────
log "Running health checks (timeout: ${HEALTH_TIMEOUT}s)..."

check_postgres() {
  docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres >/dev/null 2>&1
}

check_redis() {
  docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping 2>/dev/null | grep -q PONG
}

elapsed=0
all_healthy=false

while [ "$elapsed" -lt "$HEALTH_TIMEOUT" ]; do
  pg_ok=false; redis_ok=false

  check_postgres && pg_ok=true
  check_redis && redis_ok=true

  if $pg_ok && $redis_ok; then
    all_healthy=true
    break
  fi

  sleep "$HEALTH_INTERVAL"
  elapsed=$((elapsed + HEALTH_INTERVAL))
  log "Waiting... (${elapsed}s) pg=$pg_ok redis=$redis_ok"
done

if ! $all_healthy; then
  err "Health checks failed after ${HEALTH_TIMEOUT}s"
  rollback
fi

# ── Done ───────────────────────────────────────────────────────────
log "Deploy complete — all services healthy"
