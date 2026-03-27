#!/bin/zsh

set -euo pipefail

# Load environment variables from .env if it exists
if [[ -f ".env" ]]; then
  # Use set -a to export all variables from .env
  set -a
  source .env
  set +a
fi

if [[ -z "${STITCH_API_KEY:-}" && -z "${GOOGLE_CLOUD_PROJECT:-}" ]]; then
  echo "Error: Neither STITCH_API_KEY nor GOOGLE_CLOUD_PROJECT is set." >&2
  echo "Please set at least one of them to start the Stitch MCP server." >&2
  exit 1
fi

if [[ -z "${STITCH_API_KEY:-}" ]]; then
  echo "STITCH_API_KEY is not set. Using OAuth fallback or it might fail if not authenticated." >&2
fi

if [[ -z "${GOOGLE_CLOUD_PROJECT:-}" ]]; then
  echo "GOOGLE_CLOUD_PROJECT is not set. Using API key context only." >&2
fi

exec npx -y @_davideast/stitch-mcp proxy
