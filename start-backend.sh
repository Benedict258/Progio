#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="/tmp/progio-backend.log"
PID_FILE="/tmp/progio-backend.pid"
MAX_RETRIES=5
RETRY_DELAY=2

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

cleanup() {
  log "Shutting down backend..."
  if [[ -f "$PID_FILE" ]]; then
    kill "$(cat "$PID_FILE")" 2>/dev/null || true
    rm -f "$PID_FILE"
  fi
  pkill -f "uvicorn app.main:app" 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM

cleanup_stale() {
  log "Killing any existing uvicorn processes..."
  pkill -f "uvicorn app.main:app" 2>/dev/null || true
  sleep 1
  rm -f "$PID_FILE"
}

start_server() {
  log "Starting uvicorn on port 8000..."
  cd "$(dirname "$0")/backend"
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload >> "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"
  log "Server started with PID $(cat "$PID_FILE")"
}

wait_for_health() {
  local retries=0
  while [[ $retries -lt $MAX_RETRIES ]]; do
    if curl -sf http://localhost:8000/api/health > /dev/null 2>&1; then
      log "Health check passed"
      return 0
    fi
    retries=$((retries + 1))
    log "Health check attempt $retries/$MAX_RETRIES failed, retrying in ${RETRY_DELAY}s..."
    sleep "$RETRY_DELAY"
  done
  log "ERROR: Server failed health check after $MAX_RETRIES attempts"
  return 1
}

cleanup_stale
start_server

if ! wait_for_health; then
  log "Server did not become healthy. Check $LOG_FILE for errors."
  exit 1
fi

log "Backend is running. Log: $LOG_FILE"
log "Press Ctrl+C to stop."

while true; do
  if ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    log "WARN: Server process died. Restarting..."
    start_server
    if ! wait_for_health; then
      log "Restart failed. Exiting."
      exit 1
    fi
  fi
  sleep 5
done
