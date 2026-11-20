#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-${SCRIPT_DIR}/docker-compose.yml}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-virachave}"
BACKUP_DIR="${BACKUP_DIR:-/opt/virachave/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

DB_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --db-only)
      DB_ONLY=true
      ;;
    *)
      echo "Uso: $0 [--db-only]" >&2
      exit 1
      ;;
  esac
done

ENV_FILE="${ENV_FILE:-}"
if [ -z "$ENV_FILE" ]; then
  if [ -f "${SCRIPT_DIR}/.env" ]; then
    ENV_FILE="${SCRIPT_DIR}/.env"
  elif [ -f "/opt/virachave/infra/server/.env" ]; then
    ENV_FILE="/opt/virachave/infra/server/.env"
  else
    echo "Erro: arquivo .env nao encontrado em ${SCRIPT_DIR}/.env nem em /opt/virachave/infra/server/.env." >&2
    exit 1
  fi
elif [ ! -f "$ENV_FILE" ]; then
  echo "Erro: ENV_FILE nao encontrado: ${ENV_FILE}" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

POSTGRES_USER="${POSTGRES_USER:-virachave}"
POSTGRES_DB="${POSTGRES_DB:-virachave}"

umask 077
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DB_FILE="${BACKUP_DIR}/db-${TIMESTAMP}.dump.gz"
UPLOADS_FILE="${BACKUP_DIR}/uploads-${TIMESTAMP}.tar.gz"
TMP_DB_FILE="${DB_FILE}.tmp"
TMP_UPLOADS_FILE="${UPLOADS_FILE}.tmp"

cleanup() {
  rm -f "${TMP_DB_FILE}" "${TMP_UPLOADS_FILE}"
}
trap cleanup EXIT

echo "==> Realizando backup do PostgreSQL (${POSTGRES_DB})..."
docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T db \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc | gzip > "$TMP_DB_FILE"
mv "$TMP_DB_FILE" "$DB_FILE"
chmod 600 "$DB_FILE"
echo "==> Backup do banco salvo em: ${DB_FILE}"

if [ "$DB_ONLY" = false ]; then
  UPLOADS_VOLUME="${COMPOSE_PROJECT}_uploads_data"
  if ! docker volume inspect "$UPLOADS_VOLUME" >/dev/null 2>&1; then
    echo "Erro: volume ${UPLOADS_VOLUME} nao encontrado." >&2
    exit 1
  fi

  echo "==> Realizando backup do volume de uploads (${UPLOADS_VOLUME})..."
  docker run --rm \
    -v "${UPLOADS_VOLUME}:/source:ro" \
    -v "${BACKUP_DIR}:/backup" \
    alpine:3.21 \
    sh -c 'tar -czf "/backup/$1" -C /source .' _ "$(basename "$TMP_UPLOADS_FILE")"
  mv "$TMP_UPLOADS_FILE" "$UPLOADS_FILE"
  chmod 600 "$UPLOADS_FILE"
  echo "==> Backup de uploads salvo em: ${UPLOADS_FILE}"
fi

echo "==> Removendo backups com mais de ${RETENTION_DAYS} dias em ${BACKUP_DIR}..."
find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'db-*.dump.gz' -o -name 'uploads-*.tar.gz' \) -mtime +"$RETENTION_DAYS" -delete
