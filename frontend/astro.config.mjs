// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'

/*
 * Astro 7 hanya menghasilkan HTML statis. Tidak ada adapter SSR karena produksi
 * disajikan Caddy dan seluruh data diambil di browser lewat PocketBase/Go API.
 *
 * PWA ditangani service worker manual di `public/sw.js` + `public/manifest.json`
 * (integration @astrojs/pwa sudah sunset dan digantikan @vite-pwa/astro yang
 * belum mendukung Astro 7). SW didaftarkan dari markup BaseLayout.astro agar
 * cache ikut ter-update tanpa perlu island React.
 *
 * Nilai `PUBLIC_*` dibaca di `src/lib/config/public.ts` oleh Vite saat bundling,
 * bukan di sini.
 */
export default defineConfig({
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  devToolbar: {
    enabled: false,
  },
  server: {
    // Diperlukan agar aplikasi bisa diakses dari perangkat lain di jaringan
    // lokal saat pengembangan (uji Capacitor & PWA lewat HP).
    host: true,
    port: 3000,
  },
  integrations: [react()],
  vite: {
    envDir: '..',
    plugins: [tailwindcss()],
  },
})