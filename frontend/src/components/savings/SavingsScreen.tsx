/**
 * Layar tabungan: target, progres, dan penambahan dana.
 *
 * Penambahan dana dicatat sebagai transaksi pengeluaran yang menunjuk
 * `savings_goal`, karena di situ saldo tabungan (`current_amount`) dan saldo
 * wallet dihitung ulang oleh hook backend. Nilai turunan tidak pernah ditulis
 * dari klien.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

import {
  SavingsRepo,
  TxRepo,
  WalletRepo,
  type SavingsGoal,
  type Wallet,
} from '../../lib/api/repositories'
import { formatMoney, parseAmount, percent } from '../../lib/utils/currency'
import { todayISO } from '../../lib/utils/date'
import { useApp } from '../providers/useApp'
import { Button } from '../ui/Button'
import { Card, EmptyState, Skeleton } from '../ui/Card'
import { Input, Select } from '../ui/Field'
import { Modal } from '../ui/Modal'

type GoalForm = {
  name: string
  targetAmount: string
  monthlyContribution: string
  targetDate: string
  status: SavingsGoal['status']
}

type FundForm = { wallet: string; amount: string; date: string }

const EMPTY_GOAL: GoalForm = {
  name: '',
  targetAmount: '',
  monthlyContribution: '',
  targetDate: '',
  status: 'active',
}

const EMPTY_FUND: FundForm = { wallet: '', amount: '', date: '' }

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
      const [g, w] = await Promise.all([SavingsRepo.list(true), WalletRepo.list(false)])
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
  }, [load])

  const totalSaved = useMemo(
    () => goals.reduce((sum, goal) => sum + goal.currentAmount, 0),
    [goals],
  )

  function openGoal(goal: SavingsGoal | null) {
    setEditing(goal)
    setGoalForm(
      goal
        ? {
            name: goal.name,
            targetAmount: String(goal.targetAmount),
            monthlyContribution: String(goal.monthlyContribution),
            targetDate: goal.targetDate ? goal.targetDate.slice(0, 10) : '',
            status: goal.status,
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
      await TxRepo.create({
        type: 'expense',
        amount,
        date: fundForm.date,
        wallet: fundForm.wallet,
        savingsGoal: funding.id,
        note: funding.name,
      })

      setFunding(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : m('common.retry'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="tile p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          {t('savings.current_amount')}
        </p>
        <p className="tnum mt-1 text-2xl font-semibold">{formatMoney(totalSaved, currency)}</p>
      </div>

      <Button block onClick={() => openGoal(null)}>
        <Plus className="size-4" aria-hidden />
        {t('savings.add_button')}
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
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : goals.length === 0 ? (
        <EmptyState title={t('savings.empty_title')} hint={t('savings.empty_subtitle')} />
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const used = percent(goal.currentAmount, goal.targetAmount)

            return (
              <Card key={goal.id}>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">{goal.name}</h2>
                    <p className="tnum mt-0.5 text-xs text-[var(--text-muted)]">
                      {formatMoney(goal.currentAmount, currency)} {t('budget.card.spent_of')}{' '}
                      {formatMoney(goal.targetAmount, currency)}
                    </p>
                  </div>

                  <span className="tnum shrink-0 text-xs font-medium text-[var(--accent)]">
                    {used}%
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
                    className="h-full rounded-full bg-[var(--accent)] transition-[width]"
                    style={{ width: `${Math.min(used, 100)}%` }}
                  />
                </div>

                {goal.monthlyContribution > 0 && (
                  <p className="tnum mt-2 text-xs text-[var(--text-muted)]">
                    {t('savings.fund_amount')}: {formatMoney(goal.monthlyContribution, currency)}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openFund(goal)}>
                    {t('savings.add_funds')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openGoal(goal)}>
                    {t('common.edit')}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void removeGoal(goal)}>
                    {t('common.delete')}
                  </Button>
                </div>
              </Card>
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
          <Input
            label={t('savings.goal_name')}
            value={goalForm.name}
            onChange={(e) => setGoalForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder={t('savings.goal_name_placeholder')}
          />

          <Input
            label={t('savings.target_amount')}
            value={goalForm.targetAmount}
            onChange={(e) => setGoalForm((prev) => ({ ...prev, targetAmount: e.target.value }))}
            inputMode="decimal"
            placeholder="0"
            hint={
              goalForm.targetAmount
                ? formatMoney(parseAmount(goalForm.targetAmount), currency)
                : undefined
            }
          />

          <Input
            label={t('savings.fund_amount')}
            value={goalForm.monthlyContribution}
            onChange={(e) =>
              setGoalForm((prev) => ({ ...prev, monthlyContribution: e.target.value }))
            }
            inputMode="decimal"
            placeholder="0"
          />

          <Input
            label={t('savings.target_date')}
            type="date"
            value={goalForm.targetDate}
            onChange={(e) => setGoalForm((prev) => ({ ...prev, targetDate: e.target.value }))}
          />

          <Select
            label={t('savings.priority')}
            value={goalForm.status}
            onChange={(e) =>
              setGoalForm((prev) => ({ ...prev, status: e.target.value as GoalForm['status'] }))
            }
          >
            <option value="active">{t('savings.priority_high')}</option>
            <option value="paused">{t('savings.priority_medium')}</option>
            <option value="completed">{t('savings.priority_low')}</option>
          </Select>

          {error && <p className="text-sm text-[var(--negative)]">{error}</p>}

          <Button block loading={saving} onClick={() => void submitGoal()}>
            {t('common.save')}
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!funding}
        title={t('savings.add_funds')}
        onClose={() => setFunding(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">{funding?.name}</p>

          <Select
            label={t('transactions.form.select_wallet')}
            value={fundForm.wallet}
            onChange={(e) => setFundForm((prev) => ({ ...prev, wallet: e.target.value }))}
          >
            <option value="">—</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>

          <Input
            label={t('savings.fund_amount')}
            value={fundForm.amount}
            onChange={(e) => setFundForm((prev) => ({ ...prev, amount: e.target.value }))}
            inputMode="decimal"
            placeholder="0"
          />

          <Input
            label={t('transactions.form.date')}
            type="date"
            value={fundForm.date}
            onChange={(e) => setFundForm((prev) => ({ ...prev, date: e.target.value }))}
          />

          {error && <p className="text-sm text-[var(--negative)]">{error}</p>}

          <Button block loading={saving} onClick={() => void submitFund()}>
            {t('common.save')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}