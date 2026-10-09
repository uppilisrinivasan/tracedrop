#!/usr/bin/env bash
# Run TraceDrop locally without Docker.
#
#   ./run.sh            install deps (first run) and start backend + frontend
#   ./run.sh --install  force a fresh npm install before starting
#   ./run.sh --data     regenerate synthetic data before starting
#
# Backend:  http://localhost:8080  (API at /api/health)
# Frontend: http://localhost:5173  (Vite dev server, proxies /api to backend)
# Ctrl+C stops both.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT="${PORT:-8080}"
FRONTEND_PORT=5173

FORCE_INSTALL=false
REGEN_DATA=false
for arg in "$@"; do
  case "$arg" in
    --install) FORCE_INSTALL=true ;;
    --data)    REGEN_DATA=true ;;
    -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!\033[0m  %s\n' "$*"; }
fail() { printf '\033[1;31mxx\033[0m  %s\n' "$*"; exit 1; }

# --- Prerequisites ---------------------------------------------------------
command -v node >/dev/null || fail "Node.js not found. Install Node 20+."
command -v npm  >/dev/null || fail "npm not found."
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || fail "Node 20+ required (found $(node --version))."

port_in_use() { lsof -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; }
port_in_use "$BACKEND_PORT"  && fail "Port $BACKEND_PORT is already in use."
port_in_use "$FRONTEND_PORT" && fail "Port $FRONTEND_PORT is already in use."

# --- Environment -----------------------------------------------------------
# The backend loads .env from its working directory (backend/).
if [ ! -f "$ROOT/backend/.env" ]; then
  if [ -f "$ROOT/.env" ]; then
    cp "$ROOT/.env" "$ROOT/backend/.env"
    info "Copied .env to backend/.env"
  elif [ -f "$ROOT/.env.example" ]; then
    cp "$ROOT/.env.example" "$ROOT/backend/.env"
    warn "Created backend/.env from .env.example — set ANTHROPIC_API_KEY in it for AI features."
  fi
fi

# --- Dependencies ----------------------------------------------------------
install_deps() {
  local dir="$1"
  if $FORCE_INSTALL || [ ! -d "$ROOT/$dir/node_modules" ]; then
    info "Installing $dir dependencies..."
    (cd "$ROOT/$dir" && npm install --no-audit --no-fund)
  fi
}
install_deps backend
install_deps frontend

# --- Synthetic data --------------------------------------------------------
if $REGEN_DATA; then
  command -v python3 >/dev/null || fail "python3 needed for --data."
  info "Regenerating synthetic data..."
  python3 "$ROOT/data/generate.py"
fi

# --- Start -----------------------------------------------------------------
PIDS=()
cleanup() {
  trap - INT TERM EXIT
  info "Stopping..."
  for pid in "${PIDS[@]}"; do kill "$pid" 2>/dev/null || true; done
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

info "Starting backend on :$BACKEND_PORT"
(cd "$ROOT/backend" && PORT="$BACKEND_PORT" npm run dev) &
PIDS+=($!)

info "Starting frontend on :$FRONTEND_PORT"
(cd "$ROOT/frontend" && npm run dev -- --port "$FRONTEND_PORT" --strictPort) &
PIDS+=($!)

# Wait for the backend health check so failures surface early.
for _ in $(seq 1 30); do
  if curl -fs "http://localhost:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
    info "Backend healthy: http://localhost:$BACKEND_PORT/api/health"
    break
  fi
  sleep 1
done

info "Open the app: http://localhost:$FRONTEND_PORT   (Ctrl+C to stop)"

# Exit if either process dies (polling loop; macOS bash 3.2 has no `wait -n`).
while :; do
  for pid in "${PIDS[@]}"; do
    if ! kill -0 "$pid" 2>/dev/null; then
      warn "A process exited; shutting down the other."
      exit 1
    fi
  done
  sleep 2
done
