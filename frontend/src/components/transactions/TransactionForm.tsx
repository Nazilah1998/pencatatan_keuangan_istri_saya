import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  FileText,
  Loader2,
  Tag,
  Trash2,
  Wallet as WalletIcon,
} from 'lucide-react'

import {
  CategoryRepo,
  SavingsRepo,
  SubCategoryRepo,
  TxRepo,
  WalletRepo,
  type Category,
  type SubCategory,
  type Transaction,
  type TxType,
  type Wallet,
} from '../../lib/api/repositories'
import { formatMoney, parseAmount } from '../../lib/utils/currency'
import { todayISO } from '../../lib/utils/date'
import { useApp } from '../providers/useApp'
import { ModernDatePicker } from '../ui/ModernDatePicker'
import { ModernSelect } from '../ui/ModernSelect'
import { confirmDelete } from '../../lib/state/confirm'

type Props = {
  editing?: Transaction | null
  defaultType: TxType
  onDone: () => void
}

type FormState = {
  type: TxType
  amount: string
  date: string
  wallet: string
  toWallet: string
  category: string
  subCategory: string
  savingsGoal: string
  note: string
}

const EMPTY: FormState = {
  type: 'expense',
  amount: '',
  date: '',
  wallet: '',
  toWallet: '',
  category: '',
  subCategory: '',
  savingsGoal: '',
  note: '',
}

