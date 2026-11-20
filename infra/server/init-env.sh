#!/usr/bin/env bash
set -euo pipefail

SERVER_DIR="${SERVER_DIR:-/opt/virachave}"
ENV_FILE="${SERVER_DIR}/infra/server/.env"
COMPOSE_FILE="${SERVER_DIR}/infra/server/docker-compose.yml"

umask 077
mkdir -p "$(dirname "$ENV_FILE")"

# Preserva .env legado na raiz de SERVER_DIR caso ainda nao exista em infra/server/.env
if [ ! -f "$ENV_FILE" ] && [ -f "${SERVER_DIR}/.env" ] && grep -q '^POSTGRES_PASSWORD=.' "${SERVER_DIR}/.env"; then
  cp -a "${SERVER_DIR}/.env" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi

if [ ! -f "$ENV_FILE" ]; then
  : > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi

get_env_var() {
  local key="$1"
  local line
  line="$(grep -E "^${key}=" "$ENV_FILE" | head -n 1 || true)"
  printf '%s' "${line#*=}"
}

upsert_env_var() {
  local key="$1"
  local value="$2"
  local tmp_file
  tmp_file="$(mktemp)"
  grep -v -E "^${key}=" "$ENV_FILE" > "$tmp_file" || true
  printf '%s=%s\n' "$key" "$value" >> "$tmp_file"
  mv "$tmp_file" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
}

PG_USER="$(get_env_var POSTGRES_USER)"
if [ -z "$PG_USER" ]; then
  PG_USER="virachave"
  upsert_env_var "POSTGRES_USER" "$PG_USER"
fi

PG_DB="$(get_env_var POSTGRES_DB)"
if [ -z "$PG_DB" ]; then
  PG_DB="virachave"
  upsert_env_var "POSTGRES_DB" "$PG_DB"
fi

PG_PASS="$(get_env_var POSTGRES_PASSWORD)"
if [ -z "$PG_PASS" ]; then
  PG_PASS="$(openssl rand -hex 16)"
  upsert_env_var "POSTGRES_PASSWORD" "$PG_PASS"
  echo "POSTGRES_ENV=created"
fi

DB_URL="$(get_env_var DATABASE_URL)"
if [ -z "$DB_URL" ]; then
  DB_URL="postgresql://${PG_USER}:${PG_PASS}@db:5432/${PG_DB}?schema=public&connection_limit=15&pool_timeout=10"
  upsert_env_var "DATABASE_URL" "$DB_URL"
elif [[ "$DB_URL" != *"connection_limit="* ]]; then
  if [[ "$DB_URL" == *"?"* ]]; then
    DB_URL="${DB_URL}&connection_limit=15&pool_timeout=10"
  else
    DB_URL="${DB_URL}?schema=public&connection_limit=15&pool_timeout=10"
  fi
  upsert_env_var "DATABASE_URL" "$DB_URL"
fi

AUTH_SEC="$(get_env_var AUTH_SECRET)"
if [ -z "$AUTH_SEC" ]; then
  AUTH_SEC="$(openssl rand -hex 32)"
  upsert_env_var "AUTH_SECRET" "$AUTH_SEC"
  echo "AUTH_SECRET=created"
fi

CURRENT_NODE_ENV="$(get_env_var NODE_ENV)"
if [ -z "$CURRENT_NODE_ENV" ]; then
  upsert_env_var "NODE_ENV" "production"
fi

chmod 600 "$ENV_FILE"

cd "$SERVER_DIR"
docker compose -p virachave -f "$COMPOSE_FILE" up -d --build
sleep 6
docker compose -p virachave -f "$COMPOSE_FILE" ps

TUNNEL_LOGS="$(docker compose -p virachave -f "$COMPOSE_FILE" logs --tail=100 tunnel 2>&1 || true)"
TUNNEL_URL="$(printf '%s\n' "$TUNNEL_LOGS" | grep -m 1 -Eo 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' || true)"
if [ -n "$TUNNEL_URL" ]; then
  echo "TUNNEL_URL=${TUNNEL_URL}"
else
  printf '%s\n' "$TUNNEL_LOGS" | tail -n 15 || true
fi
