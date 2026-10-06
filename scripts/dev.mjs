#!/usr/bin/env node
import concurrently from 'concurrently'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadInfisicalSecrets } from './infisical-env.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

console.log('🔄 Mengambil konfigurasi dari Infisical Cloud (/Sintya-Finance - dev)...')

try {
  const secrets = await loadInfisicalSecrets()
  const count = Object.keys(secrets).length
  console.log(`✅ Berhasil memuat ${count} secrets dari Infisical Cloud!`)

  for (const [key, value] of Object.entries(secrets)) {
    process.env[key] = value
  }

  const fs = await import('node:fs/promises')
  const publicSecrets = Object.fromEntries(
    Object.entries(secrets).filter(([k]) => k.startsWith('PUBLIC_'))
  )
  const envConfigContent = `// Injected dynamically by scripts/dev.mjs from Infisical Cloud\nwindow.__PUBLIC_ENV__ = ${JSON.stringify(publicSecrets, null, 2)};\n`
  await fs.writeFile(resolve(root, 'frontend/public/env-config.js'), envConfigContent)
  console.log(`📡 Injected ${Object.keys(publicSecrets).length} public variables to frontend/public/env-config.js`)
} catch (err) {
  console.warn(`⚠️ Gagal memuat dari Infisical Cloud (${err.message}). Menggunakan process.env lokal jika tersedia.`)
}

const { result } = concurrently(
  [
    {
      command: 'node scripts/dev-api.mjs',
      name: 'backend',
      prefixColor: 'magenta',
      env: process.env,
    },
    {
      command: 'pnpm --filter @sintya/frontend dev',
      name: 'frontend',
      prefixColor: 'cyan',
      env: process.env,
    },
  ],
  {
    prefix: '[{name}]',
    killOthers: ['failure', 'success'],
    restartTries: 0,
    cwd: root,
  }
)

result.catch(() => {
  process.exit(1)
})
