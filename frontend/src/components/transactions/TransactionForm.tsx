import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Calendar,
  Check,
  FileText,
  Loader2,
  Sparkles,
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
  invalidateWalletCache,
  type Category,
  type SubCategory,
  type Transaction,
  type TxType,
  type Wallet,
} from '../../lib/api/repositories'
import { formatAmountInput, formatMoney, parseAmount } from '../../lib/utils/currency'
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

  const [form, setForm] = useState<FormState>(() => ({
    ...EMPTY,
    type: defaultType,
    date: todayISO(),
  }))
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
        const [wList, cList, sList, gList] = await Promise.all([
          WalletRepo.list(false, true).catch(() => []),
          CategoryRepo.list().catch(() => []),
          SubCategoryRepo.list().catch(() => []),
          SavingsRepo.list().catch(() => []),
        ])

        if (!alive) return

        setWallets(wList)
        setCategories(cList)
        setSubs(sList)
        setGoals(gList.map((item) => ({ id: item.id, name: item.name })))
        setDataLoaded(true)
      } catch {
        if (alive) setDataLoaded(true)
      }
    }

    void loadData()

    const onReload = () => {
      if (alive) void loadData()
    }
    window.addEventListener('tx:created', onReload)
    window.addEventListener('wallet:updated', onReload)

    return () => {
      alive = false
      window.removeEventListener('tx:created', onReload)
      window.removeEventListener('wallet:updated', onReload)
    }
  }, [])

  useEffect(() => {
    if (!editing) {
      setForm((prev) => {
        const activeType = prev.type || defaultType
        const defaultWallet = prev.wallet || wallets[0]?.id || ''
        const defaultToWallet =
          prev.toWallet ||
          wallets.find((w) => w.id !== defaultWallet)?.id ||
          ''

        return {
          ...prev,
          type: activeType,
          date: prev.date || todayISO(),
          wallet: defaultWallet,
          toWallet:
            activeType === 'transfer'
              ? prev.toWallet && prev.toWallet !== defaultWallet
                ? prev.toWallet
                : defaultToWallet
              : prev.toWallet,
          category:
            prev.category ||
            categories.filter((c) => !c.isArchived && c.type === activeType)[0]?.id ||
            '',
        }
      })
      return
    }

    setForm({
      type: editing.type,
      amount: formatAmountInput(editing.amount),
      date: (editing.date || todayISO()).slice(0, 10),
      wallet: editing.wallet,
      toWallet: editing.toWallet || '',
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
      const currentWallet = prev.wallet || wallets[0]?.id || ''
      const otherWallet = wallets.find((w) => w.id !== currentWallet)?.id ?? ''
      return {
        ...prev,
        type: value,
        category: matchingCats[0]?.id ?? '',
        subCategory: '',
        wallet: currentWallet,
        toWallet: value === 'transfer' ? (prev.toWallet && prev.toWallet !== currentWallet ? prev.toWallet : otherWallet) : '',
      }
    })
  }

  function handleSwapWallets() {
    setForm((prev) => {
      if (!prev.toWallet || !prev.wallet) return prev
      return {
        ...prev,
        wallet: prev.toWallet,
        toWallet: prev.wallet,
      }
    })
  }

  function handleSourceWalletChange(newSourceId: string) {
    setForm((prev) => {
      let nextTo = prev.toWallet
      if (nextTo === newSourceId) {
        nextTo = prev.wallet !== newSourceId ? prev.wallet : (wallets.find((w) => w.id !== newSourceId)?.id ?? '')
      }
      return {
        ...prev,
        wallet: newSourceId,
        toWallet: nextTo,
      }
    })
  }

  function handleDestWalletChange(newDestId: string) {
    setForm((prev) => {
      let nextFrom = prev.wallet
      if (nextFrom === newDestId) {
        nextFrom = prev.toWallet !== newDestId ? prev.toWallet : (wallets.find((w) => w.id !== newDestId)?.id ?? '')
      }
      return {
        ...prev,
        wallet: nextFrom,
        toWallet: newDestId,
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

  const isTransfer = form.type === 'transfer'
  const currentAmountNum = parseAmount(form.amount)

  const isEditingThisTransfer = Boolean(editing && editing.type === 'transfer')
  const originalEditingAmount = isEditingThisTransfer ? editing!.amount : 0
  const originalEditingFrom = isEditingThisTransfer ? editing!.wallet : ''
  const originalEditingTo = isEditingThisTransfer ? editing!.toWallet : ''

  const sourceWallet = useMemo(
    () => wallets.find((w) => w.id === form.wallet),
    [wallets, form.wallet],
  )
  const destWallet = useMemo(
    () => wallets.find((w) => w.id === form.toWallet),
    [wallets, form.toWallet],
  )

  const sourceBaseBalance = useMemo(() => {
    if (!sourceWallet) return 0
    let bal = sourceWallet.balance
    if (isEditingThisTransfer && sourceWallet.id === originalEditingFrom) {
      bal += originalEditingAmount
    }
    if (isEditingThisTransfer && sourceWallet.id === originalEditingTo) {
      bal -= originalEditingAmount
    }
    return bal
  }, [sourceWallet, isEditingThisTransfer, originalEditingFrom, originalEditingTo, originalEditingAmount])

  const destBaseBalance = useMemo(() => {
    if (!destWallet) return 0
    let bal = destWallet.balance
    if (isEditingThisTransfer && destWallet.id === originalEditingTo) {
      bal -= originalEditingAmount
    }
    if (isEditingThisTransfer && destWallet.id === originalEditingFrom) {
      bal += originalEditingAmount
    }
    return bal
  }, [destWallet, isEditingThisTransfer, originalEditingTo, originalEditingFrom, originalEditingAmount])

  const sourceProjectedBalance = sourceBaseBalance - (isTransfer ? currentAmountNum : 0)
  const destProjectedBalance = destBaseBalance + (isTransfer ? currentAmountNum : 0)
  const isSourceDeficit = isTransfer && currentAmountNum > 0 && sourceProjectedBalance < 0

  function handleTransferAll() {
    if (sourceBaseBalance > 0) {
      set('amount', formatAmountInput(sourceBaseBalance))
    }
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

      invalidateWalletCache()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tx:created'))
        window.dispatchEvent(new CustomEvent('wallet:updated'))
      }

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
      invalidateWalletCache()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tx:created'))
        window.dispatchEvent(new CustomEvent('wallet:updated'))
      }
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
      setSaving(false)
    }
  }

  const today = todayISO()
  const yesterday = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target
    const val = input.value
    const digits = val.replace(/\D/g, '')

    if (!digits) {
      set('amount', '')
      return
    }

    const cursor = input.selectionStart ?? val.length
    const digitsBeforeCursor = val.slice(0, cursor).replace(/\D/g, '').length

    const formatted = formatAmountInput(digits)
    set('amount', formatted)

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

  function handleAmountKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      const input = e.currentTarget
      const { selectionStart, selectionEnd, value } = input
      if (selectionStart !== null && selectionStart === selectionEnd && selectionStart > 0) {
        if (value[selectionStart - 1] === '.') {
          e.preventDefault()
          const before = value.slice(0, selectionStart - 2)
          const after = value.slice(selectionStart)
          const digits = (before + after).replace(/\D/g, '')
          if (!digits) {
            set('amount', '')
            return
          }
          const formatted = formatAmountInput(digits)
          set('amount', formatted)

          requestAnimationFrame(() => {
            const digitsBefore = before.replace(/\D/g, '').length
            let counted = 0
            let newCursor = 0
            for (let i = 0; i < formatted.length; i++) {
              const char = formatted[i]
              if (char && /\d/.test(char)) counted++
              if (counted === digitsBefore) {
                newCursor = i + 1
                break
              }
            }
            input.setSelectionRange(newCursor, newCursor)
          })
        }
      }
    }
  }

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
              onChange={handleAmountChange}
              onKeyDown={handleAmountKeyDown}
              placeholder="0"
              className="w-full bg-transparent font-display text-3xl font-black tracking-tight text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]/30"
            />
          </div>
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
            <div className="space-y-2.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  <ArrowLeftRight className="size-3.5 text-[var(--accent)]" />
                  <span>Alur Transfer</span>
                </label>

                {sourceBaseBalance > 0 && currentAmountNum !== sourceBaseBalance && (
                  <button
                    type="button"
                    onClick={handleTransferAll}
                    className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-sunken)] px-2 py-0.5 text-[0.6875rem] font-semibold text-[var(--accent)] transition-all hover:bg-[var(--accent-soft)] active:scale-95"
                  >
                    <Sparkles className="size-3" />
                    <span>Transfer Semua Saldo</span>
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-sunken)]/50 p-3 sm:p-4 space-y-3">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <div className="flex-1 space-y-1.5">
                    <ModernSelect
                      label={
                        <span className="flex items-center justify-between text-[0.6875rem] font-bold text-[var(--text-muted)]">
                          <span>DARI DOMPET (ASAL)</span>
                          {sourceWallet && (
                            <span className="font-normal text-[var(--text-secondary)]">
                              Saldo: {formatMoney(sourceBaseBalance, currency)}
                            </span>
                          )}
                        </span>
                      }
                      value={form.wallet}
                      onChange={handleSourceWalletChange}
                      options={wallets.map((w) => {
                        const isCurrentTo = w.id === form.toWallet
                        return {
                          value: w.id,
                          label: w.name,
                          icon: <WalletIcon className="size-4 text-[var(--accent)]" />,
                          badge: formatMoney(w.balance, currency),
                          description: isCurrentTo ? 'Sedang dipilih sebagai dompet tujuan' : undefined,
                        }
                      })}
                      placeholder="Pilih Dompet Asal"
                    />

                    {sourceWallet && currentAmountNum > 0 && (
                      <div className="flex items-center justify-between rounded-lg bg-[var(--surface-base)] px-2.5 py-1.5 text-xs">
                        <span className="text-[var(--text-muted)]">Sisa Saldo:</span>
                        <span
                          className={[
                            'font-display font-bold',
                            isSourceDeficit ? 'text-[var(--negative)]' : 'text-[var(--text-primary)]',
                          ].join(' ')}
                        >
                          {formatMoney(sourceProjectedBalance, currency)}
                          {isSourceDeficit && ' (Defisit)'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center pt-1 sm:pt-4">
                    <button
                      type="button"
                      onClick={handleSwapWallets}
                      title="Tukar posisi dompet asal & tujuan"
                      aria-label="Tukar dompet asal dan tujuan"
                      className="group flex size-9 items-center justify-center rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] text-[var(--text-secondary)] shadow-2xs transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] active:scale-90"
                    >
                      <ArrowLeftRight className="size-4 rotate-90 transition-transform duration-200 group-hover:rotate-180 sm:rotate-0" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <ModernSelect
                      label={
                        <span className="flex items-center justify-between text-[0.6875rem] font-bold text-[var(--text-muted)]">
                          <span>KE DOMPET (TUJUAN)</span>
                          {destWallet && (
                            <span className="font-normal text-[var(--text-secondary)]">
                              Saldo: {formatMoney(destBaseBalance, currency)}
                            </span>
                          )}
                        </span>
                      }
                      value={form.toWallet}
                      onChange={handleDestWalletChange}
                      options={wallets.map((w) => {
                        const isCurrentFrom = w.id === form.wallet
                        return {
                          value: w.id,
                          label: w.name,
                          icon: <WalletIcon className="size-4 text-[var(--accent)]" />,
                          badge: formatMoney(w.balance, currency),
                          description: isCurrentFrom ? 'Sedang dipilih sebagai dompet asal' : undefined,
                        }
                      })}
                      placeholder="Pilih Dompet Tujuan"
                    />

                    {destWallet && currentAmountNum > 0 && (
                      <div className="flex items-center justify-between rounded-lg bg-[var(--surface-base)] px-2.5 py-1.5 text-xs">
                        <span className="text-[var(--text-muted)]">Saldo Menjadi:</span>
                        <span className="font-display font-bold text-[var(--accent)]">
                          {formatMoney(destProjectedBalance, currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {sourceWallet && destWallet && currentAmountNum > 0 && (
                  <div
                    className={[
                      'flex flex-col gap-1 rounded-xl p-2.5 text-xs transition-colors sm:flex-row sm:items-center sm:justify-between',
                      isSourceDeficit
                        ? 'border border-[var(--negative)]/30 bg-[var(--negative-soft)]/60 text-[var(--negative)]'
                        : 'border border-[var(--line-subtle)] bg-[var(--surface-base)] text-[var(--text-secondary)]',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-1.5">
                      {isSourceDeficit ? (
                        <AlertTriangle className="size-4 shrink-0 text-[var(--negative)]" />
                      ) : (
                        <Check className="size-4 shrink-0 text-[var(--accent)] stroke-[2.5]" />
                      )}
                      <span>
                        {isSourceDeficit
                          ? `Saldo asal kurang ${formatMoney(Math.abs(sourceProjectedBalance), currency)}`
                          : `Sinkronisasi terverifikasi: ${sourceWallet.name} ➔ ${destWallet.name}`}
                      </span>
                    </div>

                    <div className="font-mono text-[0.6875rem] font-bold text-[var(--text-primary)]">
                      {formatMoney(currentAmountNum, currency)}
                    </div>
                  </div>
                )}
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
            placeholder={
              form.type === 'transfer'
                ? 'Contoh: Pindah tabungan, Top up e-wallet, Alokasi bulanan...'
                : t('transactions.form.description_placeholder')
            }
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