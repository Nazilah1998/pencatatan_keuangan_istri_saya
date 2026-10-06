/**
 * Klien HTTP untuk Go Fiber (endpoint agregasi, ekspor, AI, PIN).
 *
 * Hanya file ini yang boleh melakukan fetch ke backend. Komponen memanggil
 * fungsi di sini, bukan fetch langsung.
 */
import { PUBLIC_API_BASE } from '../config/public'
import { AuthStore } from '../pb/authStore'

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type Envelope<T> = {
  ok: boolean
  data?: T
  error?: { code: string; message: string }
  meta?: { total: number }
}

/** Token sesi; `AuthStore` sudah disinkronkan dengan `pb.authStore`. */
function authToken(): string {
  return AuthStore.get()?.token ?? ''
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')

  const token = authToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${PUBLIC_API_BASE}${path}`, { ...init, headers })

  if (res.status === 204) return undefined as T

  const text = await res.text()

  let parsed: Envelope<T> | null = null
  try {
    parsed = text ? (JSON.parse(text) as Envelope<T>) : null
  } catch {
    throw new ApiError(res.status, 'invalid_response', 'Respons server tidak valid.')
  }

  if (!res.ok || !parsed?.ok) {
    throw new ApiError(
      res.status,
      parsed?.error?.code ?? 'request_failed',
      parsed?.error?.message ?? 'Permintaan gagal. Coba lagi sebentar.',
    )
  }

  return parsed.data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'DELETE', body: body === undefined ? undefined : JSON.stringify(body) }),

  /** Unduh berkas dari backend (export JSON/CSV). */
  async download(path: string, fallbackName: string) {
    const headers = new Headers()
    const token = authToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const res = await fetch(`${PUBLIC_API_BASE}${path}`, { headers })
    if (!res.ok) throw new ApiError(res.status, 'download_failed', 'Gagal mengunduh berkas')

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = res.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] ?? fallbackName
    anchor.click()
    URL.revokeObjectURL(url)
  },
}

export const ApiPaths = {
  me: '/me',
  summary: (month: string) => `/reports/summary?month=${month}`,
  cashflow: (start: string, end: string) => `/reports/cashflow?start=${start}&end=${end}`,
  budget: (month: string) => `/reports/budget?month=${month}`,
  categories: (month: string, type = 'expense') => `/reports/categories?month=${month}&type=${type}`,
  pinStatus: '/auth/pin',
  pinSet: '/auth/pin',
  pinVerify: '/auth/pin/verify',
  turnstileVerify: '/auth/turnstile/verify',
  insights: '/ai/insights',
  restore: '/restore',
  exportAll: '/export',
  exportCsv: (month: string) => `/export/transactions.csv?month=${month}`,
} as const