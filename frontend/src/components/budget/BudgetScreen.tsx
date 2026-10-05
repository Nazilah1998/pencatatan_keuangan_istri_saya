/**
 * Layar anggaran bulanan.
 *
 * Realisasi pengeluaran dibaca dari endpoint agregasi backend supaya angka
 * selalu sama dengan dasbor; batas anggaran hanya disimpan lewat
 * `BudgetRepo` yang menulis satu baris per kategori per bulan.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

import { api, ApiError, ApiPaths } from '../../lib/api/client'
import type { BudgetReport } from '../../lib/api/types'
import { BudgetRepo, CategoryRepo, type Budget, type Category } from '../../lib/api/repositories'
import { formatMoney, parseAmount, percent } from '../../lib/utils/currency'
import { currentMonth, formatMonth, shiftMonth } from '../../lib/utils/date'
import { useApp } from '../providers/useApp'
import { Button } from '../ui/Button'
import { Card, EmptyState, Skeleton } from '../ui/Card'
import { Input, Select } from '../ui/Field'
import { Modal } from '../ui/Modal'

type FormState = { category: string; amount: string; notes: string }

const EMPTY: FormState = { category: '', amount: '', notes: '' }

export function BudgetScreen() {
  const { t, m, session } = useApp()
  const currency = session?.baseCurrency === 'USD' ? 'USD' : 'IDR'

  const [month, setMonth] = useState(currentMonth())
  const [report, setReport] = useState<BudgetReport | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [form, setForm] = useState<FormState>(EMPTY)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')

    try {
      const [r, c, b] = await Promise.all([
        api.get<BudgetReport>(ApiPaths.budget(month)),
        CategoryRepo.list('expense'),
        BudgetRepo.listByMonth(month),
      ])

      setReport(r)
      setCategories(c.filter((item) => !item.isArchived))
      setBudgets(b)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : m('common.retry'))
    }
  }, [month, m])

  useEffect(() => {
    void load()
  }, [load])

  const spentByCategory = useMemo(
    () => new Map(report?.items.map((item) => [item.category, item]) ?? []),
    [report],
  )

  function openFor(categoryId: string, existing?: Budget) {
    setForm({
      category: categoryId,
      amount: existing ? String(existing.amount) : '',
      notes: existing?.notes ?? '',
    })
    setError('')
    setOpen(true)
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
    if (!window.confirm(t('common.delete_confirm_desc'))) return

    setSaving(true)

    try {
      await BudgetRepo.remove(budget.id)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : m('common.retry'))
      setSaving(false)
    }
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

      {!report ? (
        <Skeleton className="h-24" />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="tile p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              {t('budget.form.limit_label')}
            </p>
            <p className="tnum mt-1 text-sm font-semibold">{formatMoney(report.totalLimit, currency)}</p>
          </div>
          <div className="tile p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              {t('common.expense')}
            </p>
            <p className="tnum mt-1 text-sm font-semibold text-[var(--negative)]">
              {formatMoney(report.totalSpent, currency)}
            </p>
          </div>
          <div className="tile p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              {t('budget.card.remaining')}
            </p>
            <p
              className={[
                'tnum mt-1 text-sm font-semibold',
                report.remaining < 0 ? 'text-[var(--negative)]' : 'text-[var(--accent)]',
              ].join(' ')}
            >
              {formatMoney(report.remaining, currency)}
            </p>
          </div>
        </div>
      )}

      <Button block onClick={() => openFor('')}>
        <Plus className="size-4" aria-hidden />
        {t('budget.add_button')}
      </Button>

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

      {!report ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : report.items.length === 0 && budgets.length === 0 ? (
        <EmptyState title={t('budget.empty_title')} hint={t('budget.subtitle')} />
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const categoryName =
              categories.find((c) => c.id === budget.category)?.name ?? t('common.total')
            const row = spentByCategory.get(budget.category)
            const spent = row?.spent ?? 0
            const used = percent(spent, budget.amount)
            const status = row?.status ?? 'safe'

            return (
              <Card key={budget.id}>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">{categoryName}</h2>
                    <p className="tnum mt-0.5 text-xs text-[var(--text-muted)]">
                      {formatMoney(spent, currency)} {t('budget.card.spent_of')}{' '}
                      {formatMoney(budget.amount, currency)}
                    </p>
                  </div>

                  <span
                    className={[
                      'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
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
                </div>

                <div
                  className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-sunken)]"
                  role="progressbar"
                  aria-valuenow={Math.min(used, 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full transition-[width]"
                    style={{
                      width: `${Math.min(used, 100)}%`,
                      backgroundColor:
                        status === 'over'
                          ? 'var(--negative)'
                          : status === 'warning'
                            ? 'var(--warning)'
                            : 'var(--accent)',
                    }}
                  />
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openFor(budget.category, budget)}>
                    {t('common.edit')}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void remove(budget)}>
                    {t('common.delete')}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={open} title={t('budget.form.title')} onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <Select
            label={t('budget.form.category_label')}
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Input
            label={t('budget.form.limit_label')}
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            inputMode="decimal"
            placeholder="0"
            hint={
              form.amount
                ? formatMoney(parseAmount(form.amount), currency)
                : t('budget.form.period_instruction')
            }
          />

          <Input
            label={t('transactions.form.description_label')}
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          />

          {error && <p className="text-sm text-[var(--negative)]">{error}</p>}

          <Button block loading={saving} onClick={() => void submit()}>
            {t('budget.form.save')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}