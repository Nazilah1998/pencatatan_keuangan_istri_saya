/**
 * State global bersama antar-island.
 *
 * Astro meng-hidrate setiap island sebagai root React terpisah, jadi React
 * context tidak bisa dipakai untuk berbagi state. nanostores dipakai karena
 * store-nya berada di modul yang sama sehingga semua island melihat nilai yang
 * sama. `AuthStore` tetap menjadi sumber kebenaran untuk session.
 */
import { atom } from 'nanostores'

import { PUBLIC_DEFAULT_LANG } from '../config/public'
import {
  detectLang,
  isLang,
  loadLang,
  makeT,
  persistLang,
  type Dictionary,
  type LangCode,
} from '../i18n'
import { AuthStore, type Session } from '../pb/authStore'
import { initPB } from '../pb/client'

export type Theme = 'dark' | 'light'

const THEME_KEY = 'sintya.theme'

export const $session = atom<Session>(null)
export const $ready = atom(false)
export const $theme = atom<Theme>('light')
export const $lang = atom<LangCode>(PUBLIC_DEFAULT_LANG as LangCode)
export const $dict = atom<Dictionary | null>(null)

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'

  const stored = window.localStorage.getItem(THEME_KEY)
  if (stored === 'dark' || stored === 'light') return stored

  return 'light'
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
}

async function setLang(lang: LangCode) {
  if (!isLang(lang)) return

  persistLang(lang)
  $lang.set(lang)
  $dict.set(await loadLang(lang))
}

function toggleTheme() {
  const next: Theme = $theme.get() === 'dark' ? 'light' : 'dark'

  applyTheme(next)
  $theme.set(next)

  if (typeof window !== 'undefined') window.localStorage.setItem(THEME_KEY, next)
}

export const appActions = {
  init() {
    const theme = readStoredTheme()
    applyTheme(theme)
    $theme.set(theme)

    const lang = detectLang()
    persistLang(lang)
    $lang.set(lang)

    void loadLang(lang).then((dict) => $dict.set(dict))

    AuthStore.subscribe((session) => {
      $session.set(session)
      $ready.set(true)
    })
  },

  toggleTheme,
  setTheme(theme: Theme) {
    applyTheme(theme)
    $theme.set(theme)
    if (typeof window !== 'undefined') window.localStorage.setItem(THEME_KEY, theme)
  },
  setLang,
  signOut: () => AuthStore.clear(),
}

/**
 * Modul ini dievaluasi sekali per halaman, jadi inisialisasi di sini cukup.
 * Semua island mengimpor modul yang sama dan karena itu melihat store yang sama.
 *
 * `initPB()` harus dipanggil lebih awal: SDK PocketBase membaca token dari
 * localStorage dan memancarkan `authStore.onChange`, yang menyinkronkan
 * `AuthStore`. Tanpa itu, sesi hasil OAuth tidak pernah terbaca setelah reload.
 */
let initialised = false

export function ensureInitialised() {
  if (initialised || typeof window === 'undefined') return
  initialised = true

  initPB()
  appActions.init()
}

ensureInitialised()

export function translateFn(dict: Dictionary | null) {
  const fallback = (path: string) => path
  return dict ? makeT(dict) : fallback
}