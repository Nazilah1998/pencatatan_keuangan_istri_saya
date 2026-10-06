import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Edit2,
  PauseCircle,
  PiggyBank,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Wallet as WalletIcon,
} from 'lucide-react'

import {
  SavingsRepo,
  TxRepo,
  WalletRepo,
  type SavingsGoal,
  type Wallet,
} from '../../lib/api/repositories'
import { formatMoney, parseAmount, percent } from '../../lib/utils/currency'
import { formatDate, todayISO } from '../../lib/utils/date'
import { useApp } from '../providers/useApp'
import { Button } from '../ui/Button'
import { Card, Skeleton } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { ModernDatePicker } from '../ui/ModernDatePicker'
import { ModernSelect } from '../ui/ModernSelect'

type GoalForm = {
  name: string
  targetAmount: string
  monthlyContribution: string
  targetDate: string
  status: SavingsGoal['status']
  includeInNetWorth: boolean
}

type FundForm = { wallet: string; amount: string; date: string }

const EMPTY_GOAL: GoalForm = {
  name: '',
  targetAmount: '',
  monthlyContribution: '',
  targetDate: '',
  status: 'active',
  includeInNetWorth: true,
}

const EMPTY_FUND: FundForm = { wallet: '', amount: '', date: '' }
const PRESET_FUNDS = [50000, 100000, 200000, 500000, 1000000]

