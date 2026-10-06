#!/usr/bin/env node
/**
 * Setup and Schema Synchronizer for Remote PocketBase (https://db-sintya.nazilah.id)
 * Mengambil rahasia dari Infisical Cloud (/Sintya-Finance), mengonfigurasi Superuser,
 * menyinkronkan pengaturan aplikasi (App Name, App URL, Google OAuth2), serta memverifikasi
 * skema dan field autodate seluruh koleksi.
 */

import { loadInfisicalSecrets } from './infisical-env.mjs'

async function initEnv() {
  try {
    const secrets = await loadInfisicalSecrets()
    for (const [key, value] of Object.entries(secrets)) {
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
    console.log(`✅ Konfigurasi dimuat dari Infisical Cloud (${Object.keys(secrets).length} variables)`)
  } catch (err) {
    console.warn(`⚠️ Gagal memuat dari Infisical Cloud (${err.message}). Menggunakan process.env lokal.`)
  }
}

async function main() {
  await initEnv()

  const pbUrl = (process.env.REMOTE_PB_URL || process.env.PUBLIC_PB_URL || 'https://db-sintya.nazilah.id').replace(/\/+$/, '')
  const email = process.env.PB_ADMIN_EMAIL || 'sintyawati787@gmail.com'
  const password = process.env.PB_ADMIN_PASSWORD || '@Sintya2003'
  const googleClientId = process.env.GOOGLE_CLIENT_ID || ''
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
  const appName = process.env.PUBLIC_APP_NAME || 'Sintya Finance'
  const appUrl = (process.env.APP_URL || 'https://sintya.nazilah.id').replace(/\/+$/, '')

  console.log(`🚀 Menghubungkan ke PocketBase di ${pbUrl}...`)

  const loginRes = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password }),
  })

  if (!loginRes.ok) {
    throw new Error(`Login Superuser gagal (${loginRes.status}): ${await loginRes.text()}`)
  }

  const { token } = await loginRes.json()
  console.log('✅ Autentikasi Superuser berhasil!')

  // 1. Sinkronkan Pengaturan Aplikasi (Settings)
  console.log('⚙️  Memeriksa dan memperbarui pengaturan aplikasi PocketBase...')
  const settingsRes = await fetch(`${pbUrl}/api/settings`, {
    headers: { Authorization: token },
  })

  if (settingsRes.ok) {
    const currentSettings = await settingsRes.json()
    const patchSettings = {
      meta: {
        ...(currentSettings.meta || {}),
        appName,
        appURL: appUrl,
      },
    }

    const updateSettingsRes = await fetch(`${pbUrl}/api/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify(patchSettings),
    })

    if (updateSettingsRes.ok) {
      console.log(`✅ Pengaturan PocketBase diperbarui: App Name = "${appName}", App URL = "${appUrl}"`)
    } else {
      console.warn(`⚠️ Gagal memperbarui pengaturan PocketBase: ${updateSettingsRes.status}`)
    }
  }

  // 2. Periksa dan Perbarui Koleksi Users (Google OAuth2 Provider)
  const usersRes = await fetch(`${pbUrl}/api/collections/users`, {
    headers: { Authorization: token },
  })

  if (usersRes.ok) {
    const usersCol = await usersRes.json()
    if (googleClientId && googleClientSecret) {
      console.log('🔑 Mengonfigurasi Google OAuth2 di koleksi users...')
      const oauth2 = usersCol.oauth2 || { providers: [] }
      const providers = oauth2.providers || []
      const googleIndex = providers.findIndex((p) => p.name === 'google')

      const googleConfig = {
        name: 'google',
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      }

      if (googleIndex >= 0) {
        providers[googleIndex] = { ...providers[googleIndex], ...googleConfig }
      } else {
        providers.push(googleConfig)
      }

      const patchUsers = await fetch(`${pbUrl}/api/collections/users`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({
          oauth2: {
            ...oauth2,
            enabled: true,
            providers,
          },
        }),
      })

      if (patchUsers.ok) {
        console.log('✅ Google OAuth2 berhasil dikonfigurasi pada koleksi users!')
      } else {
        console.warn(`⚠️ Gagal memperbarui OAuth users (${patchUsers.status}): ${await patchUsers.text()}`)
      }
    }
  }

  // 3. Verifikasi Semua Koleksi & Pastikan Autodate Fields
  console.log('📂 Memverifikasi skema seluruh koleksi PocketBase...')
  const colsRes = await fetch(`${pbUrl}/api/collections?perPage=100`, {
    headers: { Authorization: token },
  })

  if (!colsRes.ok) {
    throw new Error(`Gagal mengambil daftar koleksi: ${colsRes.status}`)
  }

  const colsData = await colsRes.json()
  const items = colsData.items || []
  console.log(`📋 Total koleksi ditemukan: ${items.length}`)

  for (const col of items) {
    if (col.system) continue

    const fields = col.fields || []
    const hasCreated = fields.some((f) => f.name === 'created')
    const hasUpdated = fields.some((f) => f.name === 'updated')

    if (!hasCreated || !hasUpdated) {
      const newFields = [...fields]
      if (!hasCreated) {
        newFields.push({ name: 'created', type: 'autodate', onCreate: true, onUpdate: false })
      }
      if (!hasUpdated) {
        newFields.push({ name: 'updated', type: 'autodate', onCreate: true, onUpdate: true })
      }

      const patchCol = await fetch(`${pbUrl}/api/collections/${col.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({ fields: newFields }),
      })

      if (patchCol.ok) {
        console.log(`✅ Autodate fields disinkronkan untuk koleksi "${col.name}"`)
      }
    } else {
      console.log(`✓ Koleksi "${col.name}" skema lengkap dan valid`)
    }
  }

  console.log('\n🎉 Konfigurasi dan sinkronisasi PocketBase remote selesai dengan sukses!')
}

main().catch((err) => {
  console.error('❌ Error konfigurasi PocketBase:', err.message)
  process.exit(1)
})
