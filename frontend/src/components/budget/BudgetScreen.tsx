import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  RefreshCw,
  Target,
  Trash2,
} from 'lucide-react'

import { api, ApiError, ApiPaths } from '../../lib/api/client'
import type { BudgetReport } from '../../lib/api/types'
import {
  BudgetRepo,
  CategoryRepo,
  TxRepo,
  type Budget,
  type Category,
  type Transaction,
} from '../../lib/api/repositories'
import { formatAmountInput, formatMoney, parseAmount, percent } from '../../lib/utils/currency'
import { currentMonth, formatMonth, shiftMonth } from '../../lib/utils/date'
import { useApp } from '../providers/useApp'
import { Button } from '../ui/Button'
import { Card, Skeleton } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { confirmDelete } from '../../lib/state/confirm'
import { ModernSelect } from '../ui/ModernSelect'

type FormState = { category: string; amount: string; notes: string }

const EMPTY: FormState = { category: '', amount: '', notes: '' }

type FilterTab = 'all' | 'budgeted' | 'unbudgeted'

export function BudgetScreen() {
  const { t, m, session, isAuthed, ready } = useApp()
  const currency = session?.baseCurrency === 'USD' ? 'USD' : 'IDR'

  const [month, setMonth] = useState(currentMonth())
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [form, setForm] = useState<FormState>(EMPTY)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!ready || !isAuthed) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')

    try {
      const [, c, b, tx] = await Promise.all([
        api.get<BudgetReport>(ApiPaths.budget(month)).catch(() => null),
        CategoryRepo.list('expense').catch(() => []),
        BudgetRepo.listByMonth(month).catch(() => []),
        TxRepo.listByMonth(month).catch(() => []),
      ])

      setCategories(c.filter((item) => !item.isArchived))
      setBudgets(b)
      setTransactions(tx)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : m('common.retry'))
    } finally {
      setLoading(false)
    }
  }, [month, m, ready, isAuthed])

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

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const tx of transactions) {
      if (tx.type === 'expense' && tx.category) {
        map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount)
      }
    }
    return map
  }, [transactions])

  const unifiedItems = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.id, c]))
    const budgetMap = new Map(budgets.map((b) => [b.category, b]))

    const catKeys = new Set<string>()
    for (const b of budgets) {
      catKeys.add(b.category)
    }
    for (const [catId, amt] of spentByCategory.entries()) {
      if (amt > 0) catKeys.add(catId)
    }

    return Array.from(catKeys)
      .map((catId) => {
        const cat = catMap.get(catId)
        const budget = budgetMap.get(catId)
        const spent = spentByCategory.get(catId) ?? 0
        const hasBudget = Boolean(budget && budget.amount > 0)
        const limit = hasBudget ? budget!.amount : 0
        const remaining = hasBudget ? limit - spent : 0
        const usedPct = hasBudget && limit > 0 ? (spent / limit) * 100 : 0

        let status: 'safe' | 'warning' | 'over' | 'unbudgeted'
        if (!hasBudget) {
          status = 'unbudgeted'
        } else if (usedPct > 100) {
          status = 'over'
        } else if (usedPct >= 80) {
          status = 'warning'
        } else {
          status = 'safe'
        }

        return {
          id: budget ? budget.id : `cat-${catId}`,
          categoryId: catId,
          categoryName: cat?.name || t('common.total'),
          icon: cat?.icon,
          color: cat?.color,
          hasBudget,
          limit,
          spent,
          remaining,
          usedPct,
          status,
          budgetRecord: budget,
          notes: budget?.notes,
        }
      })
      .sort((a, b) => {
        if (a.status === 'over' && b.status !== 'over') return -1
        if (b.status === 'over' && a.status !== 'over') return 1
        if (a.hasBudget && !b.hasBudget) return -1
        if (!a.hasBudget && b.hasBudget) return 1
        return b.spent - a.spent
      })
  }, [categories, budgets, spentByCategory, t])

  const budgetedCount = useMemo(() => unifiedItems.filter((i) => i.hasBudget).length, [unifiedItems])
  const unbudgetedCount = useMemo(() => unifiedItems.filter((i) => !i.hasBudget).length, [unifiedItems])

  const filteredItems = useMemo(() => {
    if (filter === 'budgeted') return unifiedItems.filter((i) => i.hasBudget)
    if (filter === 'unbudgeted') return unifiedItems.filter((i) => !i.hasBudget)
    return unifiedItems
  }, [unifiedItems, filter])

  function openFor(categoryId: string, existing?: Budget) {
    setForm({
      category: categoryId,
      amount: existing ? formatAmountInput(String(existing.amount)) : '',
      notes: existing?.notes ?? '',
    })
    setError('')
    setOpen(true)
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target
    const val = input.value
    const digits = val.replace(/\D/g, '')

    if (!digits) {
      setForm((prev) => ({ ...prev, amount: '' }))
      return
    }

    const cursor = input.selectionStart ?? val.length
    const digitsBeforeCursor = val.slice(0, cursor).replace(/\D/g, '').length

    const formatted = formatAmountInput(digits)
    setForm((prev) => ({ ...prev, amount: formatted }))

    requestAnimationFrame(() => {
      let counted = 0
      let newCursor = formatted.length
      for (let i = 0; i < formatted.length; i++) {
        const char = formatted[i]
        if (char && /\d/.test(char)) counted++
        if (counted === digitsBeforeCursor) {
          newCursor = i + 1
          break
        }
      }
      input.setSelectionRange(newCursor, newCursor)
    })
  }

  async function submit() {
    const amount = parseAmount(form.amount)

    if (!form.category) {
      setError(t('budget.form.category_label'))
      return
    }
    if (amount <= 0) {
      setError(m('common.amountRequired'))
      return
    }

    setSaving(true)
    setError('')

    try {
      await BudgetRepo.upsert({ month, category: form.category, amount, notes: form.notes })
      setOpen(false)
      setForm(EMPTY)
      window.dispatchEvent(new CustomEvent('tx:created'))
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : m('common.retry'))
    } finally {
      setSaving(false)
    }
  }

  async function remove(budget: Budget) {
    const ok = await confirmDelete('Hapus Pos Anggaran?', t('common.delete_confirm_desc'))
    if (!ok) return

    setSaving(true)

    try {
      await BudgetRepo.remove(budget.id)
      window.dispatchEvent(new CustomEvent('tx:created'))
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : m('common.retry'))
      setSaving(false)
    }
  }

  const isCurrentMonth = month === currentMonth()
  const formAmountNum = parseAmount(form.amount)

  return (
    <div className="space-y-4">
      {/* Month Selector Bar */}
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
              className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[0.6875rem] font-semibold text-[var(--accent)] transition-all hover:opacity-80 active:scale-95"
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


      {/* Action Bar & Filter Tabs (Single Clean Row) */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex shrink items-center gap-1 overflow-x-auto rounded-xl bg-[var(--surface-sunken)] p-1 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={[
              'whitespace-nowrap rounded-lg px-2.5 py-1 font-semibold transition-all',
              filter === 'all'
                ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            ].join(' ')}
          >
            Semua ({unifiedItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('budgeted')}
            className={[
              'whitespace-nowrap rounded-lg px-2.5 py-1 font-semibold transition-all',
              filter === 'budgeted'
                ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            ].join(' ')}
          >
            Ada Pagu ({budgetedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unbudgeted')}
            className={[
              'whitespace-nowrap rounded-lg px-2.5 py-1 font-semibold transition-all',
              filter === 'unbudgeted'
                ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            ].join(' ')}
          >
            Pagu 0 ({unbudgetedCount})
          </button>
        </div>

        <button
          type="button"
          onClick={() => openFor('')}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[var(--accent)] px-3 py-1.5 font-display text-xs font-bold text-[var(--text-inverted)] shadow-xs transition-all hover:opacity-90 active:scale-95 sm:px-3.5 sm:py-2"
        >
          <Plus className="size-3.5 stroke-[2.5]" />
          <span>Tambah</span>
        </button>
      </div>

      {error && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-[var(--negative)]">
              <AlertCircle className="size-4.5 shrink-0" />
              <span>{error}</span>
            </div>
            <Button size="sm" variant="secondary" onClick={() => void load()}>
              <RefreshCw className="mr-1 size-3.5" />
              {m('common.retry')}
            </Button>
          </div>
        </Card>
      )}

      {/* Category List */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--line-subtle)] bg-[var(--surface-raised)]/50 p-8 text-center sm:p-12">
          <div className="grid size-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] shadow-xs">
            <Target className="size-7" />
          </div>
          <h3 className="mt-4 font-display text-base font-bold text-[var(--text-primary)]">
            {filter === 'budgeted'
              ? 'Belum Ada Pagu Aktif'
              : filter === 'unbudgeted'
                ? 'Semua Pos Sudah Memiliki Pagu'
                : t('budget.empty_title')}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-[var(--text-muted)]">
            {filter === 'budgeted'
              ? 'Pos pengeluaran di bawah belum memiliki batas pagu. Klik tombol Atur Batas untuk memulainya.'
              : filter === 'unbudgeted'
                ? 'Seluruh kategori pengeluaran bulan ini telah dibatasi dengan nominal pagu.'
                : 'Mulai dengan menambahkan pagu pengeluaran untuk kategori yang Anda inginkan.'}
          </p>
          <button
            type="button"
            onClick={() => openFor('')}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 font-display text-xs font-bold text-[var(--text-inverted)] shadow-sm transition-all hover:opacity-90 active:scale-95"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Tambah Anggaran Kategori</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isBudgeted = item.hasBudget && item.limit > 0
            const used = isBudgeted ? percent(item.spent, item.limit) : 0
            const remaining = isBudgeted ? item.limit - item.spent : 0

            return (
              <div
                key={item.categoryId}
                className="overflow-hidden rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] p-4 shadow-xs transition-all hover:border-[var(--line-strong)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color || 'var(--accent)' }}
                      />
                      <h3 className="truncate font-display text-sm font-bold text-[var(--text-primary)]">
                        {item.categoryName}
                      </h3>
                    </div>
                    {item.notes && (
                      <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{item.notes}</p>
                    )}
                    <p className="mt-1 font-mono text-xs text-[var(--text-secondary)]">
                      {formatMoney(item.spent, currency)}
                      {isBudgeted ? (
                        <span className="text-[var(--text-muted)]">
                          {' '}dari {formatMoney(item.limit, currency)}
                        </span>
                      ) : (
                        <span className="ml-1 text-[var(--text-muted)] font-normal">(Realisasi)</span>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {isBudgeted ? (
                      <>
                        <span
                          className={[
                            'rounded-full px-2.5 py-0.5 text-[0.6875rem] font-bold',
                            item.status === 'over'
                              ? 'bg-[var(--negative-soft)] text-[var(--negative)]'
                              : item.status === 'warning'
                                ? 'bg-[var(--warning-soft)] text-[var(--warning)]'
                                : 'bg-[var(--accent-soft)] text-[var(--accent)]',
                          ].join(' ')}
                        >
                          {item.status === 'over'
                            ? 'Melebihi Pagu'
                            : item.status === 'warning'
                              ? 'Mendekati Batas'
                              : 'Aman'}
                        </span>
                        <span
                          className={[
                            'text-[0.6875rem] font-medium',
                            remaining < 0 ? 'text-[var(--negative)]' : 'text-[var(--text-muted)]',
                          ].join(' ')}
                        >
                          {remaining >= 0
                            ? `Sisa: ${formatMoney(remaining, currency)}`
                            : `Defisit: ${formatMoney(Math.abs(remaining), currency)}`}
                        </span>
                      </>
                    ) : (
                      <span className="rounded-full border border-[var(--line-subtle)] bg-[var(--surface-sunken)] px-2 py-0.5 text-[0.6875rem] font-medium text-[var(--text-muted)]">
                        Pagu Rp 0
                      </span>
                    )}
                  </div>
                </div>

                {isBudgeted ? (
                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-sunken)]"
                    role="progressbar"
                    aria-valuenow={Math.min(used, 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={[
                        'h-full rounded-full transition-all duration-300',
                        item.status === 'over'
                          ? 'bg-[var(--negative)]'
                          : item.status === 'warning'
                            ? 'bg-[var(--warning)]'
                            : 'bg-[var(--accent)]',
                      ].join(' ')}
                      style={{ width: `${Math.min(used, 100)}%` }}
                    />
                  </div>
                ) : (
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-sunken)]">
                    <div className="h-full w-full bg-[var(--line-subtle)]/40" />
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-[var(--line-subtle)]/60 pt-2 text-xs">
                  <span className="font-mono text-[0.6875rem] text-[var(--text-muted)]">
                    {isBudgeted ? `${Math.round(used)}% terpakai` : 'Belum dibatasi'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isBudgeted && item.budgetRecord ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openFor(item.categoryId, item.budgetRecord)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)] active:scale-95"
                        >
                          <Edit2 className="size-3" />
                          <span>{t('common.edit')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(item.budgetRecord!)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--negative)] hover:bg-[var(--negative-soft)] active:scale-95"
                        >
                          <Trash2 className="size-3" />
                          <span>Hapus</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openFor(item.categoryId)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--accent)] transition-all hover:opacity-80 active:scale-95"
                      >
                        <Plus className="size-3.5 stroke-[2.5]" />
                        <span>Atur Batas</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Upsert Budget */}
      <Modal
        open={open}
        title={
          form.category && budgets.some((b) => b.category === form.category)
            ? 'Ubah Batas Anggaran'
            : t('budget.form.title')
        }
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <ModernSelect
            label={t('budget.form.category_label')}
            value={form.category}
            onChange={(val) => setForm((prev) => ({ ...prev, category: val }))}
            options={categories.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            placeholder="Pilih Kategori Pengeluaran"
          />

          <div className="rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-sunken)]/60 p-4 transition-all focus-within:border-[var(--accent)] focus-within:bg-[var(--surface-sunken)]">
            <div className="flex items-center justify-between">
              <label htmlFor="budget-amount-input" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {t('budget.form.limit_label')}
              </label>
              {formAmountNum > 0 && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, amount: '' }))}
                  className="text-[0.6875rem] font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--negative)]"
                >
                  Hapus
                </button>
              )}
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-xl font-extrabold text-[var(--text-muted)]">
                {currency === 'IDR' ? 'Rp' : '$'}
              </span>
              <input
                id="budget-amount-input"
                type="text"
                inputMode="numeric"
                value={form.amount}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full bg-transparent font-display text-3xl font-black tracking-tight text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]/30"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="budget-notes-input" className="block text-xs font-medium text-[var(--text-secondary)]">
              {t('transactions.form.description_label')} (Opsional)
            </label>
            <input
              id="budget-notes-input"
              type="text"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Contoh: Batas maksimal bulanan"
              className="w-full rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-[var(--negative-soft)] p-3 text-xs font-medium text-[var(--negative)]">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={saving || !form.amount || formAmountNum <= 0}
            onClick={() => void submit()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 font-display text-sm font-bold text-[var(--text-inverted)] shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            <span>{saving ? 'Menyimpan...' : t('budget.form.save')}</span>
          </button>
        </div>
      </Modal>
    </div>
  )
}