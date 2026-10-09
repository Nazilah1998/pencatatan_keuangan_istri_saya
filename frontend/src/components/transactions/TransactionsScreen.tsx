import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'

import {
  CategoryRepo,
  TxRepo,
  WalletRepo,
  type Transaction,
  type TxType,
} from '../../lib/api/repositories'
import { formatMoney, type CurrencyCode } from '../../lib/utils/currency'
import { currentMonth, formatDate, formatMonth, shiftMonth } from '../../lib/utils/date'
import { useApp } from '../providers/useApp'
import { Button } from '../ui/Button'
import { Card, Skeleton } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { TransactionForm } from './TransactionForm'
import { confirmDelete } from '../../lib/state/confirm'

type Filter = TxType | 'all'

function TransactionRow({
  tx,
  names,
  currency = 'IDR',
  onEdit,
  onDelete,
}: {
  tx: Transaction
  names: Record<string, string>
  currency?: CurrencyCode
  onEdit: (tx: Transaction) => void
  onDelete: (id: string) => void
}) {
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const startX = useRef(0)
  const startY = useRef(0)
  const startOffset = useRef(0)
  const isHorizontal = useRef<boolean | null>(null)
  const isPointerDown = useRef(false)
  const didSwipe = useRef(false)
  const lastTouchTime = useRef(0)

  const isIncome = tx.type === 'income'
  const isExpense = tx.type === 'expense'
  const isTransfer = tx.type === 'transfer'

  function onDragStart(clientX: number, clientY: number) {
    startX.current = clientX
    startY.current = clientY
    startOffset.current = offsetX
    isHorizontal.current = null
    isPointerDown.current = true
    didSwipe.current = false
  }

  function onDragMove(clientX: number, clientY: number) {
    if (!isPointerDown.current) return
    const diffX = clientX - startX.current
    const diffY = clientY - startY.current

    if (isHorizontal.current === null) {
      if (Math.abs(diffX) > 6 && Math.abs(diffX) > Math.abs(diffY)) {
        isHorizontal.current = true
        setIsDragging(true)
      } else if (Math.abs(diffY) > 12 && Math.abs(diffY) > Math.abs(diffX) * 1.5) {
        isHorizontal.current = false
      }
    }

    if (isHorizontal.current === true) {
      didSwipe.current = true
      let next = startOffset.current + diffX
      if (next > 80) next = 80 + (next - 80) * 0.2
      if (next < -80) next = -80 + (next + 80) * 0.2
      setOffsetX(Math.max(-95, Math.min(95, next)))
    }
  }

  function onDragEnd() {
    if (!isPointerDown.current) return
    isPointerDown.current = false
    setIsDragging(false)

    if (isHorizontal.current === true) {
      if (offsetX < -35) {
        setOffsetX(-80)
      } else if (offsetX > 35) {
        setOffsetX(80)
      } else {
        setOffsetX(0)
      }
    }
    isHorizontal.current = null
  }

  function handleTouchStart(e: React.TouchEvent) {
    lastTouchTime.current = Date.now()
    const touch = e.touches[0]
    if (!touch) return
    onDragStart(touch.clientX, touch.clientY)
  }

  function handleTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0]
    if (!touch) return
    onDragMove(touch.clientX, touch.clientY)
  }

  function handleTouchEnd() {
    onDragEnd()
  }

  function handleTouchCancel() {
    onDragEnd()
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (Date.now() - lastTouchTime.current < 500) return
    if (e.button !== 0) return
    onDragStart(e.clientX, e.clientY)
  }

  function handleMouseMove(e: React.MouseEvent) {
    onDragMove(e.clientX, e.clientY)
  }

  function handleMouseUp() {
    onDragEnd()
  }

  function handleMouseLeave() {
    if (isPointerDown.current) {
      onDragEnd()
    }
  }

  function handleItemClick(e: React.MouseEvent) {
    if (didSwipe.current) {
      e.preventDefault()
      e.stopPropagation()
      didSwipe.current = false
      return
    }
    if (offsetX !== 0) {
      e.preventDefault()
      e.stopPropagation()
      setOffsetX(0)
      return
    }
    onEdit(tx)
  }

  return (
    <li className="relative overflow-hidden bg-[var(--surface-sunken)]">
      <div
        className={[
          'absolute inset-y-0 left-0 z-0 flex w-20 items-center justify-center bg-[var(--accent)] text-[var(--text-inverted)] transition-opacity',
          offsetX > 0 ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={() => {
            setOffsetX(0)
            onEdit(tx)
          }}
          className="flex h-full w-full flex-col items-center justify-center gap-1 font-display text-xs font-bold"
          aria-label="Edit transaksi"
        >
          <Pencil className="size-4" />
          <span>Edit</span>
        </button>
      </div>

      <div
        className={[
          'absolute inset-y-0 right-0 z-0 flex w-20 items-center justify-center bg-[var(--negative)] text-[var(--text-inverted)] transition-opacity',
          offsetX < 0 ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={() => {
            setOffsetX(0)
            onDelete(tx.id)
          }}
          className="flex h-full w-full flex-col items-center justify-center gap-1 font-display text-xs font-bold"
          aria-label="Hapus transaksi"
        >
          <Trash2 className="size-4" />
          <span>Hapus</span>
        </button>
      </div>

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="group relative z-10 flex w-full select-none items-center gap-3 bg-[var(--surface-raised)] px-4 py-3 text-left transition-colors hover:bg-[var(--surface-sunken)]/60 touch-pan-y cursor-grab active:cursor-grabbing"
      >
        <button
          type="button"
          onClick={handleItemClick}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div
            className={[
              'grid size-10 shrink-0 place-items-center rounded-xl font-bold transition-transform group-hover:scale-105',
              isIncome
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : isExpense
                  ? 'bg-[var(--negative-soft)] text-[var(--negative)]'
                  : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)]',
            ].join(' ')}
          >
            {isIncome ? (
              <ArrowDownLeft className="size-5" />
            ) : isExpense ? (
              <ArrowUpRight className="size-5" />
            ) : (
              <ArrowLeftRight className="size-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold text-[var(--text-primary)]">
              {tx.note || names[tx.category] || (isTransfer ? 'Transfer Antar Dompet' : 'Transaksi')}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.6875rem] text-[var(--text-muted)]">
              <span className="rounded-md bg-[var(--surface-sunken)] px-1.5 py-0.2 font-medium text-[var(--text-secondary)]">
                {names[tx.wallet] || 'Dompet'}
              </span>
              {isTransfer && names[tx.toWallet] && (
                <>
                  <span>➔</span>
                  <span className="rounded-md bg-[var(--surface-sunken)] px-1.5 py-0.2 font-medium text-[var(--text-secondary)]">
                    {names[tx.toWallet]}
                  </span>
                </>
              )}
              {tx.category && names[tx.category] && (
                <>
                  <span>•</span>
                  <span className="truncate">{names[tx.category]}</span>
                </>
              )}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p
              className={[
                'font-display text-sm font-extrabold sm:text-base',
                isIncome
                  ? 'text-[var(--accent)]'
                  : isExpense
                    ? 'text-[var(--negative)]'
                    : 'text-[var(--text-primary)]',
              ].join(' ')}
            >
              {isIncome ? '+' : isExpense ? '−' : ''}
              {formatMoney(tx.amount, currency)}
            </p>
          </div>
        </button>

        <div className="hidden items-center gap-1 border-l border-[var(--line-subtle)] pl-2 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(tx)
            }}
            title="Edit"
            className="grid size-7 place-items-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(tx.id)
            }}
            title="Hapus"
            className="grid size-7 place-items-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--negative-soft)] hover:text-[var(--negative)]"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </li>
  )
}

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
  const [summaryExpanded, setSummaryExpanded] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [tx, wallets, categories] = await Promise.all([
        TxRepo.listByMonth(month).catch(() => []),
        WalletRepo.list(true).catch(() => []),
        CategoryRepo.list().catch(() => []),
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
    const onTxCreated = () => {
      void load()
    }
    window.addEventListener('tx:created', onTxCreated)
    return () => {
      window.removeEventListener('tx:created', onTxCreated)
    }
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
      else if (tx.type === 'expense' && !tx.savingsGoal) expense += tx.amount
    }

    return { income, expense, net: income - expense }
  }, [items])

  const counts = useMemo(() => {
    return {
      all: items.length,
      income: items.filter((tx) => tx.type === 'income').length,
      expense: items.filter((tx) => tx.type === 'expense').length,
      transfer: items.filter((tx) => tx.type === 'transfer').length,
    }
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
      total: list.reduce((sum, tx) => {
        if (tx.type === 'transfer' || tx.savingsGoal) return sum
        return sum + (tx.type === 'expense' ? -tx.amount : tx.amount)
      }, 0),
    }))
  }, [filtered])

  async function handleDelete(id: string) {
    const ok = await confirmDelete('Hapus Transaksi?', t('common.delete_confirm_desc'))
    if (!ok) return

    try {
      await TxRepo.remove(id)
      window.dispatchEvent(new CustomEvent('tx:created'))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
    }
  }

  function closeModal() {
    setComposing(false)
    setEditing(null)
  }

  const isCurrentMonth = month === currentMonth()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] px-4 py-2.5 shadow-xs">
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, -1))}
          aria-label={t('common.prev')}
          className="grid size-8 place-items-center rounded-lg border border-[var(--line-subtle)] text-[var(--text-secondary)] transition-all hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] active:scale-95"
        >
          <ChevronLeft className="size-4.5" />
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-[var(--accent)]" />
          <p className="font-display text-sm font-bold tracking-tight text-[var(--text-primary)] sm:text-base">
            {formatMonth(month)}
          </p>
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => setMonth(currentMonth())}
              className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[0.6875rem] font-semibold text-[var(--accent)] transition-all hover:opacity-80 active:scale-95"
            >
              Bulan Ini
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, 1))}
          aria-label={t('common.next')}
          className="grid size-8 place-items-center rounded-lg border border-[var(--line-subtle)] text-[var(--text-secondary)] transition-all hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] active:scale-95"
        >
          <ChevronRight className="size-4.5" />
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] shadow-xs transition-all">
        <button
          type="button"
          onClick={() => setSummaryExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-[var(--surface-sunken)]/50 active:bg-[var(--surface-sunken)] sm:p-4"
        >
          <div className="flex items-center gap-3">
            <span
              className={[
                'grid size-10 place-items-center rounded-xl shadow-2xs',
                totals.net >= 0
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'bg-[var(--negative-soft)] text-[var(--negative)]',
              ].join(' ')}
            >
              <Wallet className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Selisih / Arus Kas Bersih
              </p>
              <p
                className={[
                  'font-display text-lg font-extrabold sm:text-xl',
                  totals.net >= 0 ? 'text-[var(--accent)]' : 'text-[var(--negative)]',
                ].join(' ')}
              >
                {totals.net < 0 ? '−' : '+'}
                {formatMoney(Math.abs(totals.net), currency)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
            <span className="hidden sm:inline">
              {summaryExpanded ? 'Tutup Rincian' : 'Lihat Rincian'}
            </span>
            <ChevronDown
              className={[
                'size-4.5 transition-transform duration-200',
                summaryExpanded ? 'rotate-180 text-[var(--accent)]' : '',
              ].join(' ')}
            />
          </div>
        </button>

        {summaryExpanded && (
          <div className="grid grid-cols-2 gap-3 border-t border-[var(--line-subtle)] bg-[var(--surface-sunken)]/40 p-3 sm:p-4">
            <div className="rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] p-3 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className="grid size-5.5 place-items-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
                  <TrendingUp className="size-3.5" />
                </span>
                <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {t('common.income')}
                </span>
              </div>
              <p className="mt-1.5 font-display text-sm font-extrabold text-[var(--accent)] sm:text-base">
                {formatMoney(totals.income, currency)}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] p-3 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className="grid size-5.5 place-items-center rounded-md bg-[var(--negative-soft)] text-[var(--negative)]">
                  <TrendingDown className="size-3.5" />
                </span>
                <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {t('common.expense')}
                </span>
              </div>
              <p className="mt-1.5 font-display text-sm font-extrabold text-[var(--negative)] sm:text-base">
                {formatMoney(totals.expense, currency)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('transactions.search_placeholder')}
          aria-label={t('common.search')}
          className="w-full rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] py-2.5 pl-10 pr-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:border-[var(--accent)] focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div
        role="group"
        aria-label={t('transactions.title')}
        className="grid grid-cols-4 gap-1 rounded-2xl bg-[var(--surface-sunken)] p-1 text-xs"
      >
        {(
          [
            { key: 'all', label: 'Semua', count: counts.all },
            { key: 'expense', label: 'Keluar', count: counts.expense },
            { key: 'income', label: 'Masuk', count: counts.income },
            { key: 'transfer', label: 'Transfer', count: counts.transfer },
          ] as const
        ).map((item) => {
          const active = filter === item.key

          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(item.key)}
              className={[
                'flex items-center justify-center gap-1 rounded-xl py-2 font-medium transition-all active:scale-95',
                active
                  ? 'bg-[var(--surface-raised)] font-bold text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              <span className="truncate">{item.label}</span>
              <span
                className={[
                  'rounded-full px-1.5 py-0.2 text-[0.625rem] font-bold',
                  active
                    ? 'bg-[var(--accent)] text-[var(--text-inverted)]'
                    : 'bg-[var(--surface-overlay)] text-[var(--text-muted)]',
                ].join(' ')}
              >
                {item.count}
              </span>
            </button>
          )
        })}
      </div>

      {error && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-[var(--negative)]">
              <AlertCircle className="size-4.5 shrink-0" />
              <span>{error}</span>
            </div>
            <Button size="sm" variant="secondary" onClick={() => void load()}>
              <RefreshCw className="size-3.5 mr-1" />
              {m('common.retry')}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--line-subtle)] bg-[var(--surface-raised)]/50 p-8 text-center sm:p-12">
          <div className="grid size-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] shadow-xs">
            <Wallet className="size-7" />
          </div>
          <h3 className="mt-4 font-display text-base font-bold text-[var(--text-primary)] sm:text-lg">
            {t('transactions.empty_state')}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-[var(--text-muted)] sm:text-sm">
            {t('transactions.empty_subtitle')}
          </p>
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 font-display text-xs font-bold text-[var(--text-inverted)] shadow-sm transition-all hover:opacity-90 active:scale-95 sm:text-sm"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Catat Transaksi Pertama</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {groups.map((group) => (
            <div
              key={group.date}
              className="overflow-hidden rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] shadow-xs"
            >
              <header className="flex items-center justify-between border-b border-[var(--line-subtle)] bg-[var(--surface-sunken)]/60 px-4 py-2.5">
                <span className="font-display text-xs font-bold text-[var(--text-primary)]">
                  {formatDate(group.date, 'short')}
                </span>
                <span
                  className={[
                    'font-mono text-xs font-bold',
                    group.total < 0 ? 'text-[var(--negative)]' : 'text-[var(--accent)]',
                  ].join(' ')}
                >
                  {group.total < 0 ? '−' : '+'}
                  {formatMoney(Math.abs(group.total), currency)}
                </span>
              </header>

              <ul className="divide-y divide-[var(--line-subtle)]">
                {group.list.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    names={names}
                    currency={currency}
                    onEdit={setEditing}
                    onDelete={(id) => void handleDelete(id)}
                  />
                ))}
              </ul>
            </div>
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