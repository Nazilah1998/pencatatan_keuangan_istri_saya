/**
 * Dasbor: kartu ringkasan, arus kas bulanan, anggaran terdekat, dan transaksi
 * terakhir. Semua angka berasal dari endpoint agregasi Go Fiber, bukan dari
 * penjumlahan di komponen.
 */
import { useCallback, useEffect, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Landmark, PiggyBank, Wallet } from 'lucide-react'

import { api, ApiError, ApiPaths } from '../../lib/api/client'
import type { BudgetReport, Cashflow, Summary } from '../../lib/api/types'
import { TxRepo, WalletRepo, type Transaction } from '../../lib/api/repositories'
import { formatCompact, formatMoney } from '../../lib/utils/currency'
import { currentMonth, formatMonth } from '../../lib/utils/date'
import { useApp } from '../providers/useApp'
import { Button } from '../ui/Button'
import { Card, EmptyState, Skeleton, StatTile } from '../ui/Card'

export function Dashboard() {
  const { t, m, session } = useApp()
  const currency = session?.baseCurrency === 'USD' ? 'USD' : 'IDR'

  const [summary, setSummary] = useState<Summary | null>(null)
  const [flow, setFlow] = useState<Cashflow | null>(null)
  const [budget, setBudget] = useState<BudgetReport | null>(null)
  const [recent, setRecent] = useState<Transaction[]>([])
  const [wallets, setWallets] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const month = currentMonth()

  const load = useCallback(async () => {
    setError('')

    try {
      const [s, c, b, tx, w] = await Promise.all([
        api.get<Summary>(ApiPaths.summary(month)),
        api.get<Cashflow>(ApiPaths.cashflow(month, month)),
        api.get<BudgetReport>(ApiPaths.budget(month)),
        TxRepo.listByMonth(month),
        WalletRepo.list(true),
      ])

      setSummary(s)
      setFlow(c)
      setBudget(b)
      setRecent(tx.slice(0, 5))
      setWallets(Object.fromEntries(w.map((item) => [item.id, item.name])))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : m('common.retry'))
    }
  }, [month, t])

  useEffect(() => {
    void load()
  }, [load])

  const hour = new Date().getHours()
  const greeting =
    hour < 11
      ? t('dashboard.greeting_morning')
      : hour < 15
        ? t('dashboard.greeting_afternoon')
        : hour < 18
          ? t('dashboard.greeting_evening')
          : t('dashboard.greeting_night')

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        {greeting}
        {session?.name ? `, ${session.name}` : ''}
      </p>

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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {!summary ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <StatTile
              label={t('dashboard.total_balance')}
              value={formatMoney(summary.netWorth, currency)}
              icon={<Landmark className="size-4" aria-hidden />}
            />
            <StatTile
              label={t('common.income')}
              value={formatCompact(summary.income, currency)}
              tone="positive"
              icon={<ArrowUpRight className="size-4" aria-hidden />}
            />
            <StatTile
              label={t('common.expense')}
              value={formatCompact(summary.expense, currency)}
              tone="negative"
              icon={<ArrowDownRight className="size-4" aria-hidden />}
            />
            <StatTile
              label={t('dashboard.savings')}
              value={formatCompact(summary.savingsTotal, currency)}
              icon={<PiggyBank className="size-4" aria-hidden />}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card
          className="lg:col-span-3"
          title={t('dashboard.weekly_flow')}
          subtitle={formatMonth(month)}
        >
          {!flow ? (
            <Skeleton className="h-40" />
          ) : flow.daily.length === 0 ? (
            <EmptyState title={t('common.no_data')} />
          ) : (
            <CashflowChart daily={flow.daily} currency={currency} t={t} />
          )}
        </Card>

        <Card className="lg:col-span-2" title={t('sidebar.budget')}>
          {!budget ? (
            <Skeleton className="h-40" />
          ) : budget.items.length === 0 ? (
            <EmptyState title={t('common.no_data')} hint={t('budget.subtitle')} />
          ) : (
            <ul className="space-y-3">
              {budget.items.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm">{item.category || t('common.total')}</span>
                    <span className="tnum shrink-0 text-xs text-[var(--text-muted)]">
                      {formatCompact(item.spent, currency)} / {formatCompact(item.limit, currency)}
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-sunken)]"
                    role="progressbar"
                    aria-valuenow={Math.min(item.percentage, 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full transition-[width]"
                      style={{
                        width: `${Math.min(item.percentage, 100)}%`,
                        backgroundColor:
                          item.status === 'over'
                            ? 'var(--negative)'
                            : item.status === 'warning'
                              ? 'var(--warning)'
                              : 'var(--accent)',
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card
        title={t('dashboard.recent_transactions')}
        action={
          <a href="/transaksi" className="text-sm font-medium text-[var(--accent)] hover:underline">
            {t('dashboard.see_all')}
          </a>
        }
      >
        {!recent.length ? (
          <Skeleton className="h-32" />
        ) : recent.length === 0 ? (
          <EmptyState title={t('common.no_data')} />
        ) : (
          <ul className="divide-y divide-[var(--line-subtle)]">
            {recent.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid size-9 shrink-0 place-items-center rounded-[0.625rem] bg-[var(--surface-sunken)] text-[var(--text-muted)]">
                  <Wallet className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {tx.note || tx.category || t('transactions.form.type')}
                  </span>
                  <span className="block truncate text-xs text-[var(--text-muted)]">
                    {tx.date.slice(0, 10)} · {wallets[tx.wallet] ?? t('common.total')}
                  </span>
                </span>
                <span
                  className={[
                    'tnum shrink-0 text-sm font-semibold',
                    tx.type === 'income' ? 'text-[var(--accent)]' : tx.type === 'expense' ? 'text-[var(--negative)]' : '',
                  ].join(' ')}
                >
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : ''}
                  {formatMoney(tx.amount, currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function CashflowChart({
  daily,
  currency,
  t,
}: {
  daily: { date: string; income: number; expense: number }[]
  currency: 'IDR' | 'USD'
  t: (path: string) => string
}) {
  const max = Math.max(1, ...daily.flatMap((d) => [d.income, d.expense]))

  return (
    <div>
      <div className="flex h-40 items-end gap-1">
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