#!/bin/sh
set -e

API_DOMAIN="${INFISICAL_API_URL:-${INFISICAL_HOST_URL:-https://app.infisical.com/api}}"
ENV_TARGET="${INFISICAL_ENV:-prod}"
PROJECT_ID="${INFISICAL_PROJECT_ID}"
CLIENT_ID="${INFISICAL_CLIENT_ID:-$INFISICAL_UNIVERSAL_AUTH_CLIENT_ID}"
CLIENT_SECRET="${INFISICAL_CLIENT_SECRET:-$INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET}"
SECRET_PATH="${INFISICAL_SECRET_PATH:-/Sintya-Finance}"

case "$API_DOMAIN" in
    */api) ;;
    *) API_DOMAIN="${API_DOMAIN%/}/api" ;;
esac

TOKEN="$INFISICAL_TOKEN"

if [ -z "$TOKEN" ] && [ -n "$CLIENT_ID" ] && [ -n "$CLIENT_SECRET" ]; then
    TOKEN=$(infisical login --method=universal-auth --client-id="$CLIENT_ID" --client-secret="$CLIENT_SECRET" --domain="$API_DOMAIN" --plain --silent 2>/dev/null || true)
fi

if [ -n "$TOKEN" ]; then
    PROJECT_ARG=""
    if [ -n "$PROJECT_ID" ]; then
        PROJECT_ARG="--projectId=$PROJECT_ID"
    fi
    echo "Authenticated with Infisical. Exporting secrets for environment '$ENV_TARGET' from path '$SECRET_PATH'..."
    eval "$(infisical export --token="$TOKEN" --domain="$API_DOMAIN" --env="$ENV_TARGET" $PROJECT_ARG --path="$SECRET_PATH" --format=dotenv-export 2>/dev/null || true)"
fi

PB_URL="${PUBLIC_PB_URL:-https://db-sintya.nazilah.id}"
API_BASE="${PUBLIC_API_BASE:-https://db-sintya.nazilah.id/api/v1}"
APP_NAME="${PUBLIC_APP_NAME:-Sintya Finance}"
DEFAULT_LANG="${PUBLIC_DEFAULT_LANG:-id}"

cat <<EOF > /usr/share/caddy/env-config.js
window.__PUBLIC_ENV__ = {
  PUBLIC_PB_URL: "${PB_URL}",
  PUBLIC_API_BASE: "${API_BASE}",
  PUBLIC_APP_NAME: "${APP_NAME}",
  PUBLIC_DEFAULT_LANG: "${DEFAULT_LANG}"
};
EOF

echo "Configured runtime /usr/share/caddy/env-config.js"
echo "Starting Caddy on port ${PORT:-3000}..."

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
