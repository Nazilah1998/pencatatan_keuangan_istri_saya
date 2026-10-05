/**
 * Layar aset & hutang: dua tab (dompet sebagai aset, dan utang).
 *
 * Kekayaan bersih memakai aturan yang sama dengan dasbor: aset masuk net worth
 * hanya bila `include_in_net_worth` dicentang, sedangkan utang selalu dihitung
 * sebagai pengurang. Sisa utang (`current_balance`) diturunkan hook backend
 * dari cicilan yang tercatat.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

import {
  DebtPaymentRepo,
  DebtRepo,
  WalletRepo,
  type Debt,
  type Wallet,
  type WalletType,
} from '../../lib/api/repositories'
import { formatMoney, parseAmount, percent } from '../../lib/utils/currency'
import { todayISO } from '../../lib/utils/date'
import { useApp } from '../providers/useApp'
import { Button } from '../ui/Button'
import { Card, EmptyState, Skeleton, StatTile } from '../ui/Card'
import { Input, Select } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { WALLET_TYPES } from '../../lib/constants/wallets'

type Tab = 'assets' | 'debts'

type WalletForm = {
  name: string
  type: WalletType
  initialBalance: string
  includeInNetWorth: boolean
}

type DebtForm = {
  creditor: string
  type: Debt['type']
  principal: string
  interestRate: string
  monthlyPayment: string
  dueDate: string
  notes: string
}

type PaymentForm = { amount: string; date: string; wallet: string; note: string }

const EMPTY_WALLET: WalletForm = {
  name: '',
  type: 'cash',
  initialBalance: '',
  includeInNetWorth: true,
}

const EMPTY_DEBT: DebtForm = {
  creditor: '',
  type: 'loan',
  principal: '',
  interestRate: '',
  monthlyPayment: '',
  dueDate: '',
  notes: '',
}

const EMPTY_PAYMENT: PaymentForm = { amount: '', date: '', wallet: '', note: '' }

export function AssetsScreen() {
  const { t, m, session } = useApp()
  const currency = session?.baseCurrency === 'USD' ? 'USD' : 'IDR'

  const [tab, setTab] = useState<Tab>('assets')
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [walletOpen, setWalletOpen] = useState(false)
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)
  const [walletForm, setWalletForm] = useState<WalletForm>(EMPTY_WALLET)

  const [debtOpen, setDebtOpen] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  const [debtForm, setDebtForm] = useState<DebtForm>(EMPTY_DEBT)

  const [paying, setPaying] = useState<Debt | null>(null)
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(EMPTY_PAYMENT)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [w, d] = await Promise.all([WalletRepo.list(true), DebtRepo.list(true)])
      setWallets(w)
      setDebts(d)
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
    } finally {
      setLoading(false)
    }
  }, [m])

  useEffect(() => {
    void load()
  }, [load])

  const totals = useMemo(() => {
    const assets = wallets
      .filter((w) => w.includeInNetWorth && !w.isArchived)
      .reduce((sum, w) => sum + w.balance, 0)
    const liabilities = debts
      .filter((d) => d.status !== 'paid')
      .reduce((sum, d) => sum + d.currentBalance, 0)

    return { assets, liabilities, net: assets - liabilities }
  }, [wallets, debts])

  function openWallet(wallet: Wallet | null) {
    setEditingWallet(wallet)
    setWalletForm(
      wallet
        ? {
            name: wallet.name,
            type: wallet.type,
            initialBalance: String(wallet.initialBalance),
            includeInNetWorth: wallet.includeInNetWorth,
          }
        : EMPTY_WALLET,
    )
    setError('')
    setWalletOpen(true)
  }

  function openDebt(debt: Debt | null) {
    setEditingDebt(debt)
    setDebtForm(
      debt
        ? {
            creditor: debt.creditor,
            type: debt.type,
            principal: String(debt.principal),
            interestRate: String(debt.interestRate),
            monthlyPayment: String(debt.monthlyPayment),
            dueDate: debt.dueDate ? debt.dueDate.slice(0, 10) : '',
            notes: debt.notes,
          }
        : EMPTY_DEBT,
    )
    setError('')
    setDebtOpen(true)
  }

  function openPayment(debt: Debt) {
    setPaying(debt)
    setPaymentForm({
      amount: debt.monthlyPayment > 0 ? String(debt.monthlyPayment) : '',
      date: todayISO(),
      wallet: wallets.find((w) => !w.isArchived)?.id ?? '',
      note: '',
    })
    setError('')
  }

  async function submitWallet() {
    if (!walletForm.name.trim()) {
      setError(m('wallet.nameRequired'))
      return
    }

    setSaving(true)

    try {
      const payload = {
        name: walletForm.name.trim(),
        type: walletForm.type,
        initialBalance: parseAmount(walletForm.initialBalance),
        includeInNetWorth: walletForm.includeInNetWorth,
        isArchived: editingWallet?.isArchived ?? false,
        sortOrder: editingWallet?.sortOrder ?? 999,
      }

      if (editingWallet) await WalletRepo.update(editingWallet.id, payload)
      else await WalletRepo.create(payload)

      setWalletOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
    } finally {
      setSaving(false)
    }
  }

  async function submitDebt() {
    const principal = parseAmount(debtForm.principal)

    if (!debtForm.creditor.trim()) {
      setError(m('wallet.nameRequired'))
      return
    }
    if (principal <= 0) {
      setError(m('common.amountRequired'))
      return
    }

    setSaving(true)

    try {
      const payload = {
        creditor: debtForm.creditor.trim(),
        type: debtForm.type,
        principal,
        interestRate: parseAmount(debtForm.interestRate),
        monthlyPayment: parseAmount(debtForm.monthlyPayment),
        dueDate: debtForm.dueDate ? `${debtForm.dueDate} 00:00:00.000Z` : '',
        notes: debtForm.notes,
        status: editingDebt?.status ?? 'active',
      }

      if (editingDebt) await DebtRepo.update(editingDebt.id, payload)
      else await DebtRepo.create(payload)

      setDebtOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
    } finally {
      setSaving(false)
    }
  }

  async function submitPayment() {
    const amount = parseAmount(paymentForm.amount)

    if (!paying) return
    if (amount <= 0) {
      setError(m('common.amountRequired'))
      return
    }
    if (!paymentForm.wallet) {
      setError(t('transactions.form.select_wallet'))
      return
    }

    setSaving(true)

    try {
      await DebtPaymentRepo.create({
        debt: paying.id,
        amount,
        date: paymentForm.date,
        wallet: paymentForm.wallet,
        note: paymentForm.note,
      })

      setPaying(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
    } finally {
      setSaving(false)
    }
  }

  async function removeWallet(wallet: Wallet) {
    if (!window.confirm(t('common.delete_confirm_desc'))) return

    setSaving(true)

    try {
      await WalletRepo.remove(wallet.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
      setSaving(false)
    }
  }

  async function removeDebt(debt: Debt) {
    if (!window.confirm(t('common.delete_confirm_desc'))) return

    setSaving(true)

    try {
      await DebtRepo.remove(debt.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatTile label={t('assets.total_assets')} value={formatMoney(totals.assets, currency)} />
        <StatTile
          label={t('assets.total_debts')}
          value={formatMoney(totals.liabilities, currency)}
          tone="negative"
        />
      </div>

      <div className="tile p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          {t('assets.net_worth')}
        </p>
        <p
          className={[
            'tnum mt-1 text-2xl font-semibold',
            totals.net < 0 ? 'text-[var(--negative)]' : 'text-[var(--accent)]',
          ].join(' ')}
        >
          {formatMoney(totals.net, currency)}
        </p>
      </div>

      <div role="tablist" aria-label={t('assets.title')} className="grid grid-cols-2 gap-2">
        {(['assets', 'debts'] as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={[
              'h-10 rounded-[0.625rem] border text-sm font-medium transition-colors',
              tab === key
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--line-subtle)] text-[var(--text-muted)] hover:border-[var(--line-strong)]',
            ].join(' ')}
          >
            {key === 'assets' ? t('assets.tab_assets') : t('assets.tab_debts')}
          </button>
        ))}
      </div>

      <Button block onClick={() => (tab === 'assets' ? openWallet(null) : openDebt(null))}>
        <Plus className="size-4" aria-hidden />
        {tab === 'assets' ? t('assets.add_asset') : t('assets.add_debt')}
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

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : tab === 'assets' ? (
        wallets.length === 0 ? (
          <EmptyState title={t('common.no_data')} hint={t('assets.add_asset')} />
        ) : (
          <div className="space-y-2">
            {wallets.map((wallet) => (
              <Card key={wallet.id}>
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold">{wallet.name}</h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      {t(WALLET_TYPES.find((item) => item.value === wallet.type)?.labelKey ??
                        'common.total')}
                    </p>
                  </div>

                  <p
                    className={[
                      'tnum shrink-0 text-sm font-semibold',
                      wallet.balance < 0 ? 'text-[var(--negative)]' : '',
                    ].join(' ')}
                  >
                    {formatMoney(wallet.balance, currency)}
                  </p>
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openWallet(wallet)}>
                    {t('common.edit')}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void removeWallet(wallet)}>
                    {t('common.delete')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : debts.length === 0 ? (
        <EmptyState title={t('common.no_data')} hint={t('assets.add_debt')} />
      ) : (
        <div className="space-y-3">
          {debts.map((debt) => {
            const paid = debt.principal - debt.currentBalance
            const settled = percent(paid, debt.principal)

            return (
              <Card key={debt.id}>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">{debt.creditor}</h2>
                    <p className="tnum mt-0.5 text-xs text-[var(--text-muted)]">
                      {formatMoney(debt.currentBalance, currency)} {t('budget.card.spent_of')}{' '}
                      {formatMoney(debt.principal, currency)}
                    </p>
                  </div>

                  <span
                    className={[
                      'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                      debt.status === 'overdue'
                        ? 'bg-[var(--negative-soft)] text-[var(--negative)]'
                        : debt.status === 'paid'
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                          : 'bg-[var(--warning-soft)] text-[var(--warning)]',
                    ].join(' ')}
                  >
                    {settled}%
                  </span>
                </div>

                <div
                  className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-sunken)]"
                  role="progressbar"
                  aria-valuenow={Math.min(settled, 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-[var(--warning)] transition-[width]"
                    style={{ width: `${Math.min(settled, 100)}%` }}
                  />
                </div>

                {debt.monthlyPayment > 0 && (
                  <p className="tnum mt-2 text-xs text-[var(--text-muted)]">
                    {t('assets.debt_installment')}: {formatMoney(debt.monthlyPayment, currency)}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openPayment(debt)}>
                    {t('assets.pay_debt')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openDebt(debt)}>
                    {t('common.edit')}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void removeDebt(debt)}>
                    {t('common.delete')}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={walletOpen}
        title={editingWallet ? t('assets.update_asset') : t('assets.save_asset')}
        onClose={() => setWalletOpen(false)}
      >
        <div className="space-y-4">
          <Input
            label={t('assets.asset_name')}
            value={walletForm.name}
            onChange={(e) => setWalletForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder={t('assets.asset_name_placeholder')}
          />

          <Select
            label={t('assets.asset_type')}
            value={walletForm.type}
            onChange={(e) =>
              setWalletForm((prev) => ({ ...prev, type: e.target.value as WalletType }))
            }
          >
            {WALLET_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {t(item.labelKey)}
              </option>
            ))}
          </Select>

          <Input
            label={t('assets.asset_value')}
            value={walletForm.initialBalance}
            onChange={(e) => setWalletForm((prev) => ({ ...prev, initialBalance: e.target.value }))}
            inputMode="decimal"
            placeholder="0"
          />

          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={walletForm.includeInNetWorth}
              onChange={(e) =>
                setWalletForm((prev) => ({ ...prev, includeInNetWorth: e.target.checked }))
              }
              className="size-4 accent-[var(--accent)]"
            />
            {t('assets.include_net_worth')}
          </label>

          {error && <p className="text-sm text-[var(--negative)]">{error}</p>}

          <Button block loading={saving} onClick={() => void submitWallet()}>
            {t('common.save')}
          </Button>
        </div>
      </Modal>

      <Modal
        open={debtOpen}
        title={editingDebt ? t('assets.update_debt') : t('assets.save_debt')}
        onClose={() => setDebtOpen(false)}
      >
        <div className="space-y-4">
          <Input
            label={t('assets.debt_name')}
            value={debtForm.creditor}
            onChange={(e) => setDebtForm((prev) => ({ ...prev, creditor: e.target.value }))}
            placeholder={t('assets.debt_name_placeholder')}
          />

          <Select
            label={t('assets.debt_type')}
            value={debtForm.type}
            onChange={(e) => setDebtForm((prev) => ({ ...prev, type: e.target.value as Debt['type'] }))}
          >
            <option value="loan">{t('assets.type_personal_loan')}</option>
            <option value="credit_card">{t('assets.type_credit_card')}</option>
            <option value="other">{t('assets.type_other_debt')}</option>
          </Select>

          <Input
            label={t('assets.debt_amount')}
            value={debtForm.principal}
            onChange={(e) => setDebtForm((prev) => ({ ...prev, principal: e.target.value }))}
            inputMode="decimal"
            placeholder="0"
          />

          <Input
            label={t('assets.debt_installment')}
            value={debtForm.monthlyPayment}
            onChange={(e) => setDebtForm((prev) => ({ ...prev, monthlyPayment: e.target.value }))}
            inputMode="decimal"
            placeholder="0"
          />

          <Input
            label={t('assets.debt_interest')}
            value={debtForm.interestRate}
            onChange={(e) => setDebtForm((prev) => ({ ...prev, interestRate: e.target.value }))}
            inputMode="decimal"
            placeholder="0"
          />

          <Input
            label={t('assets.debt_due_date')}
            type="date"
            value={debtForm.dueDate}
            onChange={(e) => setDebtForm((prev) => ({ ...prev, dueDate: e.target.value }))}
          />

          <Input
            label={t('assets.asset_notes')}
            value={debtForm.notes}
            onChange={(e) => setDebtForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder={t('assets.asset_notes_placeholder')}
          />

          {error && <p className="text-sm text-[var(--negative)]">{error}</p>}

          <Button block loading={saving} onClick={() => void submitDebt()}>
            {t('common.save')}
          </Button>
        </div>
      </Modal>

      <Modal open={!!paying} title={t('assets.pay_debt')} onClose={() => setPaying(null)}>
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">{paying?.creditor}</p>

          <Input
            label={t('common.amount')}
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
            inputMode="decimal"
            placeholder="0"
          />

          <Select
            label={t('transactions.form.select_wallet')}
            value={paymentForm.wallet}
            onChange={(e) => setPaymentForm((prev) => ({ ...prev, wallet: e.target.value }))}
          >
            <option value="">—</option>
            {wallets
              .filter((w) => !w.isArchived)
              .map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
          </Select>

          <Input
            label={t('transactions.form.date')}
            type="date"
            value={paymentForm.date}
            onChange={(e) => setPaymentForm((prev) => ({ ...prev, date: e.target.value }))}
          />

          {error && <p className="text-sm text-[var(--negative)]">{error}</p>}

          <Button block loading={saving} onClick={() => void submitPayment()}>
            {t('common.save')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}