# AGENTS.md

Monorepo: `frontend/` (Astro 7 + React 19) · `backend/` (Go Fiber v3 + PocketBase v0.40).

## Aturan umum

- **Jangan menambahkan komentar kode** kecuali diminta.
- Setelah mengubah kode, jalankan lint + typecheck + test sebelum melapor selesai.
- Jangan pernah commit secret. `ops/.env` dan `frontend/.env` sudah di-ignore.

## This is NOT the Astro you know

Versi Astro di repo ini lebih baru dari data latihanmu. Sebelum menulis kode, baca dokumentasi di `node_modules/astro/dist/docs/` atau `docs/` pada paket terkait. Perhatikan penanda deprecation — beberapa API berubah (mis. struktur config, integrasi, opsi `output`).

## boundary wajib

| Lokasi | Boleh memakai |
|---|---|
| `backend/` | Go saja. Tidak boleh memanggil API eksternal selain Gemini/OAuth. |
| `backend/internal/handlers/` | Hanya boleh memanggil `services/`, tidak boleh langsung menyentuh `pocketbase.App`. |
| `backend/internal/services/` | Sumber tunggal untuk logika bisnis (saldo, budget, net worth). |
| `backend/internal/pocketbase/` | Satu-satunya tempat yang tahu detail collections/hooks/rule. |
| `frontend/src/lib/pb/` | **Satu-satunya** tempat yang memanggil PocketBase JS SDK. |
| `frontend/src/components/` | Tidak boleh memanggil fetch langsung; selalu lewat `lib/api/` atau `lib/pb/`. |

Dilarang: logika bisnis di dalam komponen React, dan dikembalikannya ke `app/actions/`-ala Next.

## Aturan PocketBase

- Semua koleksi wajib punya `household_id` dengan scope rule. Jangan pernah membuat koleksi yang bisa dibaca lintas household.
- Create rule menggunakan `AND @request.body.household_id = @request.auth.household_id`.
- Perubahan schema **harus** lewat `backend/internal/collections/definitions.go` + `apply.go`. Jangan pernah mengedit schema lewat Admin UI laluándocian itu tidak repeatable.
- Mutasi yang menyentuh saldo wajib `app.RunInTransaction`.
- Jangan pernah mengembalikan `e *echo.HTTPError` apa adanya; bungkus dengan `internal/apierr`.

## Aturan Astro

- `output: 'static'`. Tidak boleh menambahkan adapter Node/SSR — produksi disajikan Caddy.
- Halaman `.astro` yang butuh browser state harus memakai island React dengan direktif hydrasi yang paling murah (`client:visible` > `client:idle` > `client:load`).
- Jangan pernah melakukan fetch data pengguna di `.astro` pada build time — build harus tetap stateless dan tidak menyentuh server produksi.

## Conventions

- Idioma: komentar dan pesan error ke pengguna dalam Bahasa Indonesia.
- Format uang: `IDR` tanpa desimal untuk amount, `USD` dengan 2 desimal. Lihat `frontend/src/lib/utils/currency.ts`.
- Warna: hanya lewat token CSS di `frontend/src/styles/global.css`. Jangan menulis literal hex di komponen.