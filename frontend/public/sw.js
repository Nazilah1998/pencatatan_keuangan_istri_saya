/*
 * Service worker aplikasi.
 *
 * Ditulis manual (bukan lewat Workbox) karena situs ini static dan hanya butuh
 * tiga perilaku: precache shell saat install, jaringan-dulu untuk navigasi, dan
 * tidak ada cache untuk data keuangan.
 *
 * Aturan penting: angka yang basi lebih buruk daripada loading sebentar,
 * jadi /api, /api/v1, /_ pb, dan seluruh request non-GET tidak pernah di-cache.
 */
const VERSION = 'v1'
const SHELL_CACHE = `sintya-shell-${VERSION}`
const ASSET_CACHE = `sintya-assets-${VERSION}`

const SHELL = ['/', '/manifest.json', '/favicon.ico', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key.startsWith('sintya-') && key !== SHELL_CACHE && key !== ASSET_CACHE)
          .map((key) => caches.delete(key)),
      )

      await self.clients.claim()
    })(),
  )
})

/** Data keuangan & endpoint auth: selalu ke jaringan, tanpa cache. */
function isPrivate(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname === '/api' ||
    url.pathname.startsWith('/_') ||
    url.pathname.startsWith('/api/v1')
  )
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_astro/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/screenshots/') ||
    /\.(?:js|css|woff2?|png|svg|ico|webp|jpg|jpeg)$/.test(url.pathname)
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navigasi: coba jaringan dulu, jatuh ke cache shell saat offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(SHELL_CACHE)
        return (await cache.match(request)) ?? (await cache.match('/')) ?? Response.error()
      }),
    )
    return
  }

  if (isPrivate(url)) return

  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE)
        const hit = await cache.match(request)

        const network = fetch(request)
          .then((response) => {
            if (response.ok) void cache.put(request, response.clone())
            return response
          })
          .catch(() => hit ?? Response.error())

        // Cache-first: aset sudah ber-hash di namanya sehingga aman.
        return hit ?? network
      })(),
    )
  }
})

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') void self.skipWaiting()
})