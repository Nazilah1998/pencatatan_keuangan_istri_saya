/**
 * Formulir transaksi: tambah, ubah, dan hapus.
 *
 * Validasi jumlah dan referensi dompet/kategori tetap di sini; saldo wallet
 * tidak pernah dihitung dari sisi klien karena hook backend yang memiliki
 * satu sumber kebenaran.
 */
import { useEffect, useMemo, useState } from 'react'

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
import { Button } from '../ui/Button'
import { Input, Select } from '../ui/Field'

const TYPES: TxType[] = ['income', 'expense', 'transfer']

type Props = {
  editing: Transaction | null
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    void (async () => {
      const [w, c, s, g] = await Promise.all([
        WalletRepo.list(false),
        CategoryRepo.list(),
        SubCategoryRepo.list(),
        SavingsRepo.list(),
      ])
      if (!alive) return

      setWallets(w)
      setCategories(c)
      setSubs(s)
      setGoals(g.map((item) => ({ id: item.id, name: item.name })))
    })()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!editing) {
      setForm({ ...EMPTY, type: defaultType, date: todayISO() })
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
  }, [editing, defaultType])

  // Subkategori hanya direset ketika pengguna sendiri yang mengganti kategori
  // utama; memuat transaksi lama lewat `editing` harus mempertahankan
  // subkategori yang tersimpan.
  function changeCategory(value: string) {
    setForm((prev) => ({ ...prev, category: value, subCategory: '' }))
  }

  // Mengganti tipe transaksi membuat kategori lama tidak berlaku lagi.
  function changeType(value: FormState['type']) {
    setForm((prev) => ({ ...prev, type: value, category: '', subCategory: '' }))
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

    if (!form.category) {
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
    if (!window.confirm(t('common.delete_confirm_desc'))) return

    setSaving(true)

    try {
      await TxRepo.remove(editing.id)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div role="group" aria-label={t('transactions.form.type')} className="grid grid-cols-3 gap-2">
        {TYPES.map((type) => (
          <button
            key={type}
            type="button"
            aria-pressed={form.type === type}
            onClick={() => changeType(type)}
            className={[
              'h-10 rounded-[0.625rem] border text-sm font-medium transition-colors',
              form.type === type
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--line-subtle)] text-[var(--text-muted)] hover:border-[var(--line-strong)]',
            ].join(' ')}
          >
            {t(`common.${type}`)}
          </button>
        ))}
      </div>

      <Input
        label={t('transactions.form.amount')}
        value={form.amount}
        onChange={(e) => set('amount', e.target.value)}
        inputMode="decimal"
        placeholder="0"
        hint={formatMoney(parseAmount(form.amount), currency)}
      />

      <Input
        label={t('transactions.form.date')}
        type="date"
        value={form.date}
        onChange={(e) => set('date', e.target.value)}
      />

      <Select
        label={t('transactions.form.select_wallet')}
        value={form.wallet}
        onChange={(e) => set('wallet', e.target.value)}
      >
        <option value="">—</option>
        {wallets.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </Select>

      {form.type === 'transfer' ? (
        <Select
          label={t('transactions.wallet')}
          value={form.toWallet}
          onChange={(e) => set('toWallet', e.target.value)}
        >
          <option value="">—</option>
          {wallets
            .filter((w) => w.id !== form.wallet)
            .map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
        </Select>
      ) : (
        <>
          <Select
            label={t('transactions.form.select_category')}
            value={form.category}
            onChange={(e) => changeCategory(e.target.value)}
          >
            <option value="">—</option>
            {visibleCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          {visibleSubs.length > 0 && (
            <Select
              label={t('transactions.form.select_subcategory')}
              value={form.subCategory}
              onChange={(e) => set('subCategory', e.target.value)}
            >
              <option value="">—</option>
              {visibleSubs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}

          {form.type === 'expense' && goals.length > 0 && (
            <Select
              label={t('savings.title')}
              value={form.savingsGoal}
              onChange={(e) => set('savingsGoal', e.target.value)}
              hint={t('savings.add_funds')}
            >
              <option value="">—</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          )}
        </>
      )}

      <Input
        label={t('transactions.form.description_label')}
        value={form.note}
        onChange={(e) => set('note', e.target.value)}
        placeholder={t('transactions.form.description_placeholder')}
        maxLength={200}
      />

      {error && <p className="text-sm text-[var(--negative)]">{error}</p>}

      <div className="flex gap-2">
        <Button block loading={saving} onClick={() => void submit()}>
          {editing ? t('common.save') : t('transactions.form.save')}
        </Button>
        {editing && (
          <Button variant="danger" loading={saving} onClick={() => void remove()}>
            {t('common.delete')}
          </Button>
        )}
      </div>
    </div>
  )
}