/** Format tanggal & bulan dalam Bahasa Indonesia, tanpa dependensiEksternal. */

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const WEEKDAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export function toDate(value: string | Date): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null

    const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (ymdMatch && trimmed.length <= 10) {
      const y = Number(ymdMatch[1])
      const m = Number(ymdMatch[2]) - 1
      const d = Number(ymdMatch[3])
      const date = new Date(Date.UTC(y, m, d))
      return Number.isNaN(date.getTime()) ? null : date
    }

    const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T')
    const hasTz = normalized.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(normalized)
    const withTz = hasTz ? normalized : `${normalized}Z`
    const parsed = new Date(withTz)
    if (!Number.isNaN(parsed.getTime())) return parsed

    const fallback = new Date(trimmed)
    if (!Number.isNaN(fallback.getTime())) return fallback
  }

  return null
}

export function formatDate(value: string | Date, style: 'long' | 'short' = 'long'): string {
  const date = toDate(value)
  if (!date) return '-'

  if (style === 'short') {
    return `${date.getUTCDate()} ${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear()}`
  }

  return `${WEEKDAYS[date.getUTCDay()]}, ${date.getUTCDate()} ${MONTHS_ID[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

export function formatMonth(month: string): string {
  const [year, mon] = month.split('-')
  const index = Number(mon) - 1
  if (!year || Number.isNaN(index) || index < 0 || index > 11) return month
  return `${MONTHS_ID[index]} ${year}`
}

export function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function parseMonth(month: string): { year: number; mon: number } {
  const [year = 1970, mon = 1] = month.split('-').map(Number)
  return { year, mon }
}

export function shiftMonth(month: string, delta: number): string {
  const { year, mon } = parseMonth(month)
  const date = new Date(year, mon - 1 + delta, 1)

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthRange(month: string): { start: string; end: string } {
  const { year, mon } = parseMonth(month)
  const lastDay = new Date(year, mon, 0).getDate()

  return {
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, '0')}`,
  }
}

export function todayISO(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}