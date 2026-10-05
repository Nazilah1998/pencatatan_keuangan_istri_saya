# sintya-finance

Aplikasi keuangan pribadi & keluarga — **Astro + React Islands** di frontend, **Go Fiber + PocketBase** di backend, satu binary, satu VPS 1 GB.

## Arsitektur

```
Browser ──▶ Caddy :443 (TLS otomatis)
              ├── /*      → static dist/   (Astro, tanpa Node runtime di produksi)
              ├── /api/v1/* → api:8081     (Go Fiber — reports, export, AI, PIN)
              └── /api/*, /_/* → api:8080  (PocketBase — REST, Realtime, Admin)

            ╔═══ SATU PROSES GO, DUA LISTENER ═══╗
            ║  PocketBase di-embed sebagai pustaka ║
            ║  pb_data/data.db  (SQLite pure-Go)  ║
            ╚═════════════════════════════════════╝
```

PocketBase **tidak** berjalan sebagai container terpisah — ia di-embed di dalam binary Go
(`pocketbase.NewWithConfig`), sehingga dua HTTP listener berada dalam satu proses.
Ini yang memungkinkan `RunInTransaction` untuk menjaga konsistensi saldo wallet.

## Struktur

```
sintya-finance/
├── frontend/     Astro 7 + React 19 Islands  → @sintya/frontend
├── backend/      Go Fiber v3 + PocketBase v0.40
├── ops/          docker-compose, Caddyfile, backup.sh, .env.example
└── docs/         ARCHITECTURE · SCHEMA · MIGRATION · TESTING · DEPLOYMENT
```

## Develop

```bash
# 1. Siapkan environment backend
cp ops/.env.example ops/.env    # lalu isi PB_ADMIN_EMAIL & PB_ADMIN_PASSWORD

# 2. Install dependency frontend
pnpm install

# 3. Terminal A — backend (PocketBase :8080 + Fiber :8081)
cd backend && go run ./cmd/server

# 4. Terminal B — frontend (:3000)
pnpm dev
```

| URL | Isi |
|---|---|
| http://localhost:3000 | Aplikasi |
| http://localhost:8081/api/v1/health | Health check backend Go |
| http://localhost:8080/_/ | Admin UI PocketBase |

> Admin UI PocketBase **tidak** diekspos di produksi. Batasi aksesnya ke IP lokal saja (lihat `docs/DEPLOYMENT.md`).

## Build

```bash
pnpm build              # frontend/dist  (JANGAN di VPS — butuh ~700MB RAM)
pnpm build:api          # backend/bin/server
```

Build frontend harus dilakukan di mesin lokal atau CI, **bukan** di VPS 1 GB.

## Test

```bash
pnpm test               # Go unit + integration test
pnpm check              # astro check (diagnostik .astro + TSX)
pnpm lint               # ESLint frontend
```

## Deploy

```bash
cp ops/.env.example ops/.env && nano ops/.env   # isi semua
docker compose -f ops/docker-compose.yml up -d
```

Detail swap memory, hardening, backup cron, dan SSL ada di **`docs/DEPLOYMENT.md`**.

## Dokumentasi

| File | Isi |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Keputusan desain, batas layer, model tenancy |
| [`docs/SCHEMA.md`](docs/SCHEMA.md) | Definisi 9 koleksi PocketBase + API rules + indeks |
| [`docs/MIGRATION.md`](docs/MIGRATION.md) | Peta Next.js/Drizzle → Astro/Go/PocketBase |
| [`docs/TESTING.md`](docs/TESTING.md) | Checklist QA manual + otomatis |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Setup VPS 1 GB dari nol |