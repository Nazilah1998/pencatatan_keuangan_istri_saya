// Nilai publik yang boleh dibundel ke browser.
//
// Semua key diawali PUBLIC_ karena Astro hanya membocorkan key tersebut ke
// client bundle. Tidak ada secret di file ini; kredensial OAuth dan Gemini
// hanya hidup di backend.
const getEnv = (key: keyof ImportMetaEnv, fallback?: string): string => {
  if (typeof window !== 'undefined' && window.__PUBLIC_ENV__ && window.__PUBLIC_ENV__[key]) {
    return window.__PUBLIC_ENV__[key] ?? (fallback ?? '')
  }
  const val = import.meta.env[key]
  return typeof val === 'string' && val.length > 0 ? val : (fallback ?? '')
}

const trimSlash = (value?: string) => (value ? value.replace(/\/+$/, '') : '')

export const PUBLIC_PB_URL = trimSlash(getEnv('PUBLIC_PB_URL'))
export const PUBLIC_API_BASE = trimSlash(getEnv('PUBLIC_API_BASE'))
export const PUBLIC_APP_NAME = getEnv('PUBLIC_APP_NAME', 'Sintya Finance')
export const PUBLIC_DEFAULT_LANG = getEnv('PUBLIC_DEFAULT_LANG', 'id')
export const PUBLIC_TURNSTILE_SITE_KEY = getEnv('PUBLIC_TURNSTILE_SITE_KEY')