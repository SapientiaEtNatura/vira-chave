#!/usr/bin/env bash
set -euo pipefail

cd /opt/virachave

if [ ! -f .env ] || ! grep -q 'POSTGRES_PASSWORD=.' .env; then
  PG_PASS="$(openssl rand -hex 16)"
  cat > .env <<EOF
POSTGRES_USER=virachave
POSTGRES_PASSWORD=${PG_PASS}
POSTGRES_DB=virachave
DATABASE_URL=postgresql://virachave:${PG_PASS}@db:5432/virachave?schema=public
EOF
  chmod 600 .env
  echo "POSTGRES_ENV=created"
fi

if [ ! -f .htpasswd ] || ! grep -q '^virachave:.' .htpasswd; then
  WEB_PASS="$(openssl rand -base64 12 | tr -dc 'A-Za-z0-9' | head -c 12)"
  HASH="$(openssl passwd -6 "${WEB_PASS}")"
  printf 'virachave:%s\n' "${HASH}" > .htpasswd
  chmod 644 .htpasswd
  echo "BASIC_AUTH_USER=virachave"
  echo "BASIC_AUTH_PASS=${WEB_PASS}"
fi

docker compose up -d
sleep 6
docker compose ps
docker logs virachave-tunnel 2>&1 | grep -Eo 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' | head -n 1 || docker logs virachave-tunnel 2>&1 | tail -n 15