export function SavingsScreen() {
  const { t, m, session } = useApp()
  const currency = session?.baseCurrency === 'USD' ? 'USD' : 'IDR'

  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [goalOpen, setGoalOpen] = useState(false)
  const [editing, setEditing] = useState<SavingsGoal | null>(null)
  const [goalForm, setGoalForm] = useState<GoalForm>(EMPTY_GOAL)

  const [funding, setFunding] = useState<SavingsGoal | null>(null)
  const [fundForm, setFundForm] = useState<FundForm>(EMPTY_FUND)

  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [g, w] = await Promise.all([
        SavingsRepo.list(true).catch(() => []),
        WalletRepo.list(false).catch(() => []),
      ])
      setGoals(g)
      setWallets(w)
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

  const totalSaved = useMemo(
    () => goals.reduce((sum, goal) => sum + goal.currentAmount, 0),
    [goals],
  )

  const totalTarget = useMemo(
    () => goals.reduce((sum, goal) => sum + goal.targetAmount, 0),
    [goals],
  )

  const overallPercent = percent(totalSaved, totalTarget)

  function openGoal(goal: SavingsGoal | null) {
    setEditing(goal)
    setGoalForm(
      goal
        ? {
            name: goal.name,
            targetAmount: String(goal.targetAmount),
            monthlyContribution: String(goal.monthlyContribution || ''),
            targetDate: goal.targetDate ? goal.targetDate.slice(0, 10) : '',
            status: goal.status,
            includeInNetWorth: goal.includeInNetWorth,
          }
        : EMPTY_GOAL,
    )
    setError('')
    setGoalOpen(true)
  }

  function openFund(goal: SavingsGoal) {
    setFunding(goal)
    setFundForm({ wallet: wallets[0]?.id ?? '', amount: '', date: todayISO() })
    setError('')
  }

  function addFundPreset(val: number) {
    const current = parseAmount(fundForm.amount)
    setFundForm((prev) => ({ ...prev, amount: String(current + val) }))
  }

  async function submitGoal() {
    const target = parseAmount(goalForm.targetAmount)

    if (!goalForm.name.trim()) {
      setError(t('wallet.nameRequired'))
      return
    }
    if (target <= 0) {
      setError(m('common.amountRequired'))
      return
    }

    setSaving(true)

    try {
      const payload = {
        name: goalForm.name.trim(),
        targetAmount: target,
        monthlyContribution: parseAmount(goalForm.monthlyContribution),
        targetDate: goalForm.targetDate ? `${goalForm.targetDate} 00:00:00.000Z` : '',
        status: goalForm.status,
        includeInNetWorth: goalForm.includeInNetWorth,
      }

      if (editing) await SavingsRepo.update(editing.id, payload)
      else await SavingsRepo.create(payload)

      setGoalOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
    } finally {
      setSaving(false)
    }
  }

  async function removeGoal(goal: SavingsGoal) {
    if (!window.confirm(t('common.delete_confirm_desc'))) return

    setSaving(true)

    try {
      await SavingsRepo.remove(goal.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
      setSaving(false)
    }
  }

  async function submitFund() {
    const amount = parseAmount(fundForm.amount)

    if (!funding) return
    if (amount <= 0) {
      setError(m('common.amountRequired'))
      return
    }
    if (!fundForm.wallet) {
      setError(t('transactions.form.select_wallet'))
      return
    }

    setSaving(true)

    try {
      const newAmount = (funding.currentAmount || 0) + amount
      await Promise.all([
        TxRepo.create({
          type: 'expense',
          amount,
          date: fundForm.date,
          wallet: fundForm.wallet,
          savingsGoal: funding.id,
          note: `Tabungan: ${funding.name}`,
        }),
        SavingsRepo.update(funding.id, {
          currentAmount: newAmount,
          status: newAmount >= funding.targetAmount ? 'completed' : funding.status,
        }),
      ])

      setFunding(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
    } finally {
      setSaving(false)
    }
  }

  const goalAmountNum = parseAmount(goalForm.targetAmount)
  const fundAmountNum = parseAmount(fundForm.amount)

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <PiggyBank className="size-5" />
            </span>
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {t('savings.current_amount')}
              </p>
              <h2 className="font-display text-2xl font-extrabold text-[var(--text-primary)]">
                {formatMoney(totalSaved, currency)}
              </h2>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--accent)]">
              <Sparkles className="size-3.5" />
              <span>{Math.round(overallPercent)}%</span>
            </span>
            <p className="mt-1 text-[0.6875rem] text-[var(--text-muted)]">
              Target: {formatMoney(totalTarget, currency)}
            </p>
          </div>
        </div>

        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--surface-sunken)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${Math.min(overallPercent, 100)}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => openGoal(null)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 font-display text-sm font-bold text-[var(--text-inverted)] shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
      >
        <Plus className="size-4 stroke-[2.5]" />
        <span>{t('savings.add_button')}</span>
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
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--line-subtle)] bg-[var(--surface-raised)]/50 p-8 text-center sm:p-12">
          <div className="grid size-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] shadow-xs">
            <PiggyBank className="size-7" />
          </div>
          <h3 className="mt-4 font-display text-base font-bold text-[var(--text-primary)]">
            {t('savings.empty_title')}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-[var(--text-muted)]">
            {t('savings.empty_subtitle')}
          </p>
          <button
            type="button"
            onClick={() => openGoal(null)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 font-display text-xs font-bold text-[var(--text-inverted)] shadow-sm transition-all hover:opacity-90 active:scale-95"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Buat Target Pertama</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {goals.map((goal) => {
            const used = percent(goal.currentAmount, goal.targetAmount)
            const isCompleted = goal.status === 'completed' || goal.currentAmount >= goal.targetAmount

            return (
              <div
                key={goal.id}
                className="overflow-hidden rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] p-4 shadow-xs transition-colors hover:border-[var(--line-strong)]"
              >
                <div className="mb-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-display text-sm font-bold text-[var(--text-primary)]">
                        {goal.name}
                      </h2>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2 py-0.2 text-[0.625rem] font-bold text-[var(--accent)]">
                          <CheckCircle2 className="size-3" />
                          <span>Tercapai</span>
                        </span>
                      )}
                      {goal.status === 'paused' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-sunken)] px-2 py-0.2 text-[0.625rem] font-bold text-[var(--text-muted)]">
                          <PauseCircle className="size-3" />
                          <span>Dijeda</span>
                        </span>
                      )}
                    </div>

                    <p className="mt-1 font-mono text-xs text-[var(--text-secondary)]">
                      {formatMoney(goal.currentAmount, currency)}{' '}
                      <span className="text-[var(--text-muted)]">dari {formatMoney(goal.targetAmount, currency)}</span>
                    </p>
                  </div>

                  <span className="font-display text-sm font-extrabold text-[var(--accent)]">
                    {Math.round(used)}%
                  </span>
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
                      isCompleted ? 'bg-[var(--accent)]' : 'bg-[var(--brand-500)]',
                    ].join(' ')}
                    style={{ width: `${Math.min(used, 100)}%` }}
                  />
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                  {goal.targetDate && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3 text-[var(--text-muted)]" />
                      <span>Target: {formatDate(goal.targetDate.slice(0, 10), 'short')}</span>
                    </span>
                  )}
                  {goal.monthlyContribution > 0 && (
                    <span>Setoran bulanan: {formatMoney(goal.monthlyContribution, currency)}</span>
                  )}
                </div>

                <div className="mt-3.5 flex flex-wrap items-center justify-between border-t border-[var(--line-subtle)]/60 pt-2.5">
                  <button
                    type="button"
                    onClick={() => openFund(goal)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-soft)] px-3 py-1.5 font-display text-xs font-bold text-[var(--accent)] transition-all hover:opacity-80 active:scale-95"
                  >
                    <Plus className="size-3.5 stroke-[2.5]" />
                    <span>{t('savings.add_funds')}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openGoal(goal)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)] active:scale-95"
                    >
                      <Edit2 className="size-3" />
                      <span>{t('common.edit')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeGoal(goal)}
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

      <Modal
        open={goalOpen}
        title={editing ? t('savings.save_changes') : t('savings.create_target')}
        onClose={() => setGoalOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="goal-name-input" className="block text-xs font-medium text-[var(--text-secondary)]">
              {t('savings.goal_name')}
            </label>
            <input
              id="goal-name-input"
              type="text"
              value={goalForm.name}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t('savings.goal_name_placeholder')}
              className="w-full rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div className="rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-sunken)]/60 p-3.5 transition-colors focus-within:border-[var(--accent)]">
            <label htmlFor="goal-target-amount-input" className="block text-xs font-medium text-[var(--text-muted)]">
              {t('savings.target_amount')}
            </label>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-lg font-bold text-[var(--text-muted)]">
                {currency === 'IDR' ? 'Rp' : '$'}
              </span>
              <input
                id="goal-target-amount-input"
                type="text"
                inputMode="numeric"
                value={goalForm.targetAmount}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '')
                  setGoalForm((prev) => ({ ...prev, targetAmount: cleaned }))
                }}
                placeholder="0"
                className="w-full bg-transparent font-display text-xl font-extrabold tracking-tight text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]/40"
              />
            </div>
            {goalAmountNum > 0 && (
              <p className="mt-1 font-sans text-xs font-medium text-[var(--text-muted)]">
                {formatMoney(goalAmountNum, currency)}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="goal-monthly-input" className="block text-xs font-medium text-[var(--text-secondary)]">
              {t('savings.fund_amount')} (Opsional per bulan)
            </label>
            <input
              id="goal-monthly-input"
              type="text"
              inputMode="numeric"
              value={goalForm.monthlyContribution}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9]/g, '')
                setGoalForm((prev) => ({ ...prev, monthlyContribution: cleaned }))
              }}
              placeholder="0"
              className="w-full rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-base)] px-3 py-2 text-sm text-[var(--text-primary)] transition-all focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <ModernDatePicker
            label={`${t('savings.target_date')} (Opsional)`}
            value={goalForm.targetDate}
            onChange={(d) => setGoalForm((prev) => ({ ...prev, targetDate: d }))}
            allowClear
            placeholder="Pilih tanggal target (opsional)..."
          />

          <ModernSelect
            label="Status Target"
            value={goalForm.status}
            onChange={(val) => setGoalForm((prev) => ({ ...prev, status: val as GoalForm['status'] }))}
            options={[
              { value: 'active', label: 'Aktif', icon: <CheckCircle2 className="size-4 text-[var(--accent)]" /> },
              { value: 'paused', label: 'Dijeda', icon: <PauseCircle className="size-4 text-[var(--warning)]" /> },
              { value: 'completed', label: 'Selesai / Tercapai', icon: <Sparkles className="size-4 text-[var(--accent-strong)]" /> },
            ]}
          />

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-[var(--negative-soft)] p-3 text-xs font-medium text-[var(--negative)]">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => void submitGoal()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 font-display text-sm font-bold text-[var(--text-inverted)] shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            <span>{t('common.save')}</span>
          </button>
        </div>
      </Modal>

      <Modal
        open={!!funding}
        title={funding ? `Tambah Dana: ${funding.name}` : t('savings.add_funds')}
        onClose={() => setFunding(null)}
      >
        <div className="space-y-4">
          <ModernSelect
            label={
              <span className="flex items-center gap-1.5 normal-case font-medium text-[var(--text-secondary)]">
                <WalletIcon className="size-3.5 text-[var(--text-muted)]" />
                <span>Sumber Dompet</span>
              </span>
            }
            value={fundForm.wallet}
            onChange={(w) => setFundForm((prev) => ({ ...prev, wallet: w }))}
            options={wallets.map((w) => ({
              value: w.id,
              label: w.name,
              icon: <WalletIcon className="size-4 text-[var(--accent)]" />,
              badge: formatMoney(w.balance, currency),
            }))}
            placeholder="Pilih Dompet"
          />

          <div className="rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-sunken)]/60 p-3.5 transition-colors focus-within:border-[var(--accent)]">
            <label htmlFor="fund-amount-input" className="block text-xs font-medium text-[var(--text-muted)]">
              Jumlah Dana yang Ditabung
            </label>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-lg font-bold text-[var(--text-muted)]">
                {currency === 'IDR' ? 'Rp' : '$'}
              </span>
              <input
                id="fund-amount-input"
                type="text"
                inputMode="numeric"
                value={fundForm.amount}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '')
                  setFundForm((prev) => ({ ...prev, amount: cleaned }))
                }}
                placeholder="0"
                className="w-full bg-transparent font-display text-xl font-extrabold tracking-tight text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]/40"
              />
            </div>
            {fundAmountNum > 0 && (
              <p className="mt-1 font-sans text-xs font-medium text-[var(--text-muted)]">
                {formatMoney(fundAmountNum, currency)}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2 border-t border-[var(--line-subtle)]/60">
              {PRESET_FUNDS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => addFundPreset(val)}
                  className="rounded-lg border border-[var(--line-subtle)] bg-[var(--surface-raised)] px-2 py-0.5 text-[0.6875rem] font-medium text-[var(--text-secondary)] shadow-2xs transition-all hover:border-[var(--accent)] hover:text-[var(--text-primary)] active:scale-95"
                >
                  +{val >= 1000000 ? `${val / 1000000}jt` : `${val / 1000}rb`}
                </button>
              ))}
            </div>
          </div>

          <ModernDatePicker
            label={
              <span className="flex items-center gap-1.5 normal-case font-medium text-[var(--text-secondary)]">
                <Calendar className="size-3.5 text-[var(--text-muted)]" />
                <span>{t('transactions.form.date')}</span>
              </span>
            }
            value={fundForm.date}
            onChange={(d) => setFundForm((prev) => ({ ...prev, date: d }))}
          />

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-[var(--negative-soft)] p-3 text-xs font-medium text-[var(--negative)]">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => void submitFund()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 font-display text-sm font-bold text-[var(--text-inverted)] shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            <span>Setor ke Tabungan</span>
          </button>
        </div>
      </Modal>
    </div>
  )
}