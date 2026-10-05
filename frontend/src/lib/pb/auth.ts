/**
 * Operasi autentikasi terhadap PocketBase.
 *
 * Komponen tidak boleh memanggil `pb.collection('users')` secara langsung;
 * semua operasi yang menyentuh SDK navigasi lewat sini supaya konsistensi
 * token dan penulisan `AuthStore` hanya punya satu tempat.
 */
import type { RecordAuthResponse } from 'pocketbase'

import { PUBLIC_PB_URL } from '../config/public'
import { getPB, initPB } from './client'

export type RegisterInput = {
  email: string
  password: string
  name: string
  householdName: string
}

/**
 * Membuat akun lalu langsung masuk.
 *
 * `household_name` adalah satu-satunya field yang boleh diisi klien saat
 * pendaftaran; household, kategori awal, dan dompet bawaan dibuat hook
 * `OnRecordAfterCreate` di backend.
 */
export async function register(input: RegisterInput): Promise<RecordAuthResponse> {
  const pb = initPB()

  await pb.collection('users').create({
    email: input.email.trim(),
    password: input.password,
    passwordConfirm: input.password,
    name: input.name.trim(),
    household_name: input.householdName.trim(),
  })

  return pb.collection('users').authWithPassword(input.email.trim(), input.password)
}

export function login(email: string, password: string): Promise<RecordAuthResponse> {
  return getPB().collection('users').authWithPassword(email.trim(), password)
}

export function logout(): void {
  void getPB().authStore.clear()
}

/**
 * URL balik OAuth.
 *
 * Sengaja memakai `PUBLIC_PB_URL`, bukan `getPB()`: island juga dirender saat
 * prerender, dan build harus tetap stateless tanpa menjalankan SDK.
 */
export function oauthRedirectUrl(): string {
  return `${PUBLIC_PB_URL}/api/oauth2-redirect`
}