export function TransactionForm({ editing, defaultType, onDone }: Props) {
  const { m, t, session } = useApp()
  const currency = session?.baseCurrency === 'USD' ? 'USD' : 'IDR'

  const [form, setForm] = useState<FormState>(EMPTY)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subs, setSubs] = useState<SubCategory[]>([])
  const [goals, setGoals] = useState<{ id: string; name: string }[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    async function loadData() {
      try {
        const [wList, cList, sList, gList, txList] = await Promise.all([
          WalletRepo.list(false).catch(() => []),
          CategoryRepo.list().catch(() => []),
          SubCategoryRepo.list().catch(() => []),
          SavingsRepo.list().catch(() => []),
          TxRepo.recent(1000).catch(() => []),
        ])

        if (!alive) return

        const walletsWithRealBalance = wList.map((w) => {
          const inTx = txList.filter((t) => t.wallet === w.id && t.type === 'income').reduce((acc, t) => acc + t.amount, 0)
          const outTx = txList.filter((t) => t.wallet === w.id && t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)
          const trfOut = txList.filter((t) => t.wallet === w.id && t.type === 'transfer').reduce((acc, t) => acc + t.amount, 0)
          const trfIn = txList.filter((t) => t.toWallet === w.id && t.type === 'transfer').reduce((acc, t) => acc + t.amount, 0)
          const netTx = inTx - outTx - trfOut + trfIn
          const realBal = (w.balance && w.balance !== 0) ? w.balance : ((w.initialBalance || 0) + netTx)
          return { ...w, balance: realBal }
        })

        setWallets(walletsWithRealBalance)
        setCategories(cList)
        setSubs(sList)
        setGoals(gList.map((item) => ({ id: item.id, name: item.name })))
        setDataLoaded(true)
      } catch {
        if (alive) setDataLoaded(true)
      }
    }

    void loadData()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!editing) {
      setForm((prev) => ({
        ...EMPTY,
        type: defaultType,
        date: todayISO(),
        wallet: prev.wallet || wallets[0]?.id || '',
        category:
          prev.category ||
          categories.filter((c) => !c.isArchived && c.type === defaultType)[0]?.id ||
          '',
      }))
      return
    }

    setForm({
      type: editing.type,
      amount: String(editing.amount),
      date: editing.date.slice(0, 10),
      wallet: editing.wallet,
      toWallet: editing.toWallet,
      category: editing.category,
      subCategory: editing.subCategory,
      savingsGoal: editing.savingsGoal,
      note: editing.note,
    })
  }, [editing, defaultType, wallets, categories])

  function changeCategory(value: string) {
    setForm((prev) => ({ ...prev, category: value, subCategory: '' }))
  }

  function changeType(value: FormState['type']) {
    setForm((prev) => {
      const matchingCats = categories.filter((c) => !c.isArchived && c.type === value)
      return {
        ...prev,
        type: value,
        category: matchingCats[0]?.id ?? '',
        subCategory: '',
        toWallet: value === 'transfer' ? (wallets.find((w) => w.id !== prev.wallet)?.id ?? '') : '',
      }
    })
  }

  const visibleCategories = useMemo(
    () => categories.filter((c) => !c.isArchived && c.type === form.type),
    [categories, form.type],
  )

  const visibleSubs = useMemo(
    () => subs.filter((s) => !s.isArchived && s.category === form.category),
    [subs, form.category],
  )

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate(): string {
    if (parseAmount(form.amount) <= 0) return m('common.amountRequired')
    if (!form.date) return t('transactions.form.date')
    if (!form.wallet) return t('transactions.form.select_wallet')

    if (form.type === 'transfer') {
      if (!form.toWallet) return m('tx.transferNeedsTwoWallets')
      if (form.toWallet === form.wallet) return m('tx.sameWalletTransfer')
      return ''
    }

    if (!form.category && visibleCategories.length > 0) {
      return form.type === 'income' ? m('tx.incomeRequired') : m('tx.expenseRequired')
    }

    return ''
  }

  async function submit() {
    const message = validate()
    setError(message)
    if (message) return

    setSaving(true)

    try {
      const payload = {
        type: form.type,
        amount: parseAmount(form.amount),
        date: form.date,
        wallet: form.wallet,
        toWallet: form.type === 'transfer' ? form.toWallet : '',
        category: form.type === 'transfer' ? '' : form.category,
        subCategory: form.type === 'transfer' ? '' : form.subCategory,
        savingsGoal: form.type === 'transfer' ? '' : form.savingsGoal,
        note: form.note,
      }

      if (editing) await TxRepo.update(editing.id, payload)
      else await TxRepo.create(payload)

      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!editing) return
    const ok = await confirmDelete('Hapus Transaksi?', t('common.delete_confirm_desc'))
    if (!ok) return

    setSaving(true)

    try {
      await TxRepo.remove(editing.id)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
      setSaving(false)
    }
  }

  const currentAmountNum = parseAmount(form.amount)
  const today = todayISO()
  const yesterday = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 space-y-4 pb-8">
        <div
          role="group"
          aria-label={t('transactions.form.type')}
          className="grid grid-cols-3 gap-1.5 rounded-2xl bg-[var(--surface-sunken)] p-1.5"
        >
          <button
            type="button"
            aria-pressed={form.type === 'expense'}
            onClick={() => changeType('expense')}
            className={[
              'flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-95',
              form.type === 'expense'
                ? 'border border-[var(--negative)]/25 bg-[var(--surface-raised)] font-bold text-[var(--negative)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            <ArrowUpRight className="size-4 shrink-0 stroke-[2.5]" />
            <span>{t('common.expense')}</span>
          </button>

          <button
            type="button"
            aria-pressed={form.type === 'income'}
            onClick={() => changeType('income')}
            className={[
              'flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-95',
              form.type === 'income'
                ? 'border border-[var(--accent)]/25 bg-[var(--surface-raised)] font-bold text-[var(--accent)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            <ArrowDownLeft className="size-4 shrink-0 stroke-[2.5]" />
            <span>{t('common.income')}</span>
          </button>

          <button
            type="button"
            aria-pressed={form.type === 'transfer'}
            onClick={() => changeType('transfer')}
            className={[
              'flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-95',
              form.type === 'transfer'
                ? 'border border-[var(--line-strong)] bg-[var(--surface-raised)] font-bold text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            <ArrowLeftRight className="size-4 shrink-0 stroke-[2.5]" />
            <span>{t('common.transfer')}</span>
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-sunken)]/60 p-4 transition-all focus-within:border-[var(--accent)] focus-within:bg-[var(--surface-sunken)]">
          <div className="flex items-center justify-between">
            <label htmlFor="tx-amount-input" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {t('transactions.form.amount')}
            </label>
            {currentAmountNum > 0 && (
              <button
                type="button"
                onClick={() => set('amount', '')}
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
              id="tx-amount-input"
              type="text"
              inputMode="numeric"
              value={form.amount}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9]/g, '')
                set('amount', cleaned)
              }}
              placeholder="0"
              className="w-full bg-transparent font-display text-3xl font-black tracking-tight text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]/30"
            />
          </div>

          {currentAmountNum > 0 && (
            <p className="mt-1.5 font-sans text-xs font-medium text-[var(--text-secondary)]">
              {formatMoney(currentAmountNum, currency)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <Calendar className="size-3.5" />
                <span>{t('transactions.form.date')}</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => set('date', today)}
                  className={[
                    'rounded-md px-1.5 py-0.5 text-[0.6875rem] font-semibold transition-colors',
                    form.date === today
                      ? 'bg-[var(--accent-soft)] font-bold text-[var(--accent)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  Hari ini
                </button>
                <button
                  type="button"
                  onClick={() => set('date', yesterday)}
                  className={[
                    'rounded-md px-1.5 py-0.5 text-[0.6875rem] font-semibold transition-colors',
                    form.date === yesterday
                      ? 'bg-[var(--accent-soft)] font-bold text-[var(--accent)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  Kemarin
                </button>
              </div>
            </div>

            <ModernDatePicker
              value={form.date}
              onChange={(d) => set('date', d)}
            />
          </div>

          {form.type === 'transfer' ? (
            <div className="space-y-2 sm:col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <ArrowLeftRight className="size-3.5" />
                <span>Alur Transfer</span>
              </label>

              <div className="flex flex-col gap-2 rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-sunken)]/50 p-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <ModernSelect
                    label="Dari Dompet"
                    value={form.wallet}
                    onChange={(w) => set('wallet', w)}
                    options={wallets.map((w) => ({
                      value: w.id,
                      label: w.name,
                      icon: <WalletIcon className="size-4 text-[var(--accent)]" />,
                      badge: formatMoney(w.balance, currency),
                    }))}
                    placeholder="Pilih Dompet Asal"
                  />
                </div>

                <div className="grid place-items-center pt-1 sm:px-1 sm:pt-6">
                  <ArrowRight className="size-4 rotate-90 text-[var(--accent)] sm:rotate-0" />
                </div>

                <div className="flex-1">
                  <ModernSelect
                    label="Ke Dompet"
                    value={form.toWallet}
                    onChange={(w) => set('toWallet', w)}
                    options={wallets
                      .filter((w) => w.id !== form.wallet)
                      .map((w) => ({
                        value: w.id,
                        label: w.name,
                        icon: <WalletIcon className="size-4 text-[var(--accent)]" />,
                        badge: formatMoney(w.balance, currency),
                      }))}
                    placeholder="Pilih Dompet Tujuan"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <ModernSelect
                label={
                  <span className="flex items-center gap-1.5 normal-case font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    <WalletIcon className="size-3.5" />
                    <span>{t('transactions.form.select_wallet')}</span>
                  </span>
                }
                value={form.wallet}
                onChange={(w) => set('wallet', w)}
                options={wallets.map((w) => ({
                  value: w.id,
                  label: w.name,
                  icon: <WalletIcon className="size-4 text-[var(--accent)]" />,
                  badge: formatMoney(w.balance, currency),
                }))}
                placeholder="Pilih Dompet"
              />
            </div>
          )}
        </div>

        {form.type !== 'transfer' && (
          <div className="space-y-3">
            <ModernSelect
              label={
                <span className="flex items-center gap-1.5 normal-case font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  <Tag className="size-3.5" />
                  <span>{t('transactions.form.select_category')}</span>
                </span>
              }
              value={form.category}
              onChange={changeCategory}
              options={visibleCategories.map((c) => ({
                value: c.id,
                label: c.name,
                icon: c.icon ? (
                  <span className="text-base select-none leading-none">{c.icon}</span>
                ) : (
                  <Tag className="size-4 text-[var(--text-muted)]" />
                ),
              }))}
              placeholder="Pilih Kategori"
            />

            {visibleSubs.length > 0 && (
              <ModernSelect
                label={t('transactions.form.select_subcategory')}
                value={form.subCategory}
                onChange={(s) => set('subCategory', s)}
                options={visibleSubs.map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
                placeholder="Pilih Subkategori (Opsional)"
              />
            )}

            {form.type === 'expense' && goals.length > 0 && (
              <ModernSelect
                label="🎯 Alokasikan ke Target Tabungan (Opsional)"
                value={form.savingsGoal}
                onChange={(g) => set('savingsGoal', g)}
                options={[
                  { value: '', label: 'Bukan Tabungan' },
                  ...goals.map((g) => ({
                    value: g.id,
                    label: g.name,
                  })),
                ]}
                placeholder="Bukan Tabungan"
              />
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="tx-note-input" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <FileText className="size-3.5" />
            <span>{t('transactions.form.description_label')}</span>
          </label>
          <input
            id="tx-note-input"
            type="text"
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
            placeholder={t('transactions.form.description_placeholder')}
            maxLength={200}
            className="w-full rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-base)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </div>

      <div className="sticky bottom-0 z-30 -mx-4 -mb-4 border-t border-[var(--line-subtle)] bg-[var(--surface-overlay)]/95 px-4 py-3 backdrop-blur-md safe-bottom">
        {error && (
          <div className="mb-2.5 flex items-center gap-2 rounded-xl bg-[var(--negative-soft)] p-2.5 text-xs font-medium text-[var(--negative)]">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saving || !dataLoaded}
            onClick={() => void submit()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3.5 font-display text-sm font-bold text-[var(--text-inverted)] shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="size-4.5 animate-spin" />
            ) : (
              <Check className="size-4.5 stroke-[2.5]" />
            )}
            <span>{editing ? t('common.save') : t('transactions.form.save')}</span>
          </button>

          {editing && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void remove()}
              aria-label="Hapus transaksi"
              className="grid size-12 place-items-center rounded-xl border border-[var(--negative)]/30 text-[var(--negative)] transition-all hover:bg-[var(--negative-soft)] active:scale-95 disabled:opacity-50"
            >
              <Trash2 className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}