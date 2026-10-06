#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadInfisicalSecrets } from './infisical-env.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

console.log('🔄 Mengambil konfigurasi dari Infisical Cloud untuk sinkronisasi skema...')

try {
  const secrets = await loadInfisicalSecrets()
  for (const [key, value] of Object.entries(secrets)) {
    process.env[key] = value
  }
  console.log(`✅ ${Object.keys(secrets).length} secrets berhasil dimuat dari Infisical Cloud.`)
} catch (err) {
  console.warn(`⚠️ Gagal memuat dari Infisical Cloud (${err.message}). Menggunakan process.env lokal.`)
}

const child = spawn('go', ['run', './cmd/sync'], {
  cwd: resolve(root, 'backend'),
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 0)
})
