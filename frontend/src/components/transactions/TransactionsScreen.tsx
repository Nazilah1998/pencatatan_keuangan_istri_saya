/**
 * Layar transaksi: navigasi bulan, penyaring jenis, pencarian, dan daftar
 * transaksi yang dikelompokkan per tanggal.
 *
 * Angka ringkasan dihitung dari data yang sudah dimuat, bukan dari endpoint
 * agregasi, karena daftar ini sudah membawa seluruh transaksi bulan terpilih.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'

import {
  CategoryRepo,
  TxRepo,
  WalletRepo,
  type Transaction,
  type TxType,
} from '../../lib/api/repositories'
import { formatCompact, formatMoney, formatNumber } from '../../lib/utils/currency'
import { currentMonth, formatDate, formatMonth, shiftMonth } from '../../lib/utils/date'
import { useApp } from '../providers/useApp'
import { Button } from '../ui/Button'
import { Card, EmptyState, Skeleton } from '../ui/Card'
import { Input } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { TransactionForm } from './TransactionForm'

type Filter = TxType | 'all'

export function TransactionsScreen() {
  const { m, session, t } = useApp()
  const currency = session?.baseCurrency === 'USD' ? 'USD' : 'IDR'

  const [month, setMonth] = useState(currentMonth())
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<Transaction[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [composing, setComposing] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [tx, wallets, categories] = await Promise.all([
        TxRepo.listByMonth(month),
        WalletRepo.list(true),
        CategoryRepo.list(),
      ])

      setItems(tx)
      setNames({
        ...Object.fromEntries(wallets.map((w) => [w.id, w.name])),
        ...Object.fromEntries(categories.map((c) => [c.id, c.name])),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
    } finally {
      setLoading(false)
    }
  }, [month, m])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return items.filter((tx) => {
      if (filter !== 'all' && tx.type !== filter) return false
      if (!needle) return true

      return [tx.note, names[tx.category], names[tx.wallet], tx.amount]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })
  }, [items, filter, query, names])

  const totals = useMemo(() => {
    let income = 0
    let expense = 0

    for (const tx of items) {
      if (tx.type === 'income') income += tx.amount
      // Setoran tabungan (expense + savingsGoal) adalah alokasi, bukan
      // pengeluaran, jadi tidak ikut dihitung. Sama perlakuannya dengan
      // services.IsSavingsContribution di backend.
      else if (tx.type === 'expense' && !tx.savingsGoal) expense += tx.amount
    }

    return { income, expense, net: income - expense }
  }, [items])

  const groups = useMemo(() => {
    const byDate = new Map<string, Transaction[]>()

    for (const tx of filtered) {
      const key = tx.date.slice(0, 10)
      const bucket = byDate.get(key)
      if (bucket) bucket.push(tx)
      else byDate.set(key, [tx])
    }

    return [...byDate.entries()].map(([date, list]) => ({
      date,
      list,
      // Transfer dan setoran tabungan tidak menggerakkan saldo karena hanya
      // memindahkan uang milik sendiri, jadi tidak masuk total harian.
      total: list.reduce((sum, tx) => {
        if (tx.type === 'transfer' || tx.savingsGoal) return sum

        return sum + (tx.type === 'expense' ? -tx.amount : tx.amount)
      }, 0),
    }))
  }, [filtered])

  function closeModal() {
    setComposing(false)
    setEditing(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="secondary"
          size="sm"
          aria-label={t('common.prev')}
          onClick={() => setMonth(shiftMonth(month, -1))}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>

        <p className="font-display text-sm font-semibold">{formatMonth(month)}</p>

        <Button
          variant="secondary"
          size="sm"
          aria-label={t('common.next')}
          onClick={() => setMonth(shiftMonth(month, 1))}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="tile p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
            {t('common.income')}
          </p>
          <p className="tnum mt-1 text-sm font-semibold text-[var(--accent)]">
            {formatCompact(totals.income, currency)}
          </p>
        </div>
        <div className="tile p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
            {t('common.expense')}
          </p>
          <p className="tnum mt-1 text-sm font-semibold text-[var(--negative)]">
            {formatCompact(totals.expense, currency)}
          </p>
        </div>
        <div className="tile p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
            {t('common.total')}
          </p>
          <p className="tnum mt-1 text-sm font-semibold">
            {formatCompact(totals.net, currency)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]"
            aria-hidden
          />
          <Input
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('transactions.search_placeholder')}
            aria-label={t('common.search')}
          />
        </div>

        <Button onClick={() => setComposing(true)}>
          <Plus className="size-4" aria-hidden />
          {t('common.add')}
        </Button>
      </div>

      <div role="group" aria-label={t('transactions.title')} className="flex flex-wrap gap-2">
        {(['all', 'income', 'expense', 'transfer'] as Filter[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className={[
              'h-8 rounded-full border px-3 text-xs font-medium transition-colors',
              filter === key
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--line-subtle)] text-[var(--text-muted)] hover:border-[var(--line-strong)]',
            ].join(' ')}
          >
            {key === 'all' ? t('common.all') : t(`common.${key}`)}
          </button>
        ))}
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

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState title={t('transactions.empty_state')} hint={t('transactions.empty_subtitle')} />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Card key={group.date}>
              <header className="mb-2 flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold">{formatDate(group.date, 'short')}</h2>
                <span
                  className={[
                    'tnum text-xs font-medium',
                    group.total < 0 ? 'text-[var(--negative)]' : 'text-[var(--accent)]',
                  ].join(' ')}
                >
                  {group.total < 0 ? '−' : '+'}
                  {formatMoney(Math.abs(group.total), currency)}
                </span>
              </header>

              <ul className="divide-y divide-[var(--line-subtle)]">
                {group.list.map((tx) => (
                  <li key={tx.id}>
                    <button
                      type="button"
                      onClick={() => setEditing(tx)}
                      className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-sunken)]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {tx.note || names[tx.category] || names[tx.wallet] || t('common.total')}
                        </span>
                        <span className="block truncate text-xs text-[var(--text-muted)]">
                          {[t(`common.${tx.type}`), names[tx.wallet]].filter(Boolean).join(' · ')}
                        </span>
                      </span>

                      <span
                        className={[
                          'tnum shrink-0 text-sm font-semibold',
                          tx.type === 'income'
                            ? 'text-[var(--accent)]'
                            : tx.type === 'expense'
                              ? 'text-[var(--negative)]'
                              : '',
                        ].join(' ')}
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : ''}
                        {formatNumber(tx.amount)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={composing || !!editing}
        title={editing ? t('transactions.form.edit_title') : t('transactions.form.add_title')}
        onClose={closeModal}
      >
        <TransactionForm
          editing={editing}
          defaultType="expense"
          onDone={() => {
            closeModal()
            void load()
          }}
        />
      </Modal>
    </div>
  )
}