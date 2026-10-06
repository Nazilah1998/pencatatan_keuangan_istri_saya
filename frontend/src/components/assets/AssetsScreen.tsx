import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Landmark,
  Pencil,
  PiggyBank,
  Plus,
  RefreshCw,
  Smartphone,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'

import {
  DebtPaymentRepo,
  DebtRepo,
  TxRepo,
  WalletRepo,
  type Debt,
  type Wallet as WalletItem,
  type WalletType,
} from '../../lib/api/repositories'
import { WALLET_TYPES } from '../../lib/constants/wallets'
import { formatMoney, parseAmount, percent } from '../../lib/utils/currency'
import { formatDate, todayISO } from '../../lib/utils/date'
import { useApp } from '../providers/useApp'
import { Button } from '../ui/Button'
import { Card, Skeleton } from '../ui/Card'
import { Input } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { ModernDatePicker } from '../ui/ModernDatePicker'
import { ModernSelect } from '../ui/ModernSelect'
import { confirmDelete } from '../../lib/state/confirm'

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

type PaymentForm = {
  amount: string
  date: string
  wallet: string
  note: string
}

const EMPTY_WALLET: WalletForm = {
  name: '',
  type: 'bank',
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

const EMPTY_PAYMENT: PaymentForm = {
  amount: '',
  date: '',
  wallet: '',
  note: '',
}

function getWalletIcon(type: WalletType) {
  switch (type) {
    case 'bank':
      return <Landmark className="size-5" />
    case 'cash':
      return <Banknote className="size-5" />
    case 'ewallet':
      return <Smartphone className="size-5" />
    case 'savings':
      return <PiggyBank className="size-5" />
    case 'credit_card':
      return <CreditCard className="size-5" />
    case 'investment':
      return <TrendingUp className="size-5" />
    default:
      return <Wallet className="size-5" />
  }
}

function getWalletTypeLabel(type: WalletType) {
  switch (type) {
    case 'bank':
      return 'Rekening Bank'
    case 'cash':
      return 'Uang Tunai (Cash)'
    case 'ewallet':
      return 'E-Wallet'
    case 'savings':
      return 'Tabungan'
    case 'credit_card':
      return 'Kartu Kredit'
    case 'investment':
      return 'Investasi'
    default:
      return 'Dompet'
  }
}

export function AssetsScreen() {
  const { t, m, session } = useApp()
  const currency = session?.baseCurrency === 'USD' ? 'USD' : 'IDR'

  const [tab, setTab] = useState<Tab>('assets')
  const [wallets, setWallets] = useState<WalletItem[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [walletOpen, setWalletOpen] = useState(false)
  const [editingWallet, setEditingWallet] = useState<WalletItem | null>(null)
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
      const [w, d, txList] = await Promise.all([
        WalletRepo.list(true).catch(() => []),
        DebtRepo.list(true).catch(() => []),
        TxRepo.recent(1000).catch(() => []),
      ])

      const walletsWithRealBalance = w.map((wallet) => {
        const inTx = txList
          .filter((tx) => tx.wallet === wallet.id && tx.type === 'income')
          .reduce((sum, tx) => sum + tx.amount, 0)
        const outTx = txList
          .filter((tx) => tx.wallet === wallet.id && tx.type === 'expense')
          .reduce((sum, tx) => sum + tx.amount, 0)
        const trfOut = txList
          .filter((tx) => tx.wallet === wallet.id && tx.type === 'transfer')
          .reduce((sum, tx) => sum + tx.amount, 0)
        const trfIn = txList
          .filter((tx) => tx.toWallet === wallet.id && tx.type === 'transfer')
          .reduce((sum, tx) => sum + tx.amount, 0)
        const netTx = inTx - outTx - trfOut + trfIn
        const realBal =
          wallet.balance && wallet.balance !== 0
            ? wallet.balance
            : (wallet.initialBalance || 0) + netTx
        return { ...wallet, balance: realBal }
      })

      setWallets(walletsWithRealBalance)
      setDebts(d)
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
    } finally {
      setLoading(false)
    }
  }, [m])

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

  const totals = useMemo(() => {
    const assets = wallets
      .filter((w) => w.includeInNetWorth && !w.isArchived)
      .reduce((sum, w) => sum + (w.balance || 0), 0)
    const liabilities = debts
      .filter((d) => d.status !== 'paid')
      .reduce((sum, d) => sum + (d.currentBalance ?? d.principal ?? 0), 0)

    return { assets, liabilities, net: assets - liabilities }
  }, [wallets, debts])

  function openWallet(wallet: WalletItem | null) {
    setEditingWallet(wallet)
    setWalletForm(
      wallet
        ? {
            name: wallet.name,
            type: wallet.type,
            initialBalance: String(wallet.initialBalance || ''),
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
            principal: String(debt.principal || ''),
            interestRate: debt.interestRate ? String(debt.interestRate) : '',
            monthlyPayment: debt.monthlyPayment ? String(debt.monthlyPayment) : '',
            dueDate: debt.dueDate ? debt.dueDate.slice(0, 10) : '',
            notes: debt.notes || '',
          }
        : EMPTY_DEBT,
    )
    setError('')
    setDebtOpen(true)
  }

  function openPayment(debt: Debt) {
    setPaying(debt)
    setPaymentForm({
      amount: debt.monthlyPayment > 0 ? String(debt.monthlyPayment) : String(debt.currentBalance),
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
      const initial = parseAmount(walletForm.initialBalance)
      const payload = {
        name: walletForm.name.trim(),
        type: walletForm.type,
        initialBalance: initial,
        balance: editingWallet ? editingWallet.balance : initial,
        includeInNetWorth: walletForm.includeInNetWorth,
        isArchived: editingWallet?.isArchived ?? false,
        sortOrder: editingWallet?.sortOrder ?? 999,
      }

      if (editingWallet) {
        await WalletRepo.update(editingWallet.id, payload)
      } else {
        await WalletRepo.create(payload)
      }

      window.dispatchEvent(new CustomEvent('tx:created'))
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
      setError('Nama kreditur / pihak pemberi pinjaman wajib diisi')
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
        currentBalance: editingDebt ? (editingDebt.currentBalance ?? principal) : principal,
        interestRate: parseAmount(debtForm.interestRate),
        monthlyPayment: parseAmount(debtForm.monthlyPayment),
        dueDate: debtForm.dueDate ? `${debtForm.dueDate} 00:00:00.000Z` : '',
        notes: debtForm.notes,
        status: editingDebt?.status ?? 'active',
      }

      if (editingDebt) {
        await DebtRepo.update(editingDebt.id, payload)
      } else {
        await DebtRepo.create(payload)
      }

      window.dispatchEvent(new CustomEvent('tx:created'))
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
      const current = paying.currentBalance ?? paying.principal ?? 0
      const newBalance = Math.max(0, current - amount)

      await Promise.all([
        DebtPaymentRepo.create({
          debt: paying.id,
          amount,
          date: paymentForm.date,
          wallet: paymentForm.wallet,
          note: paymentForm.note || `Cicilan: ${paying.creditor}`,
        }),
        DebtRepo.update(paying.id, {
          currentBalance: newBalance,
          status: newBalance <= 0 ? 'paid' : paying.status,
        }),
        TxRepo.create({
          type: 'expense',
          amount,
          date: paymentForm.date,
          wallet: paymentForm.wallet,
          note: `Bayar Hutang: ${paying.creditor}`,
        }),
      ])

      window.dispatchEvent(new CustomEvent('tx:created'))
      setPaying(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
    } finally {
      setSaving(false)
    }
  }

  async function removeWallet(wallet: WalletItem) {
    const ok = await confirmDelete('Hapus Akun / Dompet?', t('common.delete_confirm_desc'))
    if (!ok) return

    setSaving(true)

    try {
      await WalletRepo.remove(wallet.id)
      window.dispatchEvent(new CustomEvent('tx:created'))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
      setSaving(false)
    }
  }

  async function removeDebt(debt: Debt) {
    const ok = await confirmDelete('Hapus Catatan Hutang / Piutang?', t('common.delete_confirm_desc'))
    if (!ok) return

    setSaving(true)

    try {
      await DebtRepo.remove(debt.id)
      window.dispatchEvent(new CustomEvent('tx:created'))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] p-4 shadow-xs sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={[
                'grid size-11 place-items-center rounded-2xl shadow-2xs',
                totals.net >= 0
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'bg-[var(--negative-soft)] text-[var(--negative)]',
              ].join(' ')}
            >
              <Wallet className="size-5.5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Kekayaan Bersih (Net Worth)
              </p>
              <h2
                className={[
                  'font-display text-2xl font-extrabold sm:text-3xl',
                  totals.net >= 0 ? 'text-[var(--accent)]' : 'text-[var(--negative)]',
                ].join(' ')}
              >
                {totals.net < 0 ? '−' : '+'}
                {formatMoney(Math.abs(totals.net), currency)}
              </h2>
            </div>
          </div>

          <span
            className={[
              'rounded-full px-2.5 py-1 text-xs font-bold',
              totals.net >= 0
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'bg-[var(--negative-soft)] text-[var(--negative)]',
            ].join(' ')}
          >
            {totals.net >= 0 ? 'Surplus' : 'Defisit'}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 pt-4 border-t border-[var(--line-subtle)]">
          <div className="rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-sunken)]/60 p-3">
            <div className="flex items-center gap-1.5">
              <span className="grid size-5.5 place-items-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
                <TrendingUp className="size-3.5" />
              </span>
              <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Total Aset
              </span>
            </div>
            <p className="mt-1 font-display text-sm font-extrabold text-[var(--accent)] sm:text-base">
              {formatMoney(totals.assets, currency)}
            </p>
            <p className="mt-0.5 text-[0.6875rem] text-[var(--text-muted)]">
              {wallets.filter((w) => !w.isArchived).length} Akun Aktif
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-sunken)]/60 p-3">
            <div className="flex items-center gap-1.5">
              <span className="grid size-5.5 place-items-center rounded-md bg-[var(--negative-soft)] text-[var(--negative)]">
                <TrendingDown className="size-3.5" />
              </span>
              <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Total Hutang
              </span>
            </div>
            <p className="mt-1 font-display text-sm font-extrabold text-[var(--negative)] sm:text-base">
              {formatMoney(totals.liabilities, currency)}
            </p>
            <p className="mt-0.5 text-[0.6875rem] text-[var(--text-muted)]">
              {debts.filter((d) => d.status !== 'paid').length} Kewajiban Aktif
            </p>
          </div>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Pilihan tampilan"
        className="grid grid-cols-2 gap-1 rounded-2xl bg-[var(--surface-sunken)] p-1 text-xs sm:text-sm"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'assets'}
          onClick={() => setTab('assets')}
          className={[
            'flex items-center justify-center gap-2 rounded-xl py-2 font-medium transition-all active:scale-95',
            tab === 'assets'
              ? 'bg-[var(--surface-raised)] font-bold text-[var(--text-primary)] shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
          ].join(' ')}
        >
          <Wallet className="size-4 text-[var(--accent)]" />
          <span>Daftar Aset</span>
          <span
            className={[
              'rounded-full px-2 py-0.2 text-[0.6875rem] font-bold',
              tab === 'assets'
                ? 'bg-[var(--accent)] text-[var(--text-inverted)]'
                : 'bg-[var(--surface-overlay)] text-[var(--text-muted)]',
            ].join(' ')}
          >
            {wallets.length}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === 'debts'}
          onClick={() => setTab('debts')}
          className={[
            'flex items-center justify-center gap-2 rounded-xl py-2 font-medium transition-all active:scale-95',
            tab === 'debts'
              ? 'bg-[var(--surface-raised)] font-bold text-[var(--text-primary)] shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
          ].join(' ')}
        >
          <CreditCard className="size-4 text-[var(--negative)]" />
          <span>Daftar Hutang</span>
          <span
            className={[
              'rounded-full px-2 py-0.2 text-[0.6875rem] font-bold',
              tab === 'debts'
                ? 'bg-[var(--negative)] text-[var(--text-inverted)]'
                : 'bg-[var(--surface-overlay)] text-[var(--text-muted)]',
            ].join(' ')}
          >
            {debts.length}
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => (tab === 'assets' ? openWallet(null) : openDebt(null))}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 font-display text-sm font-bold text-[var(--text-inverted)] shadow-sm transition-all hover:opacity-90 active:scale-95"
      >
        <Plus className="size-4.5 stroke-[2.5]" />
        <span>{tab === 'assets' ? '+ Tambah Rekening / Aset' : '+ Catat Hutang Baru'}</span>
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
        <div className="space-y-2.5">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : tab === 'assets' ? (
        wallets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--line-subtle)] bg-[var(--surface-raised)]/50 p-8 text-center sm:p-12">
            <div className="grid size-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] shadow-xs">
              <Landmark className="size-7" />
            </div>
            <h3 className="mt-4 font-display text-base font-bold text-[var(--text-primary)] sm:text-lg">
              Belum Ada Rekening / Aset
            </h3>
            <p className="mt-1 max-w-sm text-xs text-[var(--text-muted)] sm:text-sm">
              Tambahkan rekening bank, dompet digital, atau uang tunai untuk mulai memantau saldo aset.
            </p>
            <button
              type="button"
              onClick={() => openWallet(null)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 font-display text-xs font-bold text-[var(--text-inverted)] shadow-sm transition-all hover:opacity-90 active:scale-95"
            >
              <Plus className="size-4 stroke-[2.5]" />
              <span>Tambah Rekening Pertama</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="overflow-hidden rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] p-4 shadow-xs transition-all hover:border-[var(--line-strong)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] font-bold">
                      {getWalletIcon(wallet.type)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-bold text-[var(--text-primary)]">
                        {wallet.name}
                      </h3>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.6875rem]">
                        <span className="rounded-md bg-[var(--surface-sunken)] px-1.5 py-0.2 font-medium text-[var(--text-secondary)]">
                          {getWalletTypeLabel(wallet.type)}
                        </span>
                        {wallet.includeInNetWorth && (
                          <span className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.2 font-semibold text-[var(--accent)]">
                            Net Worth
                          </span>
                        )}
                        {wallet.isArchived && (
                          <span className="rounded-md bg-[var(--surface-sunken)] px-1.5 py-0.2 font-semibold text-[var(--text-muted)]">
                            Arsip
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={[
                        'font-display text-base font-extrabold sm:text-lg',
                        wallet.balance < 0 ? 'text-[var(--negative)]' : 'text-[var(--text-primary)]',
                      ].join(' ')}
                    >
                      {formatMoney(wallet.balance, currency)}
                    </p>
                    {wallet.initialBalance > 0 && wallet.initialBalance !== wallet.balance && (
                      <p className="text-[0.6875rem] text-[var(--text-muted)]">
                        Awal: {formatMoney(wallet.initialBalance, currency)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-[var(--line-subtle)] pt-3">
                  <button
                    type="button"
                    onClick={() => openWallet(wallet)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-sunken)]/60 px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition-all hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] active:scale-95"
                  >
                    <Pencil className="size-3.5" />
                    <span>Ubah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeWallet(wallet)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--negative)]/20 bg-[var(--negative-soft)]/50 px-3 py-1.5 text-xs font-semibold text-[var(--negative)] transition-all hover:bg-[var(--negative-soft)] active:scale-95"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : debts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--line-subtle)] bg-[var(--surface-raised)]/50 p-8 text-center sm:p-12">
          <div className="grid size-14 place-items-center rounded-2xl bg-[var(--negative-soft)] text-[var(--negative)] shadow-xs">
            <CreditCard className="size-7" />
          </div>
          <h3 className="mt-4 font-display text-base font-bold text-[var(--text-primary)] sm:text-lg">
            Tidak Ada Hutang / Beban Pinjaman
          </h3>
          <p className="mt-1 max-w-sm text-xs text-[var(--text-muted)] sm:text-sm">
            Semua catatan kewajiban bersih. Anda dapat mencatat pinjaman baru bila diperlukan.
          </p>
          <button
            type="button"
            onClick={() => openDebt(null)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--negative)] px-4 py-2.5 font-display text-xs font-bold text-[var(--text-inverted)] shadow-sm transition-all hover:opacity-90 active:scale-95"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Catat Hutang Baru</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map((debt) => {
            const paid = Math.max(0, debt.principal - debt.currentBalance)
            const settled = percent(paid, debt.principal)

            return (
              <div
                key={debt.id}
                className="overflow-hidden rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] p-4 shadow-xs transition-all hover:border-[var(--line-strong)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
                      {debt.creditor}
                    </h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.6875rem]">
                      <span className="rounded-md bg-[var(--surface-sunken)] px-1.5 py-0.2 font-medium text-[var(--text-secondary)]">
                        {debt.type === 'credit_card'
                          ? 'Kartu Kredit'
                          : debt.type === 'loan'
                            ? 'Pinjaman Pribadi'
                            : 'Kewajiban Lainnya'}
                      </span>
                      {debt.dueDate && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-sunken)] px-1.5 py-0.2 text-[var(--text-muted)]">
                          <Calendar className="size-3" />
                          <span>Tempo: {formatDate(debt.dueDate, 'short')}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={[
                      'rounded-full px-2.5 py-0.5 text-xs font-bold',
                      debt.status === 'overdue'
                        ? 'bg-[var(--negative-soft)] text-[var(--negative)]'
                        : debt.status === 'paid'
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                          : 'bg-[var(--warning-soft)] text-[var(--warning)]',
                    ].join(' ')}
                  >
                    {debt.status === 'paid'
                      ? 'Lunas'
                      : debt.status === 'overdue'
                        ? 'Jatuh Tempo'
                        : `${settled}% Terbayar`}
                  </span>
                </div>

                <div className="mt-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--text-muted)]">
                      Sisa Hutang: <b className="text-[var(--negative)]">{formatMoney(debt.currentBalance, currency)}</b>
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      Pokok: {formatMoney(debt.principal, currency)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-sunken)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, settled))}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line-subtle)] pt-3">
                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                    {debt.monthlyPayment > 0 && (
                      <span className="inline-flex items-center gap-1 font-medium text-[var(--text-secondary)]">
                        <Clock className="size-3.5 text-[var(--text-muted)]" />
                        <span>{formatMoney(debt.monthlyPayment, currency)} / bln</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {debt.status !== 'paid' && debt.currentBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => openPayment(debt)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--text-inverted)] shadow-xs transition-all hover:opacity-90 active:scale-95"
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>Bayar Cicilan</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openDebt(debt)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-sunken)]/60 px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition-all hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] active:scale-95"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeDebt(debt)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--negative)]/20 bg-[var(--negative-soft)]/50 px-2.5 py-1.5 text-xs font-semibold text-[var(--negative)] transition-all hover:bg-[var(--negative-soft)] active:scale-95"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={walletOpen}
        title={editingWallet ? 'Ubah Rekening / Aset' : 'Tambah Rekening / Aset Baru'}
        onClose={() => setWalletOpen(false)}
      >
        <div className="space-y-4">
          <Input
            label="Nama Rekening / Akun"
            value={walletForm.name}
            onChange={(e) => setWalletForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Contoh: Bank BCA, GoPay, Dompet Tunai"
          />

          <ModernSelect
            label="Jenis Rekening / Aset"
            value={walletForm.type}
            onChange={(val) => setWalletForm((prev) => ({ ...prev, type: val as WalletType }))}
            options={WALLET_TYPES.map((item) => ({
              value: item.value,
              label: t(item.labelKey),
            }))}
            placeholder="Pilih jenis akun/dompet"
          />

          <Input
            label="Saldo Awal"
            value={walletForm.initialBalance}
            onChange={(e) => setWalletForm((prev) => ({ ...prev, initialBalance: e.target.value }))}
            inputMode="decimal"
            placeholder="0"
          />

          <label className="flex items-center gap-2.5 text-sm font-medium text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={walletForm.includeInNetWorth}
              onChange={(e) =>
                setWalletForm((prev) => ({ ...prev, includeInNetWorth: e.target.checked }))
              }
              className="size-4.5 rounded accent-[var(--accent)]"
            />
            <span>Hitung ke dalam Total Kekayaan Bersih (Net Worth)</span>
          </label>

          {error && <p className="text-sm font-medium text-[var(--negative)]">{error}</p>}

          <Button block loading={saving} onClick={() => void submitWallet()}>
            {t('common.save')}
          </Button>
        </div>
      </Modal>

      <Modal
        open={debtOpen}
        title={editingDebt ? 'Ubah Catatan Hutang' : 'Catat Hutang Baru'}
        onClose={() => setDebtOpen(false)}
      >
        <div className="space-y-4">
          <Input
            label="Pemberi Pinjaman / Nama Tagihan"
            value={debtForm.creditor}
            onChange={(e) => setDebtForm((prev) => ({ ...prev, creditor: e.target.value }))}
            placeholder="Contoh: Bank Mandiri KPR, Tagihan Kartu Kredit"
          />

          <ModernSelect
            label="Jenis Kewajiban"
            value={debtForm.type}
            onChange={(val) => setDebtForm((prev) => ({ ...prev, type: val as Debt['type'] }))}
            options={[
              { value: 'loan', label: 'Pinjaman Pribadi / Bank' },
              { value: 'credit_card', label: 'Kartu Kredit / Paylater' },
              { value: 'other', label: 'Kewajiban / Hutang Lainnya' },
            ]}
          />

          <Input
            label="Total Pokok Pinjaman"
            value={debtForm.principal}
            onChange={(e) => setDebtForm((prev) => ({ ...prev, principal: e.target.value }))}
            inputMode="decimal"
            placeholder="0"
          />

          <Input
            label="Cicilan per Bulan (Opsional)"
            value={debtForm.monthlyPayment}
            onChange={(e) => setDebtForm((prev) => ({ ...prev, monthlyPayment: e.target.value }))}
            inputMode="decimal"
            placeholder="0"
          />

          <Input
            label="Suku Bunga % per Tahun (Opsional)"
            value={debtForm.interestRate}
            onChange={(e) => setDebtForm((prev) => ({ ...prev, interestRate: e.target.value }))}
            inputMode="decimal"
            placeholder="0"
          />

          <ModernDatePicker
            label="Tanggal Jatuh Tempo (Opsional)"
            value={debtForm.dueDate}
            onChange={(d) => setDebtForm((prev) => ({ ...prev, dueDate: d }))}
            allowClear
            placeholder="Pilih tanggal jatuh tempo..."
          />

          <Input
            label="Catatan Tambahan (Opsional)"
            value={debtForm.notes}
            onChange={(e) => setDebtForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Keterangan nomor kontrak / tenor pinjaman"
          />

          {error && <p className="text-sm font-medium text-[var(--negative)]">{error}</p>}

          <Button block loading={saving} onClick={() => void submitDebt()}>
            {t('common.save')}
          </Button>
        </div>
      </Modal>

      <Modal open={!!paying} title="Bayar Cicilan Hutang" onClose={() => setPaying(null)}>
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-sunken)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Kreditur / Tagihan
            </p>
            <p className="mt-0.5 font-display text-sm font-bold text-[var(--text-primary)]">
              {paying?.creditor}
            </p>
            <p className="mt-1 text-xs text-[var(--negative)]">
              Sisa Hutang: <b>{formatMoney(paying?.currentBalance ?? 0, currency)}</b>
            </p>
          </div>

          <Input
            label="Jumlah Pembayaran"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
            inputMode="decimal"
            placeholder="0"
          />

          <ModernSelect
            label="Potong dari Rekening / Dompet"
            value={paymentForm.wallet}
            onChange={(w) => setPaymentForm((prev) => ({ ...prev, wallet: w }))}
            options={wallets
              .filter((w) => !w.isArchived)
              .map((w) => ({
                value: w.id,
                label: w.name,
                badge: formatMoney(w.balance, currency),
              }))}
            placeholder="Pilih Dompet Sumber Dana"
          />

          <ModernDatePicker
            label="Tanggal Pembayaran"
            value={paymentForm.date}
            onChange={(d) => setPaymentForm((prev) => ({ ...prev, date: d }))}
          />

          <Input
            label="Keterangan Transaksi"
            value={paymentForm.note}
            onChange={(e) => setPaymentForm((prev) => ({ ...prev, note: e.target.value }))}
            placeholder={`Cicilan: ${paying?.creditor ?? ''}`}
          />

          {error && <p className="text-sm font-medium text-[var(--negative)]">{error}</p>}

          <Button block loading={saving} onClick={() => void submitPayment()}>
            Catat Pembayaran & Potong Saldo
          </Button>
        </div>
      </Modal>
    </div>
  )
}