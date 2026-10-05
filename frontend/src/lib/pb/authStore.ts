/**
 * Menyimpan status autentikasi di localStorage.
 *
 * Token disimpan pada key `pb_auth` milik SDK supaya session bisa dipakai ulang
 * setelah reload. PIN tidak pernah disimpan di perangkat: verifikasi PIN
 * dilakukan di backend dan hasilnya berupa token sesi baru.
 *
 * Modul ini tidak menyentuh `window`/`document` saat impor, sehingga aman
 * diimpor pada tahap prerender.
 */
import type PocketBase from 'pocketbase'
import type { RecordModel } from 'pocketbase'

const SESSION_KEY = 'sintya.session'

export type SessionUser = {
  id: string
  email: string
  name: string
  language: string
  householdId: string
  baseCurrency: string
  hasPin: boolean
  avatar: string
}

export type Session = (SessionUser & { token: string }) | null

type Listener = (session: Session) => void

const listeners = new Set<Listener>()
let current: Session = null
let bound: PocketBase | null = null

function readStored(): Session {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function persist(session: Session) {
  try {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else window.localStorage.removeItem(SESSION_KEY)
  } catch {
    // Storage penuh atau ditolak browser: biarkan session tetap di memori.
  }
}

function emit() {
  for (const listener of listeners) listener(current)
}

/** Field pada `users` yang dipakai UI; `pin_hash` tidak pernah disimpan. */
function toSession(pb: PocketBase, model: RecordModel): Session {
  const value = (key: string) => (model.get(key) as string) ?? ''

  return {
    id: model.id,
    email: value('email'),
    name: value('name') || value('email'),
    language: value('language') || 'id',
    householdId: value('household_id'),
    baseCurrency: value('base_currency') || 'IDR',
    hasPin: !!value('pin_hash'),
    avatar: value('avatar'),
    token: pb.authStore.token,
  }
}

export const AuthStore = {
  /** Dipanggil sekali dari `initPB()`; aman dipanggil berulang. */
  bind(pb: PocketBase) {
    if (bound === pb) return
    bound = pb

    pb.authStore.onChange((_token, model) => {
      current = model ? toSession(pb, model) : null
      persist(current)
      emit()
    })

    // Rekonstruksi session dari cache browser saat halaman dimuat ulang.
    hydrate()
  },

  get(): Session {
    return current
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    listener(current)
    return () => listeners.delete(listener)
  },

  /** Menerapkan hasil verifikasi PIN: token baru dari backend. */
  adopt(session: SessionUser, token: string) {
    current = { ...session, token }
    persist(current)
    emit()
  },

  clear() {
    bound?.authStore.clear()
    current = null
    persist(null)
    emit()
  },
}

/** Dipanggil sekali per halaman; idempotent. */
let hydrated = false

export function hydrate() {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true

  try {
    current = readStored()
  } catch {
    current = null
  }

  emit()
}