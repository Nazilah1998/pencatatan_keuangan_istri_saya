import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit2,
  PiggyBank,
  Plus,
  RefreshCw,
  Target,
  Trash2,
  TrendingDown,
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
import { formatMoney, parseAmount, percent } from '../../lib/utils/currency'
import { currentMonth, formatMonth, shiftMonth } from '../../lib/utils/date'
import { useApp } from '../providers/useApp'
import { Button } from '../ui/Button'
import { Card, Skeleton } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { confirmDelete } from '../../lib/state/confirm'
import { ModernSelect } from '../ui/ModernSelect'

type FormState = { category: string; amount: string; notes: string }

const EMPTY: FormState = { category: '', amount: '', notes: '' }
const PRESET_LIMITS = [200000, 500000, 1000000, 2000000, 5000000]

export function BudgetScreen() {
  const { t, m, session, isAuthed, ready } = useApp()
  const currency = session?.baseCurrency === 'USD' ? 'USD' : 'IDR'

  const [month, setMonth] = useState(currentMonth())
  const [report, setReport] = useState<BudgetReport | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
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
      const [rRes, c, b, tx] = await Promise.all([
        api.get<BudgetReport>(ApiPaths.budget(month)).catch(() => null),
        CategoryRepo.list('expense').catch(() => []),
        BudgetRepo.listByMonth(month).catch(() => []),
        TxRepo.listByMonth(month).catch(() => []),
      ])

      const totalLimit = b.reduce((acc, item) => acc + item.amount, 0)
      const expense = tx.filter((item) => item.type === 'expense').reduce((acc, item) => acc + item.amount, 0)

      const fallbackReport: BudgetReport = {
        month,
        totalLimit,
        totalSpent: expense,
        remaining: totalLimit - expense,
        items: b.map((item) => {
          const spent = tx
            .filter((tItem) => tItem.category === item.category && tItem.type === 'expense')
            .reduce((acc, tItem) => acc + tItem.amount, 0)
          const pct = item.amount > 0 ? (spent / item.amount) * 100 : 0
          return {
            id: item.id,
            category: item.category,
            limit: item.amount,
            spent,
            percentage: pct,
            status: pct > 100 ? ('over' as const) : pct >= 80 ? ('warning' as const) : ('safe' as const),
          }
        }),
      }

      let resolvedReport = fallbackReport
      if (b.length === 0 && rRes && Array.isArray((rRes as unknown as Record<string, unknown>).items) && ((rRes as unknown as Record<string, unknown>).items as unknown[]).length > 0) {
        const catMap = Object.fromEntries(c.map((item) => [item.id, item.name]))
        const rAny = rRes as Record<string, unknown>
        resolvedReport = {
          month,
          totalLimit: (rAny.totalLimit as number) ?? (rAny.total_limit as number) ?? 0,
          totalSpent: (rAny.totalSpent as number) ?? (rAny.total_spent as number) ?? 0,
          remaining: (rAny.remaining as number) ?? 0,
          items: (rAny.items as Record<string, unknown>[]).map((item) => {
            const catId = (item.category_id as string) || (item.category as string) || ''
            const catName = catMap[catId] || (item.category as string) || catId
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
          }),
        }
      }

      setReport(resolvedReport)
      setCategories(c.filter((item) => !item.isArchived))
      setBudgets(b)
      setTransactions(tx)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : m('common.retry'))
    } finally {
      setLoading(false)
    }
  }, [month, m])

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

  function openFor(categoryId: string, existing?: Budget) {
    setForm({
      category: categoryId,
      amount: existing ? String(existing.amount) : '',
      notes: existing?.notes ?? '',
    })
    setError('')
    setOpen(true)
  }

  function addPreset(val: number) {
    const current = parseAmount(form.amount)
    setForm((prev) => ({ ...prev, amount: String(current + val) }))
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

    try {
      await BudgetRepo.upsert({ month, category: form.category, amount, notes: form.notes })
      setOpen(false)
      setForm(EMPTY)
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

      {loading && !report ? (
        <div className="grid grid-cols-3 gap-2.5">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <div className="rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] p-3 shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="grid size-6 place-items-center rounded-lg bg-[var(--surface-sunken)] text-[var(--text-secondary)]">
                <Target className="size-3.5" />
              </span>
              <span className="truncate text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {t('budget.form.limit_label')}
              </span>
            </div>
            <p className="mt-2 truncate font-display text-sm font-extrabold text-[var(--text-primary)] sm:text-base">
              {formatMoney(report?.totalLimit ?? 0, currency)}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] p-3 shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="grid size-6 place-items-center rounded-lg bg-[var(--negative-soft)] text-[var(--negative)]">
                <TrendingDown className="size-3.5" />
              </span>
              <span className="truncate text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {t('common.expense')}
              </span>
            </div>
            <p className="mt-2 truncate font-display text-sm font-extrabold text-[var(--negative)] sm:text-base">
              {formatMoney(report?.totalSpent ?? 0, currency)}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] p-3 shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="grid size-6 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                <PiggyBank className="size-3.5" />
              </span>
              <span className="truncate text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {t('budget.card.remaining')}
              </span>
            </div>
            <p
              className={[
                'mt-2 truncate font-display text-sm font-extrabold sm:text-base',
                (report?.remaining ?? 0) < 0 ? 'text-[var(--negative)]' : 'text-[var(--accent)]',
              ].join(' ')}
            >
              {formatMoney(report?.remaining ?? 0, currency)}
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => openFor('')}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 font-display text-sm font-bold text-[var(--text-inverted)] shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
      >
        <Plus className="size-4 stroke-[2.5]" />
        <span>{t('budget.add_button')}</span>
      </button>

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
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--line-subtle)] bg-[var(--surface-raised)]/50 p-8 text-center sm:p-12">
          <div className="grid size-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] shadow-xs">
            <Target className="size-7" />
          </div>
          <h3 className="mt-4 font-display text-base font-bold text-[var(--text-primary)]">
            {t('budget.empty_title')}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-[var(--text-muted)]">
            {t('budget.subtitle')}
          </p>
          <button
            type="button"
            onClick={() => openFor('')}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 font-display text-xs font-bold text-[var(--text-inverted)] shadow-sm transition-all hover:opacity-90 active:scale-95"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Tambah Anggaran Pertama</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const categoryName =
              categories.find((c) => c.id === budget.category)?.name ?? t('common.total')
            const spent = spentByCategory.get(budget.category) ?? 0
            const used = percent(spent, budget.amount)
            const remaining = budget.amount - spent
            const status = used > 100 ? 'over' : used >= 80 ? 'warning' : 'safe'

            return (
              <div
                key={budget.id}
                className="overflow-hidden rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] p-4 shadow-xs transition-colors hover:border-[var(--line-strong)]"
              >
                <div className="mb-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-sm font-bold text-[var(--text-primary)]">
                      {categoryName}
                    </h2>
                    {budget.notes && (
                      <p className="truncate text-xs text-[var(--text-muted)]">{budget.notes}</p>
                    )}
                    <p className="mt-1 font-mono text-xs text-[var(--text-secondary)]">
                      {formatMoney(spent, currency)}{' '}
                      <span className="text-[var(--text-muted)]">dari {formatMoney(budget.amount, currency)}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={[
                        'rounded-full px-2.5 py-0.5 text-[0.6875rem] font-bold',
                        status === 'over'
                          ? 'bg-[var(--negative-soft)] text-[var(--negative)]'
                          : status === 'warning'
                            ? 'bg-[var(--warning-soft)] text-[var(--warning)]'
                            : 'bg-[var(--accent-soft)] text-[var(--accent)]',
                      ].join(' ')}
                    >
                      {status === 'over'
                        ? t('budget.card.status.limit')
                        : status === 'warning'
                          ? t('budget.card.status.warning')
                          : t('budget.card.status.safe')}
                    </span>
                    <span className="text-[0.6875rem] font-medium text-[var(--text-muted)]">
                      Sisa: {formatMoney(remaining, currency)}
                    </span>
                  </div>
                </div>

                <div
                  className="h-2 overflow-hidden rounded-full bg-[var(--surface-sunken)]"
                  role="progressbar"
                  aria-valuenow={Math.min(used, 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={[
                      'h-full rounded-full transition-all duration-300',
                      status === 'over'
                        ? 'bg-[var(--negative)]'
                        : status === 'warning'
                          ? 'bg-[var(--warning)]'
                          : 'bg-[var(--accent)]',
                    ].join(' ')}
                    style={{ width: `${Math.min(used, 100)}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[var(--line-subtle)]/60 pt-2 text-xs">
                  <span className="font-mono text-[0.6875rem] text-[var(--text-muted)]">
                    {Math.round(used)}% terpakai
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openFor(budget.category, budget)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)] active:scale-95"
                    >
                      <Edit2 className="size-3" />
                      <span>{t('common.edit')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(budget)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--negative)] hover:bg-[var(--negative-soft)] active:scale-95"
                    >
                      <Trash2 className="size-3" />
                      <span>{t('common.delete')}</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={open} title={form.category && budgets.some(b => b.category === form.category) ? 'Ubah Anggaran' : t('budget.form.title')} onClose={() => setOpen(false)}>
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

          <div className="rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-sunken)]/60 p-3.5 transition-colors focus-within:border-[var(--accent)]">
            <label htmlFor="budget-amount-input" className="block text-xs font-medium text-[var(--text-muted)]">
              {t('budget.form.limit_label')}
            </label>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-lg font-bold text-[var(--text-muted)]">
                {currency === 'IDR' ? 'Rp' : '$'}
              </span>
              <input
                id="budget-amount-input"
                type="text"
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '')
                  setForm((prev) => ({ ...prev, amount: cleaned }))
                }}
                placeholder="0"
                className="w-full bg-transparent font-display text-xl font-extrabold tracking-tight text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]/40"
              />
            </div>
            {formAmountNum > 0 && (
              <p className="mt-1 font-sans text-xs font-medium text-[var(--text-muted)]">
                {formatMoney(formAmountNum, currency)}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2 border-t border-[var(--line-subtle)]/60">
              {PRESET_LIMITS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => addPreset(val)}
                  className="rounded-lg border border-[var(--line-subtle)] bg-[var(--surface-raised)] px-2 py-0.5 text-[0.6875rem] font-medium text-[var(--text-secondary)] shadow-2xs transition-all hover:border-[var(--accent)] hover:text-[var(--text-primary)] active:scale-95"
                >
                  +{val >= 1000000 ? `${val / 1000000}jt` : `${val / 1000}rb`}
                </button>
              ))}
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
              placeholder="Contoh: Batas maksimal jajan & belanja bulanan"
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
            disabled={saving}
            onClick={() => void submit()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 font-display text-sm font-bold text-[var(--text-inverted)] shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            <span>{t('budget.form.save')}</span>
          </button>
        </div>
      </Modal>
    </div>
  )
}