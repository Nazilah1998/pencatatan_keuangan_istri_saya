/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare global {
  interface Window {
    __PUBLIC_ENV__?: Record<string, string | undefined>
  }

  interface ImportMetaEnv {
    readonly PUBLIC_PB_URL: string
    readonly PUBLIC_API_BASE: string
    readonly PUBLIC_APP_NAME: string
    readonly PUBLIC_DEFAULT_LANG: string
    readonly PUBLIC_TURNSTILE_SITE_KEY?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

declare const __API_BASE__: string
declare const __PB_URL__: string

export {}