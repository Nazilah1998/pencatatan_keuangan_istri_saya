/**
 * Laporan: arus kas dan distribusi pengeluaran.
 *
 * Seluruh angka berasal dari endpoint agregasi Go Fiber. Ringkasan satu bulan
 * memakai ringkasan bulanan; rentang tahun memakai arus kas teragregasi per
 * bulan, bukan penjumlahan di komponen.
 */
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'

import { api, ApiError, ApiPaths } from '../../lib/api/client'
import type { Cashflow, CategoryReport, Insights } from '../../lib/api/types'
import { formatCompact, formatMoney } from '../../lib/utils/currency'
import { currentMonth, formatMonth, monthRange, shiftMonth } from '../../lib/utils/date'
import { useApp } from '../providers/useApp'
import { Button } from '../ui/Button'
import { Card, EmptyState, Skeleton, StatTile } from '../ui/Card'
import { Modal } from '../ui/Modal'

type Range = 'monthly' | 'yearly'

export function ReportsScreen() {
  const { t, m, session, isAuthed, ready } = useApp()
  const currency = session?.baseCurrency === 'USD' ? 'USD' : 'IDR'

  const [range, setRange] = useState<Range>('monthly')
  const [anchor, setAnchor] = useState(currentMonth())
  const [cashflow, setCashflow] = useState<Cashflow | null>(null)
  const [byCategory, setByCategory] = useState<CategoryReport | null>(null)
  const [insights, setInsights] = useState<Insights | null>(null)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')

  const { start, end } = monthRange(anchor)
  const year = anchor.slice(0, 4)

  const load = useCallback(async () => {
    if (!ready || !isAuthed) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')

    const from = range === 'monthly' ? start : `${year}-01-01`
    const to = range === 'monthly' ? end : `${year}-12-31`

    try {
      const [flow, categories] = await Promise.all([
        api.get<Cashflow>(ApiPaths.cashflow(from, to)),
        api.get<CategoryReport>(ApiPaths.categories(anchor, 'expense')),
      ])

      setCashflow(flow)
      setByCategory(categories)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : m('common.retry'))
    } finally {
      setLoading(false)
    }
  }, [anchor, end, isAuthed, m, range, ready, start, year])

  useEffect(() => {
    if (!ready || !isAuthed) return
    void load()
  }, [isAuthed, load, ready])

  async function loadInsights() {
    setAiLoading(true)

    try {
      setInsights(await api.post<Insights>(ApiPaths.insights, { month: anchor }))
      setInsightsOpen(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : m('ai.unavailable'))
    } finally {
      setAiLoading(false)
    }
  }

  const surplus = (cashflow?.income ?? 0) - (cashflow?.expense ?? 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(['monthly', 'yearly'] as Range[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={range === key}
            onClick={() => setRange(key)}
            className={[
              'h-10 rounded-[0.625rem] border text-sm font-medium transition-colors',
              range === key
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--line-subtle)] text-[var(--text-muted)] hover:border-[var(--line-strong)]',
            ].join(' ')}
          >
            {key === 'monthly' ? t('reports.monthly_report') : t('reports.yearly_report')}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="secondary"
          size="sm"
          aria-label={t('common.prev')}
          onClick={() => setAnchor(range === 'monthly' ? shiftMonth(anchor, -1) : shiftMonth(anchor, -12))}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>

        <p className="font-display text-sm font-semibold">
          {range === 'monthly' ? formatMonth(anchor) : year}
        </p>

        <Button
          variant="secondary"
          size="sm"
          aria-label={t('common.next')}
          onClick={() => setAnchor(range === 'monthly' ? shiftMonth(anchor, 1) : shiftMonth(anchor, 12))}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      {error && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--negative)]">{error}</p>
            <Button size="sm" variant="secondary" onClick={() => void load()}>
              {m('common.retry')}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        {!cashflow || loading ? (
          <>
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </>
        ) : (
          <>
            <StatTile
              label={t('reports.total_income')}
              value={formatCompact(cashflow.income, currency)}
              tone="positive"
              hint={t('reports.income_desc')}
            />
            <StatTile
              label={t('reports.total_expense')}
              value={formatCompact(cashflow.expense, currency)}
              tone="negative"
              hint={t('reports.expense_desc')}
            />
            <StatTile
              label={t('reports.surplus')}
              value={formatCompact(surplus, currency)}
              tone={surplus < 0 ? 'negative' : 'positive'}
            />
            <StatTile
              label={t('reports.total_expense')}
              value={formatCompact(byCategory?.total ?? 0, currency)}
              hint={t('reports.expense_by_category')}
            />
          </>
        )}
      </div>

      <Card title={t('reports.cash_flow')}>
        {loading ? <Skeleton className="h-32" /> : !cashflow || cashflow.daily.length === 0 ? (
          <EmptyState title={t('common.no_data')} />
        ) : (
          <FlowBars daily={cashflow.daily} currency={currency} t={t} />
        )}
      </Card>

      <Card title={t('reports.category_breakdown')}>
        {loading || !byCategory || byCategory.items.length === 0 ? (
          <EmptyState title={t('common.no_data')} />
        ) : (
          <ul className="space-y-3">
            {byCategory.items.map((item) => {
              const share = byCategory.total ? Math.round((item.total / byCategory.total) * 100) : 0

              return (
                <li key={item.category}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm">{item.category || t('common.total')}</span>
                    <span className="tnum shrink-0 text-xs text-[var(--text-muted)]">
                      {formatMoney(item.total, currency)} · {share}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-sunken)]"
                    role="progressbar"
                    aria-valuenow={share}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-[var(--negative)]"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          variant="secondary"
          loading={aiLoading}
          onClick={() => void loadInsights()}
        >
          {t('reports.ai_insights')}
        </Button>

        <Button
          variant="secondary"
          disabled={range !== 'monthly'}
          onClick={() => {
            if (range === 'monthly') {
              void api.download(ApiPaths.exportCsv(anchor), `transaksi-${anchor}.csv`)
            }
          }}
        >
          <Download className="size-4" aria-hidden />
          {t('reports.export_csv')}
        </Button>
      </div>

      <Modal open={insightsOpen} title={t('reports.ai_insights')} onClose={() => setInsightsOpen(false)}>
        {insights && (
          <div className="space-y-4">
            <p className="text-sm font-medium">{insights.headline}</p>

            {insights.bullets.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                {insights.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}

            {insights.advice.length > 0 && (
              <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                {insights.advice.map((item) => (
                  <li key={item} className="rounded-[0.625rem] bg-[var(--surface-sunken)] px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

function FlowBars({
  daily,
  currency,
  t,
}: {
  daily: { date: string; income: number; expense: number }[]
  currency: 'IDR' | 'USD'
  t: (path: string) => string
}) {
  const max = Math.max(1, ...daily.map((d) => Math.max(d.income, d.expense)))

  return (
    <div>
      <div className="flex h-32 items-end gap-1">
        {daily.map((d) => (
          <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
            <div
              className="w-full rounded-t-[2px] bg-[var(--accent)]"
              style={{ height: `${(d.income / max) * 100}%` }}
              title={`${d.date} · ${formatMoney(d.income, currency)}`}
            />
            <div
              className="w-full rounded-b-[2px] bg-[var(--negative)]"
              style={{ height: `${(d.expense / max) * 100}%` }}
              title={`${d.date} · ${formatMoney(d.expense, currency)}`}
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[var(--accent)]" aria-hidden />
          {t('common.income')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[var(--negative)]" aria-hidden />
          {t('common.expense')}
        </span>
      </div>
    </div>
  )
}