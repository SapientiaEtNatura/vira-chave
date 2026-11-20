#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SERVER_CONFIG_DIR="${SERVER_CONFIG_DIR:-/opt/virachave}"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"

cd "${SCRIPT_DIR}"

# Reutiliza .env persistente do servidor quando executado pelo runner
if [ ! -f "${SCRIPT_DIR}/.env" ]; then
  if [ -f "${SERVER_CONFIG_DIR}/infra/server/.env" ]; then
    ln -sfn "${SERVER_CONFIG_DIR}/infra/server/.env" "${SCRIPT_DIR}/.env"
  elif [ -f "${SERVER_CONFIG_DIR}/.env" ]; then
    ln -sfn "${SERVER_CONFIG_DIR}/.env" "${SCRIPT_DIR}/.env"
  else
    echo "Erro: .env nao encontrado em ${SCRIPT_DIR} nem em ${SERVER_CONFIG_DIR}." >&2
    echo "Execute infra/server/init-env.sh no servidor antes do primeiro deploy." >&2
    exit 1
  fi
fi

set -a
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/.env"
set +a

POSTGRES_USER="${POSTGRES_USER:-virachave}"
POSTGRES_DB="${POSTGRES_DB:-virachave}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Erro: DATABASE_URL nao definido em ${SCRIPT_DIR}/.env." >&2
  exit 1
fi

COMPOSE_ARGS=(-p virachave -f "${COMPOSE_FILE}")
if [ -n "${CLOUDFLARE_TUNNEL_TOKEN:-}" ]; then
  echo "==> CLOUDFLARE_TUNNEL_TOKEN detectado; ativando Named Tunnel..."
  COMPOSE_ARGS+=(-f "${SCRIPT_DIR}/docker-compose.named-tunnel.yml")
fi

echo "==> Construindo imagens app e web a partir de ${REPO_DIR}..."
docker compose "${COMPOSE_ARGS[@]}" build app web

echo "==> Construindo imagem local de migracao (virachave-migrator)..."
docker build --target migrator -t virachave-migrator "${REPO_DIR}"

echo "==> Garantindo PostgreSQL saudavel antes das migrations..."
docker compose "${COMPOSE_ARGS[@]}" up -d --wait db

TABLE_COUNT="$(docker compose "${COMPOSE_ARGS[@]}" exec -T db \
  psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -tAc \
  "SELECT count(*) FROM pg_tables WHERE schemaname='public';" | tr -d '[:space:]')"
if [ -n "$TABLE_COUNT" ] && [ "$TABLE_COUNT" -gt 0 ] 2>/dev/null; then
  echo "==> Banco existente detectado (${TABLE_COUNT} tabelas). Executando backup pre-migration..."
  COMPOSE_PROJECT=virachave bash "${SCRIPT_DIR}/backup.sh" --db-only
else
  echo "==> Banco vazio (${TABLE_COUNT:-0} tabelas). Pulando backup pre-migration."
fi

echo "==> Aplicando migrations do banco (Prisma migrate deploy)..."
docker run --rm \
  --network virachave_default \
  --env-file "${SCRIPT_DIR}/.env" \
  -e DATABASE_URL \
  virachave-migrator \
  npx prisma migrate deploy

echo "==> Atualizando containers sem rebuild..."
docker compose "${COMPOSE_ARGS[@]}" up -d --no-build --wait --remove-orphans

echo "==> Recarregando Nginx para atualizar conexoes upstream..."
docker compose "${COMPOSE_ARGS[@]}" exec -T web nginx -s reload

echo "==> Verificando saude da aplicacao em http://127.0.0.1:3000/api/health..."
HEALTHY=false
LAST_STATUS=""
for _ in $(seq 1 15); do
  if command -v curl >/dev/null 2>&1; then
    LAST_STATUS="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/api/health || true)"
    if [ "$LAST_STATUS" = "200" ]; then
      HEALTHY=true
      break
    fi
  elif wget -q --spider http://127.0.0.1:3000/api/health 2>/dev/null; then
    LAST_STATUS="200"
    HEALTHY=true
    break
  fi
  sleep 1
done

if [ "$HEALTHY" != "true" ]; then
  echo "Erro: /api/health nao respondeu HTTP 200 apos 15 tentativas (status: ${LAST_STATUS:-none})." >&2
  docker compose "${COMPOSE_ARGS[@]}" logs --tail=30 app web >&2 || true
  exit 1
fi

if [ -d "${SERVER_CONFIG_DIR}/.git" ] && [ "${REPO_DIR}" != "${SERVER_CONFIG_DIR}" ]; then
  echo "==> Sincronizando copia de referencia em ${SERVER_CONFIG_DIR}..."
  if ! git -C "${SERVER_CONFIG_DIR}" pull --ff-only origin main; then
    echo "AVISO: falha ao sincronizar ${SERVER_CONFIG_DIR} com origin/main; verifique o repositorio local." >&2
  fi
fi

echo "==> Limpando imagens antigas e cache excessivo do BuildKit..."
docker image prune -f
docker builder prune -f --keep-storage=3GB

echo "==> Status atual dos servicos:"
docker compose "${COMPOSE_ARGS[@]}" ps
