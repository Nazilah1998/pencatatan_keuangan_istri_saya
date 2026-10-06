#!/usr/bin/env node
// Menjalankan backend Go dengan Air (live-reload) atau go run, serta memuat .env root otomatis.
import { execSync, spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadInfisicalSecrets } from './infisical-env.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const env = { ...process.env }

if (!env.PB_PORT || !env.PB_ADMIN_EMAIL) {
  try {
    const secrets = await loadInfisicalSecrets()
    for (const [k, v] of Object.entries(secrets)) {
      if (!(k in env)) env[k] = v
    }
  } catch (err) {
    console.warn(`[dev-api] Info: ${err.message}`)
  }
}

// Cek ketersediaan Air CLI
let useAir = false
try {
  execSync('air -v', { stdio: 'ignore' })
  useAir = true
} catch {
  useAir = false
}

const command = useAir ? 'air' : 'go'
const args = useAir ? [] : ['run', './cmd/server']

const child = spawn(command, args, {
  cwd: resolve(root, 'backend'),
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 0)
})

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => child.kill(sig))
}