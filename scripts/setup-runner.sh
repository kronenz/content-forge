#!/usr/bin/env bash
# Install a GitHub Actions self-hosted runner and register it as a systemd service.
#
# Usage:
#   GITHUB_TOKEN=<PAT> bash scripts/setup-runner.sh [REPO_OWNER/REPO_NAME]
#
# Prerequisites: curl, tar, Node 20+, pnpm 9+, Docker

set -euo pipefail

RUNNER_VERSION="2.321.0"
RUNNER_DIR="$HOME/actions-runner"
REPO="${1:-}"

# ── Helpers ────────────────────────────────────────────────────────
log() { echo "[setup-runner] $*"; }
err() { echo "[setup-runner] ERROR: $*" >&2; exit 1; }

# ── Prerequisite checks ───────────────────────────────────────────
log "Checking prerequisites..."

command -v node >/dev/null 2>&1 || err "Node.js is required (>=20). Install it first."
NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
[ "$NODE_MAJOR" -ge 20 ] || err "Node.js >=20 required (found v$NODE_MAJOR)"

command -v pnpm >/dev/null 2>&1 || err "pnpm is required (>=9). Install it first."
command -v docker >/dev/null 2>&1 || err "Docker is required. Install it first."
command -v curl >/dev/null 2>&1 || err "curl is required."

[ -n "${GITHUB_TOKEN:-}" ] || err "Set GITHUB_TOKEN env var (PAT with repo scope)"
[ -n "$REPO" ] || err "Pass REPO_OWNER/REPO_NAME as first argument"

# ── Download runner ────────────────────────────────────────────────
ARCH=$(uname -m)
case "$ARCH" in
  x86_64)  ARCH_LABEL="x64" ;;
  aarch64) ARCH_LABEL="arm64" ;;
  *)       err "Unsupported architecture: $ARCH" ;;
esac

TARBALL="actions-runner-linux-${ARCH_LABEL}-${RUNNER_VERSION}.tar.gz"
DOWNLOAD_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${TARBALL}"

log "Installing runner v${RUNNER_VERSION} (${ARCH_LABEL}) to ${RUNNER_DIR}..."
mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

if [ ! -f "run.sh" ]; then
  curl -fsSL -o "$TARBALL" "$DOWNLOAD_URL"
  tar xzf "$TARBALL"
  rm -f "$TARBALL"
fi

# ── Register runner ────────────────────────────────────────────────
log "Fetching registration token..."
REG_TOKEN=$(curl -fsSL \
  -X POST \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${REPO}/actions/runners/registration-token" \
  | grep -o '"token" *: *"[^"]*"' | cut -d'"' -f4)

[ -n "$REG_TOKEN" ] || err "Failed to get registration token"

log "Configuring runner..."
./config.sh \
  --url "https://github.com/${REPO}" \
  --token "$REG_TOKEN" \
  --name "$(hostname)-contentforge" \
  --labels self-hosted,contentforge \
  --work _work \
  --unattended \
  --replace

# ── Systemd service ───────────────────────────────────────────────
SERVICE_FILE="/etc/systemd/system/actions-runner.service"

log "Creating systemd service..."
sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=GitHub Actions Runner (ContentForge)
After=network.target docker.service

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=${RUNNER_DIR}
ExecStart=${RUNNER_DIR}/run.sh
Restart=on-failure
RestartSec=10
KillSignal=SIGTERM
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable actions-runner.service
sudo systemctl start actions-runner.service

log "Runner installed and started."
log "Verify at: https://github.com/${REPO}/settings/actions/runners"
