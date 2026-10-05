/** tipe payload laporan dari Go Fiber (lihat backend/internal/services). */
import type { CurrencyCode } from '../utils/currency'

export type Summary = {
  netWorth: number
  totalBalance: number
  income: number
  expense: number
  transfer: number
  net: number
  savingsTotal: number
  debtTotal: number
  month: string
  baseCurrency: CurrencyCode
}

export type Cashflow = {
  month: string
  income: number
  expense: number
  transfer: number
  net: number
  daily: { date: string; income: number; expense: number }[]
}

export type BudgetReport = {
  month: string
  totalLimit: number
  totalSpent: number
  remaining: number
  items: {
    id: string
    category: string
    limit: number
    spent: number
    percentage: number
    status: 'safe' | 'warning' | 'over'
  }[]
}

export type CategoryReport = {
  total: number
  items: { category: string; total: number; count: number }[]
}

export type Insights = {
  headline: string
  bullets: string[]
  advice: string[]
  generatedAt: string
}

export type PinStatus = { hasPin: boolean; hint: string }

export type ExportBundle = {
  version: number
  exportedAt: string
  collections: Record<string, Record<string, unknown>[]>
}