# Stage 1: Build static frontend (Astro 7 + React 19)
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.18.0 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY frontend/package.json ./frontend/

RUN pnpm install --frozen-lockfile

COPY frontend ./frontend

RUN pnpm --filter @sintya/frontend build

# Stage 2: Caddy server runtime with Infisical CLI for Zero Hardcode secret management
FROM caddy:alpine

RUN apk add --no-cache ca-certificates tzdata curl bash \
    && curl -1sLf 'https://artifacts-cli.infisical.com/setup.apk.sh' | bash \
    && apk add --no-cache infisical

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/frontend/dist /usr/share/caddy

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
