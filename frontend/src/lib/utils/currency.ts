/** Format angka & mata uang. IDR tanpa desimal, USD dengan 2 desimal. */

export type CurrencyCode = 'IDR' | 'USD'

export type CurrencyMeta = { code: string; name: string; symbol: string }

/** Registry mata uang yang dipertahankan dari aplikasi lama. */
export const CURRENCIES: CurrencyMeta[] = [
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
]

/**
 * Kurs cadangan dipakai hanya bila exchangerate tidak tersedia. Nilai ini
 * sengaja dibulatkan dan hanya untuk tampilan, bukan untuk pembukuan.
 */
export const FALLBACK_RATES: Record<string, number> = {
  IDR: 1,
  USD: 0.000062,
  EUR: 0.000057,
  GBP: 0.000049,
  JPY: 0.0097,
  SGD: 0.000084,
  AUD: 0.000094,
  MYR: 0.00029,
  CNY: 0.00045,
  KRW: 0.084,
}

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code
}

/** Konversi memakai kurs live bila ada, jatuh ke kurs cadangan bila tidak. */
export function getConvertedAmount(
  amount: number,
  targetCurrency: string,
  liveRates?: Record<string, number>,
): number {
  if (targetCurrency === 'IDR') return amount

  const rate = liveRates?.[targetCurrency] ?? FALLBACK_RATES[targetCurrency] ?? 1
  return amount * rate
}

const IDR_COMPACT = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const PLAIN = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

export function formatMoney(value: number, currency: CurrencyCode = 'IDR'): string {
  if (!Number.isFinite(value)) return currency === 'IDR' ? 'Rp0' : '$0.00'
  return currency === 'IDR' ? IDR_COMPACT.format(value) : USD.format(value)
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return PLAIN.format(value)
}

/** Versi ringkas untuk kartu statistik: Rp1,2 jt */
export function formatCompact(value: number, currency: CurrencyCode = 'IDR'): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs >= 1_000_000_000) return `${sign}${currency === 'IDR' ? 'Rp' : '$'}${(abs / 1_000_000_000).toFixed(1)} M`
  if (abs >= 1_000_000) return `${sign}${currency === 'IDR' ? 'Rp' : '$'}${(abs / 1_000_000).toFixed(1)} jt`
  if (abs >= 1_000) return `${sign}${currency === 'IDR' ? 'Rp' : '$'}${(abs / 1_000).toFixed(0)} rb`

  return formatMoney(value, currency)
}

export function formatAmountInput(value: string | number): string {
  if (value === '' || value === null || value === undefined) return ''
  const str = String(value)
  const digits = str.replace(/\D/g, '')
  if (!digits) return ''
  const trimmed = digits.replace(/^0+(?=\d)/, '')
  return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function parseAmount(input: string | number): number {
  if (typeof input === 'number') return Number.isFinite(input) ? input : 0
  if (!input) return 0
  const cleaned = input.replace(/[^\d,.-]/g, '')
  if (!cleaned) return 0

  if (cleaned.includes(',')) {
    const normalized = cleaned.replace(/\./g, '').replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const dotCount = (cleaned.match(/\./g) || []).length
  if (dotCount > 1) {
    const normalized = cleaned.replace(/\./g, '')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (dotCount === 1) {
    const parts = cleaned.split('.')
    if (parts[1]?.length === 3 && parts[0] !== '0') {
      const normalized = cleaned.replace(/\./g, '')
      const parsed = Number(normalized)
      return Number.isFinite(parsed) ? parsed : 0
    }
  }

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Persentase aman untuk indikator anggaran. */
export function percent(part: number, whole: number): number {
  if (!whole) return 0
  return Math.round((part / whole) * 100)
}