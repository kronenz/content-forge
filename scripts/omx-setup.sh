#!/usr/bin/env bash
set -euo pipefail

if ! command -v omx >/dev/null 2>&1; then
  echo "oh-my-codex CLI (omx) not found. Install via 'npm install -g oh-my-codex'."
  exit 1
fi

omx setup
