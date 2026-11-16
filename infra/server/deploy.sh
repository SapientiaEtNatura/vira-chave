#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SERVER_CONFIG_DIR="${SERVER_CONFIG_DIR:-/opt/virachave}"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"

cd "${SCRIPT_DIR}"

# Reutiliza .env e .htpasswd persistentes do servidor quando executado pelo runner
for secret_file in .env .htpasswd; do
  if [ ! -f "${SCRIPT_DIR}/${secret_file}" ]; then
    if [ -f "${SERVER_CONFIG_DIR}/infra/server/${secret_file}" ]; then
      ln -s "${SERVER_CONFIG_DIR}/infra/server/${secret_file}" "${SCRIPT_DIR}/${secret_file}"
    elif [ -f "${SERVER_CONFIG_DIR}/${secret_file}" ]; then
      ln -s "${SERVER_CONFIG_DIR}/${secret_file}" "${SCRIPT_DIR}/${secret_file}"
    else
      echo "Erro: ${secret_file} nao encontrado em ${SCRIPT_DIR} nem em ${SERVER_CONFIG_DIR}." >&2
      echo "Execute infra/server/init-env.sh no servidor antes do primeiro deploy." >&2
      exit 1
    fi
  fi
done

echo "==> Atualizando containers a partir de ${REPO_DIR}..."
docker compose -p virachave -f "${COMPOSE_FILE}" up -d --build --remove-orphans

echo "==> Sincronizando schema do banco (Prisma)..."
docker run --rm \
  --network virachave_default \
  --env-file "${SCRIPT_DIR}/.env" \
  -v "${REPO_DIR}/prisma:/app/prisma:ro" \
  -w /app \
  node:22-alpine \
  npx --yes prisma@6.19.0 db push --skip-generate

echo "==> Reiniciando Nginx para atualizar upstream do app..."
docker compose -p virachave -f "${COMPOSE_FILE}" restart web

if [ -d "${SERVER_CONFIG_DIR}/.git" ]; then
  git -C "${SERVER_CONFIG_DIR}" pull --ff-only origin main >/dev/null 2>&1 || true
fi

echo "==> Limpando imagens Docker antigas sem uso..."
docker image prune -f

echo "==> Status atual dos servicos:"
docker compose -p virachave -f "${COMPOSE_FILE}" ps
