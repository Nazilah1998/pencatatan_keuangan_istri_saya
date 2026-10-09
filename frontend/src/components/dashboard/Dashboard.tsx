/**
 * Dasbor: kartu ringkasan, arus kas bulanan, anggaran terdekat, dan transaksi
 * terakhir. Semua angka berasal dari endpoint agregasi Go Fiber, bukan dari
 * penjumlahan di komponen.
 */
import { useCallback, useEffect, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Landmark, PiggyBank, Wallet } from 'lucide-react'

import { api, ApiError, ApiPaths } from '../../lib/api/client'
import type { BudgetReport, Cashflow, Summary } from '../../lib/api/types'
import {
  BudgetRepo,
  CategoryRepo,
  DebtRepo,
  SavingsRepo,
  TxRepo,
  WalletRepo,
  type Transaction,
} from '../../lib/api/repositories'
import { formatCompact, formatMoney } from '../../lib/utils/currency'
import { currentMonth, formatMonth, monthRange, todayISO } from '../../lib/utils/date'
import { useApp } from '../providers/useApp'
import { Button } from '../ui/Button'
import { Card, EmptyState, Skeleton, StatTile } from '../ui/Card'

export function Dashboard() {
  const { t, m, session, isAuthed, ready } = useApp()
  const currency = session?.baseCurrency === 'USD' ? 'USD' : 'IDR'
  const [mounted, setMounted] = useState(false)

  const [summary, setSummary] = useState<Summary | null>(null)
  const [flow, setFlow] = useState<Cashflow | null>(null)
  const [budget, setBudget] = useState<BudgetReport | null>(null)
  const [recent, setRecent] = useState<Transaction[]>([])
  const [wallets, setWallets] = useState<Record<string, string>>({})
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const month = currentMonth()

  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    setMounted(true)
    const hour = new Date().getHours()
    setGreeting(
      hour < 11
        ? t('dashboard.greeting_morning')
        : hour < 15
          ? t('dashboard.greeting_afternoon')
          : hour < 18
            ? t('dashboard.greeting_evening')
            : t('dashboard.greeting_night'),
    )
  }, [t])

  const load = useCallback(async () => {
    if (!ready || !isAuthed) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')

    try {
      const { start, end } = monthRange(month)

      const [sRes, cRes, bRes, tx, w, bList, savings, debts, categories] = await Promise.all([
        api.get<Summary>(ApiPaths.summary(month)).catch(() => null),
        api.get<Cashflow>(ApiPaths.cashflow(start, end)).catch(() => null),
        api.get<BudgetReport>(ApiPaths.budget(month)).catch(() => null),
        TxRepo.listByMonth(month).catch(() => []),
        WalletRepo.list(true).catch(() => []),
        BudgetRepo.listByMonth(month).catch(() => []),
        SavingsRepo.list(true).catch(() => []),
        DebtRepo.list(false).catch(() => []),
        CategoryRepo.list().catch(() => []),
      ])

      const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))
      setCategoryMap(catMap)

      const localIncome = tx.filter((item) => item.type === 'income').reduce((acc, item) => acc + item.amount, 0)
      const localExpense = tx.filter((item) => item.type === 'expense').reduce((acc, item) => acc + item.amount, 0)
      const localTransfer = tx.filter((item) => item.type === 'transfer').reduce((acc, item) => acc + item.amount, 0)

      let calculatedWalletTotal = 0
      for (const wallet of w) {
        if (!wallet.includeInNetWorth || wallet.isArchived) continue
        let bal = wallet.balance || 0
        if (bal === 0) {
          const inTx = tx.filter((t) => t.wallet === wallet.id && t.type === 'income').reduce((acc, t) => acc + t.amount, 0)
          const outTx = tx.filter((t) => t.wallet === wallet.id && t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)
          const trfOut = tx.filter((t) => t.wallet === wallet.id && t.type === 'transfer').reduce((acc, t) => acc + t.amount, 0)
          const trfIn = tx.filter((t) => t.toWallet === wallet.id && t.type === 'transfer').reduce((acc, t) => acc + t.amount, 0)
          const netTx = inTx - outTx - trfOut + trfIn
          bal = (wallet.initialBalance || 0) + netTx
        }
        calculatedWalletTotal += bal
      }

      if (calculatedWalletTotal === 0 && (localIncome > 0 || localExpense > 0)) {
        const initialSum = w.filter((x) => x.includeInNetWorth && !x.isArchived).reduce((acc, x) => acc + (x.initialBalance || 0), 0)
        calculatedWalletTotal = initialSum + (localIncome - localExpense)
      }

      const localSavingsTotal = savings.reduce((acc, s) => {
        let amt = s.currentAmount || 0
        if (amt === 0) {
          const fromTx = tx.filter((t) => t.savingsGoal === s.id).reduce((sum, t) => sum + t.amount, 0)
          amt = fromTx
        }
        return acc + amt
      }, 0)

      const localSavingsInNetWorth = savings
        .filter((s) => s.includeInNetWorth)
        .reduce((acc, s) => {
          let amt = s.currentAmount || 0
          if (amt === 0) {
            const fromTx = tx.filter((t) => t.savingsGoal === s.id).reduce((sum, t) => sum + t.amount, 0)
            amt = fromTx
          }
          return acc + amt
        }, 0)

      const localDebtTotal = debts
        .filter((d) => d.status !== 'paid')
        .reduce((acc, d) => acc + (d.currentBalance ?? d.principal ?? 0), 0)

      const calculatedNetWorth = calculatedWalletTotal + localSavingsInNetWorth - localDebtTotal

      const sAny = sRes as Record<string, unknown> | null
      const resNetWorth = sAny?.netWorth ?? (sAny?.net_worth as Record<string, unknown> | undefined)?.net ?? null
      const resTotalBalance = sAny?.totalBalance ?? (sAny?.net_worth as Record<string, unknown> | undefined)?.assets ?? null
      const resIncome = sAny?.income ?? null
      const resExpense = sAny?.expense ?? null
      const resSavingsTotal = sAny?.savingsTotal ?? sAny?.savings_total ?? (sAny?.net_worth as Record<string, unknown> | undefined)?.savings_total ?? null
      const resDebtTotal = sAny?.debtTotal ?? sAny?.debt_total ?? (sAny?.net_worth as Record<string, unknown> | undefined)?.liabilities ?? null

      const finalNetWorth = (resNetWorth !== null && resNetWorth !== 0) ? Number(resNetWorth) : calculatedNetWorth
      const finalTotalBalance = (resTotalBalance !== null && resTotalBalance !== 0) ? Number(resTotalBalance) : calculatedWalletTotal
      const finalIncome = (resIncome !== null && resIncome !== 0) ? Number(resIncome) : localIncome
      const finalExpense = (resExpense !== null && resExpense !== 0) ? Number(resExpense) : localExpense
      const finalSavingsTotal = (resSavingsTotal !== null && resSavingsTotal !== 0) ? Number(resSavingsTotal) : localSavingsTotal
      const finalDebtTotal = (resDebtTotal !== null && resDebtTotal !== 0) ? Number(resDebtTotal) : localDebtTotal

      const s: Summary = {
        netWorth: finalNetWorth,
        totalBalance: finalTotalBalance,
        income: finalIncome,
        expense: finalExpense,
        transfer: (sAny?.transfer as number | undefined) ?? localTransfer,
        net: finalIncome - finalExpense,
        savingsTotal: finalSavingsTotal,
        debtTotal: finalDebtTotal,
        month,
        baseCurrency: currency,
      }

      let dailyList = cRes?.daily ?? []
      if (dailyList.length === 0 && tx.length > 0) {
        const dayMap = new Map<string, { date: string; income: number; expense: number }>()
        for (const item of tx) {
          const d = item.date ? item.date.slice(0, 10) : todayISO()
          const existing = dayMap.get(d) ?? { date: d, income: 0, expense: 0 }
          if (item.type === 'income') existing.income += item.amount
          else if (item.type === 'expense') existing.expense += item.amount
          dayMap.set(d, existing)
        }
        dailyList = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date))
      }

      const c: Cashflow = {
        month,
        income: cRes?.income || finalIncome,
        expense: cRes?.expense || finalExpense,
        transfer: cRes?.transfer || (sAny?.transfer as number | undefined) || localTransfer,
        net: (cRes?.income || finalIncome) - (cRes?.expense || finalExpense),
        daily: dailyList,
      }

      let budgetItems: BudgetReport['items'] = []

      if (bList.length > 0) {
        budgetItems = bList.map((item) => {
          const spent = tx
            .filter((tItem) => tItem.category === item.category && tItem.type === 'expense')
            .reduce((acc, tItem) => acc + tItem.amount, 0)
          const pct = item.amount > 0 ? (spent / item.amount) * 100 : 0
          return {
            id: item.id,
            category: catMap[item.category] || item.category,
            limit: item.amount,
            spent,
            percentage: pct,
            status: pct > 100 ? ('over' as const) : pct >= 80 ? ('warning' as const) : ('safe' as const),
          }
        })
      } else if (bRes && Array.isArray((bRes as unknown as Record<string, unknown>).items) && ((bRes as unknown as Record<string, unknown>).items as unknown[]).length > 0) {
        budgetItems = ((bRes as unknown as Record<string, unknown>).items as Record<string, unknown>[]).map((item) => {
          const catId = (item.category_id as string) || (item.category as string) || ''
          const catName = catMap[catId] || (item.category as string) || catId || t('common.total')
          const limit = Number(item.limit ?? 0)
          const spent = Number(item.spent ?? 0)
          const pct = (item.percentage as number) ?? (item.percent as number) ?? (limit > 0 ? (spent / limit) * 100 : 0)
          return {
            id: (item.id as string) || catId || Math.random().toString(),
            category: catName,
            limit,
            spent,
            percentage: pct,
            status: ((item.status as string) === 'over' || (item.status as string) === 'warning' || (item.status as string) === 'safe')
              ? (item.status as 'over' | 'warning' | 'safe')
              : (pct > 100 ? 'over' : pct >= 80 ? 'warning' : 'safe'),
          }
        })
      } else if (localExpense > 0) {
        const expCats = new Map<string, number>()
        for (const tItem of tx) {
          if (tItem.type === 'expense' && tItem.category) {
            expCats.set(tItem.category, (expCats.get(tItem.category) ?? 0) + tItem.amount)
          }
        }
        budgetItems = Array.from(expCats.entries()).map(([catId, spent]) => ({
          id: catId,
          category: catMap[catId] || catId,
          limit: 0,
          spent,
          percentage: 100,
          status: 'safe' as const,
        }))
      }

      const bTotalLimit = budgetItems.reduce((acc, item) => acc + item.limit, 0)
      const bTotalSpent = budgetItems.reduce((acc, item) => acc + item.spent, 0)

      const bResAny = bRes as Record<string, unknown> | null
      const b: BudgetReport = {
        month,
        totalLimit: (bResAny?.totalLimit as number) ?? (bResAny?.total_limit as number) ?? bTotalLimit,
        totalSpent: (bResAny?.totalSpent as number) ?? (bResAny?.total_spent as number) ?? bTotalSpent,
        remaining: Math.max(0, bTotalLimit - bTotalSpent),
        items: budgetItems,
      }

      setSummary(s)
      setFlow(c)
      setBudget(b)
      setRecent(tx.slice(0, 5))
      setWallets(Object.fromEntries(w.map((item) => [item.id, item.name])))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : m('common.retry'))
    } finally {
      setLoading(false)
    }
  }, [currency, isAuthed, m, month, ready, t])

  useEffect(() => {
    if (!ready || !isAuthed) return
    void load()
    const onTxCreated = () => {
      void load()
    }
    window.addEventListener('tx:created', onTxCreated)
    return () => {
      window.removeEventListener('tx:created', onTxCreated)
    }
  }, [isAuthed, load, ready])

  return (
    <div className="space-y-4">
      <p className="min-h-[1.25rem] text-sm text-[var(--text-muted)]">
        {mounted ? (greeting + (session?.name ? `, ${session.name}` : '')) : ''}
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
        {loading ? (
          <Skeleton className="h-32" />
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--surface-sunken)] text-[var(--text-muted)]">
              <Wallet className="size-5" />
            </span>
            <p className="mt-2 font-display text-sm font-semibold text-[var(--text-primary)]">
              {t('transactions.empty_state')}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {t('transactions.empty_subtitle')}
            </p>
            <a
              href="/transaksi"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3.5 py-1.5 font-display text-xs font-bold text-[var(--text-inverted)] shadow-xs transition-transform hover:opacity-90 active:scale-95"
            >
              + Catat Transaksi
            </a>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--line-subtle)]">
            {recent.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid size-9 shrink-0 place-items-center rounded-[0.625rem] bg-[var(--surface-sunken)] text-[var(--text-muted)]">
                  <Wallet className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {tx.note || categoryMap[tx.category] || tx.category || t('transactions.form.type')}
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
  const weeks = [
    { label: 'Mgg 1', range: '1-7', income: 0, expense: 0 },
    { label: 'Mgg 2', range: '8-14', income: 0, expense: 0 },
    { label: 'Mgg 3', range: '15-21', income: 0, expense: 0 },
    { label: 'Mgg 4', range: '22-28', income: 0, expense: 0 },
    { label: 'Mgg 5', range: '29-31', income: 0, expense: 0 },
  ]

  for (const d of daily) {
    const dayNum = parseInt(d.date.slice(8, 10), 10) || 1
    const idx = dayNum <= 7 ? 0 : dayNum <= 14 ? 1 : dayNum <= 21 ? 2 : dayNum <= 28 ? 3 : 4
    const targetWeek = weeks[idx]
    if (targetWeek) {
      targetWeek.income += d.income
      targetWeek.expense += d.expense
    }
  }

  const maxVal = Math.max(1, ...weeks.flatMap((w) => [w.income, w.expense]))
  const chartHeightPx = 120

  return (
    <div className="pt-2">
      <div className="grid grid-cols-5 gap-2 border-b border-[var(--line-subtle)] pb-2">
        {weeks.map((w, i) => {
          const incHeight = w.income > 0 ? Math.max(8, Math.round((w.income / maxVal) * chartHeightPx)) : 0
          const expHeight = w.expense > 0 ? Math.max(8, Math.round((w.expense / maxVal) * chartHeightPx)) : 0

          return (
            <div key={i} className="flex flex-col items-center">
              <div
                className="flex w-full items-end justify-center gap-1 sm:gap-2"
                style={{ height: `${chartHeightPx}px` }}
              >
                <div
                  className="w-3 sm:w-4 rounded-t-sm bg-[var(--accent)] transition-all duration-300"
                  style={{ height: `${incHeight}px` }}
                  title={`${w.label} (Pemasukan): ${formatMoney(w.income, currency)}`}
                />
                <div
                  className="w-3 sm:w-4 rounded-t-sm bg-[var(--negative)] transition-all duration-300"
                  style={{ height: `${expHeight}px` }}
                  title={`${w.label} (Pengeluaran): ${formatMoney(w.expense, currency)}`}
                />
              </div>

              <div className="mt-2 text-center">
                <span className="block font-display text-[0.6875rem] font-semibold text-[var(--text-primary)]">
                  {w.label}
                </span>
                <span className="block text-[0.625rem] text-[var(--text-muted)]">
                  {w.range}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="size-2.5 rounded-full bg-[var(--accent)]" aria-hidden />
          {t('common.income')}
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="size-2.5 rounded-full bg-[var(--negative)]" aria-hidden />
          {t('common.expense')}
        </span>
      </div>
    </div>
  )
}