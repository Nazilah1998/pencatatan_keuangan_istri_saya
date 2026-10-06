/**
 * i18n sisi klien.
 *
 * Kamus dimuat lewat dynamic import supaya bundel awal hanya memuat bahasa yang
 * dipakai. `id` di-eager-load karena itu default aplikasi.
 *
 * Semua kunci yang dipakai komponen harus ada di `messages.ts` (error/validasi).
 * Kamus di `languages/` khusus untuk label UI.
 */
import { id as idDict } from './languages/id'

import { PUBLIC_DEFAULT_LANG } from '../config/public'

export { id as defaultDict } from './languages/id'
export { LANGUAGES } from './dictionaries'

export type LangCode = 'id' | 'en' | 'zh' | 'es' | 'ar' | 'hi' | 'fr' | 'ja' | 'ru' | 'pt'

export type Dictionary = typeof idDict

const loaders: Partial<Record<LangCode, () => Promise<Dictionary>>> = {
  en: () => import('./languages/en').then((m) => m.en as Dictionary),
  zh: () => import('./languages/zh').then((m) => m.zh as Dictionary),
  es: () => import('./languages/es').then((m) => m.es as Dictionary),
  ar: () => import('./languages/ar').then((m) => m.ar as Dictionary),
  hi: () => import('./languages/hi').then((m) => m.hi as Dictionary),
  fr: () => import('./languages/fr').then((m) => m.fr as Dictionary),
  ja: () => import('./languages/ja').then((m) => m.ja as Dictionary),
  ru: () => import('./languages/ru').then((m) => m.ru as Dictionary),
  pt: () => import('./languages/pt').then((m) => m.pt as Dictionary),
}

const ALL_CODES: LangCode[] = ['id', 'en', 'zh', 'es', 'ar', 'hi', 'fr', 'ja', 'ru', 'pt']

const STORAGE_KEY = 'sintya.lang'

export function isLang(value: string | undefined | null): value is LangCode {
  return !!value && ALL_CODES.includes(value as LangCode)
}

export function detectLang(): LangCode {
  if (typeof window === 'undefined') return PUBLIC_DEFAULT_LANG as LangCode

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (isLang(stored)) return stored

  const navigatorLang = window.navigator.language.slice(0, 2).toLowerCase()
  if (isLang(navigatorLang)) return navigatorLang

  return 'id'
}

const dictionaries: Partial<Record<LangCode, Dictionary>> = { id: idDict as Dictionary }

export async function loadLang(lang: LangCode): Promise<Dictionary> {
  const cached = dictionaries[lang]
  if (cached) return cached

  const loader = loaders[lang]
  const dict = loader ? await loader() : (idDict as Dictionary)

  dictionaries[lang] = dict
  return dict
}

export function getCachedLang(lang: LangCode): Dictionary | undefined {
  return dictionaries[lang]
}

export function persistLang(lang: LangCode) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, lang)
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

/**
 * Path lookup sederhana: `t('dashboard.total_balance')`.
 * Bila kunci hilang, mengembalikan kunci aslinya agar mudah dideteksi saat dev.
 */
export function makeT(dict: Dictionary) {
  return function t(path: string): string {
    const value = path.split('.').reduce<unknown>(
      (acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined),
      dict,
    )
    return typeof value === 'string' ? value : path
  }
}

export type TranslateFn = ReturnType<typeof makeT>