#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Give each app its own process group so Ctrl+C also stops reload workers.
set -m
cleanup() {
  trap - EXIT INT TERM
  kill -- "-${backend:-}" "-${frontend:-}" 2>/dev/null || true
  wait || true
}
trap cleanup EXIT INT TERM

npm run dev:server &
backend=$!
npm run dev &
frontend=$!
wait "$backend" "$frontend"
