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
const DEFAULT_CATEGORIES = [
  { name: 'Gaji', icon: '💰', color: 'emerald', type: 'income' },
  { name: 'Bonus Kantor', icon: '✨', color: 'green', type: 'income' },
  { name: 'Investasi', icon: '📈', color: 'blue', type: 'income' },
  { name: 'Jajan Comel', icon: '🍿', color: 'orange', type: 'expense' },
  { name: 'Transportasi', icon: '🚗', color: 'blue', type: 'expense' },
  { name: 'Belanja Online', icon: '🛍️', color: 'violet', type: 'expense' },
  { name: 'Belanja Offline', icon: '🧺', color: 'lime', type: 'expense' },
  { name: 'Tagihan & Utilitas', icon: '⚡', color: 'red', type: 'expense' },
  { name: 'Kesehatan', icon: '🏥', color: 'emerald', type: 'expense' },
  { name: 'Pendidikan', icon: '🎓', color: 'cyan', type: 'expense' },
  { name: 'Biaya Perjalanan', icon: '🧳', color: 'amber', type: 'expense' },
  { name: 'Hiburan', icon: '🎬', color: 'pink', type: 'expense' },
  { name: 'Cicilan', icon: '💸', color: 'red', type: 'expense' },
  { name: 'Tabungan', icon: '🐷', color: 'green', type: 'expense' },
]

const DEFAULT_WALLETS = [
  { name: 'Cash', type: 'cash', icon: '💵', color: 'emerald', include_in_net_worth: true, initial_balance: 0 },
  { name: 'Bank BCA', type: 'bank', icon: '🏦', color: 'blue', include_in_net_worth: true, initial_balance: 0 },
  { name: 'GoPay', type: 'ewallet', icon: '📱', color: 'teal', include_in_net_worth: true, initial_balance: 0 },
]

async function seedDefaults(pb: ReturnType<typeof initPB>, householdId: string): Promise<void> {
  for (const cat of DEFAULT_CATEGORIES) {
    await pb.collection('categories').create({
      household_id: householdId,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
      is_system: true,
    }).catch(() => null)
  }

  for (const w of DEFAULT_WALLETS) {
    await pb.collection('wallets').create({
      household_id: householdId,
      name: w.name,
      type: w.type,
      icon: w.icon,
      color: w.color,
      currency: 'IDR',
      initial_balance: 0,
      current_balance: 0,
      include_in_net_worth: true,
      is_archived: false,
    }).catch(() => null)
  }
}

async function ensureHousehold(
  pb: ReturnType<typeof initPB>,
  auth: RecordAuthResponse,
  preferredName?: string
): Promise<RecordAuthResponse> {
  const m = auth.record as unknown as Record<string, unknown>
  if (m.household_id) {
    return auth
  }

  try {
    const existing = await pb
      .collection('households')
      .getFirstListItem(`created_by = "${auth.record.id}"`)
      .catch(() => null)

    let householdId = existing?.id
    let isNew = false

    if (!householdId) {
      const hh = await pb.collection('households').create({
        name: preferredName?.trim() || 'Rumah Tangga',
        currency: 'IDR',
        language: (m.language as string) || 'id',
        created_by: auth.record.id,
      })
      householdId = hh.id
      isNew = true
    }

    await pb.collection('users').update(auth.record.id, {
      household_id: householdId,
    })

    const refreshed = await pb.collection('users').authRefresh()

    if (isNew && householdId) {
      await seedDefaults(pb, householdId)
    }

    return refreshed
  } catch {
    return auth
  }
}

export async function register(input: RegisterInput): Promise<RecordAuthResponse> {
  const pb = initPB()

  await pb.collection('users').create({
    email: input.email.trim(),
    password: input.password,
    passwordConfirm: input.password,
    name: input.name.trim(),
    household_name: input.householdName.trim(),
  })

  const auth = await pb.collection('users').authWithPassword(input.email.trim(), input.password)
  return ensureHousehold(pb, auth, input.householdName)
}

export async function login(email: string, password: string): Promise<RecordAuthResponse> {
  const pb = initPB()
  const auth = await pb.collection('users').authWithPassword(email.trim(), password)
  return ensureHousehold(pb, auth)
}

export async function loginWithGoogle(): Promise<RecordAuthResponse> {
  const pb = initPB()
  const auth = await pb.collection('users').authWithOAuth2({ provider: 'google' })
  return ensureHousehold(pb, auth)
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