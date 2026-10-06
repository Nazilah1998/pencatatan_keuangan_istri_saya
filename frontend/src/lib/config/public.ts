// Nilai publik yang boleh dibundel ke browser.
//
// Semua key diawali PUBLIC_ karena Astro hanya membocorkan key tersebut ke
// client bundle. Tidak ada secret di file ini; kredensial OAuth dan Gemini
// hanya hidup di backend.
const trimSlash = (value?: string) => (value ? value.replace(/\/+$/, '') : '')

export const PUBLIC_PB_URL = trimSlash(import.meta.env.PUBLIC_PB_URL)
export const PUBLIC_API_BASE = trimSlash(import.meta.env.PUBLIC_API_BASE)
export const PUBLIC_APP_NAME = import.meta.env.PUBLIC_APP_NAME ?? 'Sintya Finance'
export const PUBLIC_DEFAULT_LANG = import.meta.env.PUBLIC_DEFAULT_LANG ?? 'id'