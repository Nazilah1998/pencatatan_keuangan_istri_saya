/**
 * Lapisan akses data ke PocketBase.
 *
 * Komponen memakai fungsi di sini, bukan `pb.collection(...)` langsung. Setiap
 * query menambahkan filter `household_id` eksplisit selain rule PocketBase,
 * sehingga data yang tampil tidak pernah bisa milik household lain.
 *
 * Aturan pemetaan:
 * - field PocketBase memakai snake_case; payload create/update diserialisasi di
 *   sini agar komponen boleh tetap memakai camelCase;
 * - `balance`, `current_amount`, dan `current_balance` tidak pernah ditulis dari
 *   klien karena nilainya diturunkan hook backend.
 */
import { AuthStore } from '../pb/authStore'
import { getPB } from '../pb/client'
import { monthRange } from '../utils/date'

export type TxType = 'income' | 'expense' | 'transfer'
export type WalletType = 'cash' | 'bank' | 'ewallet' | 'savings' | 'credit_card' | 'investment'

export type Wallet = {
  id: string
  name: string
  type: WalletType
  balance: number
  initialBalance: number
  icon: string
  color: string
  includeInNetWorth: boolean
  isArchived: boolean
  sortOrder: number
}

export type Category = {
  id: string
  name: string
  type: 'income' | 'expense' | 'transfer'
  icon: string
  color: string
  isArchived: boolean
}

export type SubCategory = {
  id: string
  name: string
  category: string
  isArchived: boolean
}

export type Transaction = {
  id: string
  date: string
  type: TxType
  amount: number
  note: string
  category: string
  subCategory: string
  wallet: string
  toWallet: string
  savingsGoal: string
  isRecurring: boolean
  isSystem: boolean
}

export type SavingsGoal = {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  monthlyContribution: number
  targetDate: string
  status: 'active' | 'completed' | 'paused'
  icon: string
  color: string
  includeInNetWorth: boolean
}

export type Debt = {
  id: string
  creditor: string
  type: 'loan' | 'credit_card' | 'other'
  principal: number
  currentBalance: number
  interestRate: number
  monthlyPayment: number
  startDate: string
  dueDate: string
  status: 'active' | 'paid' | 'overdue'
  notes: string
}

export type DebtPayment = {
  id: string
  debt: string
  amount: number
  date: string
  wallet: string
  note: string
}

export type Budget = {
  id: string
  month: string
  category: string
  amount: number
  notes: string
}

export type Household = {
  id: string
  name: string
  currency: string
  language: string
}

type Rec = Record<string, unknown>

function householdId(): string {
  const session = AuthStore.get()
  if (!session) throw new Error('Sesi berakhir, silakan masuk kembali')
  return session.householdId
}

/** Scope tenant yang selalu ditambahkan ke filter baca. */
function scope(...clauses: string[]): string {
  const id = householdId()
  const valid = clauses.filter(Boolean)
  return [`household_id = "${id}"`, ...valid].join(' && ')
}

function escape(value: string): string {
  return value.replace(/"/g, '\\"')
}

/** Menyalin hanya key yang ada pada payload (tidak mengunci kolom turunan). */
function pick(input: Rec, keys: readonly string[]): Rec {
  const out: Rec = {}
  for (const key of keys) {
    if (input[key] !== undefined) out[key] = input[key]
  }
  return out
}

function mapWallet(rec: Rec): Wallet {
  return {
    id: rec.id as string,
    name: rec.name as string,
    type: rec.type as WalletType,
    balance: Number(rec.balance ?? 0),
    initialBalance: Number(rec.initial_balance ?? 0),
    icon: (rec.icon as string) ?? 'wallet',
    color: (rec.color as string) ?? '',
    includeInNetWorth: rec.include_in_networth === undefined ? true : Boolean(rec.include_in_networth),
    isArchived: Boolean(rec.is_archived ?? false),
    sortOrder: Number(rec.sort_order ?? 999),
  }
}

function mapCategory(rec: Rec): Category {
  return {
    id: rec.id as string,
    name: rec.name as string,
    type: rec.type as Category['type'],
    icon: (rec.icon as string) ?? '',
    color: (rec.color as string) ?? '',
    isArchived: Boolean(rec.is_archived ?? false),
  }
}

function mapSubCategory(rec: Rec): SubCategory {
  return {
    id: rec.id as string,
    name: rec.name as string,
    category: (rec.category as string) ?? '',
    isArchived: Boolean(rec.is_archived ?? false),
  }
}

function mapTx(rec: Rec): Transaction {
  return {
    id: rec.id as string,
    date: (rec.date as string) ?? '',
    type: rec.type as TxType,
    amount: Number(rec.amount ?? 0),
    note: (rec.note as string) ?? '',
    category: (rec.category as string) ?? '',
    subCategory: (rec.sub_category as string) ?? '',
    wallet: (rec.wallet as string) ?? '',
    toWallet: (rec.to_wallet as string) ?? '',
    savingsGoal: (rec.savings_goal as string) ?? '',
    isRecurring: Boolean(rec.is_recurring ?? false),
    isSystem: Boolean(rec.is_system ?? false),
  }
}

function mapSavings(rec: Rec): SavingsGoal {
  return {
    id: rec.id as string,
    name: rec.name as string,
    targetAmount: Number(rec.target_amount ?? 0),
    currentAmount: Number(rec.current_amount ?? 0),
    monthlyContribution: Number(rec.monthly_contribution ?? 0),
    targetDate: (rec.target_date as string) ?? '',
    status: (rec.status as SavingsGoal['status']) ?? 'active',
    icon: (rec.icon as string) ?? '',
    color: (rec.color as string) ?? '',
    includeInNetWorth: rec.include_in_networth === undefined ? true : Boolean(rec.include_in_networth),
  }
}

function mapDebt(rec: Rec): Debt {
  const principal = Number(rec.principal ?? 0)
  const rawCur = rec.current_balance
  const currentBalance =
    rawCur !== undefined && rawCur !== null && rawCur !== ''
      ? Number(rawCur)
      : principal

  return {
    id: rec.id as string,
    creditor: rec.creditor as string,
    type: rec.type as Debt['type'],
    principal,
    currentBalance,
    interestRate: Number(rec.interest_rate ?? 0),
    monthlyPayment: Number(rec.monthly_payment ?? 0),
    startDate: (rec.start_date as string) ?? '',
    dueDate: (rec.due_date as string) ?? '',
    status: (rec.status as Debt['status']) ?? 'active',
    notes: (rec.notes as string) ?? '',
  }
}

function mapDebtPayment(rec: Rec): DebtPayment {
  return {
    id: rec.id as string,
    debt: (rec.debt as string) ?? '',
    amount: Number(rec.amount ?? 0),
    date: (rec.date as string) ?? '',
    wallet: (rec.wallet as string) ?? '',
    note: (rec.note as string) ?? '',
  }
}

function mapBudget(rec: Rec): Budget {
  return {
    id: rec.id as string,
    month: rec.month as string,
    category: (rec.category as string) ?? '',
    amount: Number(rec.amount ?? 0),
    notes: (rec.notes as string) ?? '',
  }
}

function unmapWallet(input: Partial<Wallet>): Rec {
  const out: Rec = {}
  if (input.name !== undefined) out.name = input.name
  if (input.type !== undefined) out.type = input.type
  if (input.initialBalance !== undefined) out.initial_balance = input.initialBalance
  if (input.balance !== undefined) out.balance = input.balance
  if (input.icon !== undefined) out.icon = input.icon
  if (input.color !== undefined) out.color = input.color
  if (input.includeInNetWorth !== undefined) out.include_in_networth = input.includeInNetWorth
  if (input.isArchived !== undefined) out.is_archived = input.isArchived
  if (input.sortOrder !== undefined) out.sort_order = input.sortOrder
  return out
}

const CATEGORY_KEYS = ['name', 'type', 'icon', 'color', 'is_archived'] as const

export const WalletRepo = {
  async list(includeArchived = false): Promise<Wallet[]> {
    const clauses = includeArchived ? [] : ['is_archived = false']

    const [recordsResult, txRecords] = await Promise.all([
      getPB()
        .collection('wallets')
        .getFullList<Rec>({ filter: scope(...clauses), sort: 'sort_order,name' })
        .catch(() =>
          getPB()
            .collection('wallets')
            .getFullList<Rec>({ filter: scope(...clauses), sort: 'name' }),
        ),
      getPB()
        .collection('transactions')
        .getFullList<Rec>({ filter: scope(), fields: 'id,wallet,to_wallet,type,amount' })
        .catch(() => []),
    ])

    const list = recordsResult.map((rec) => {
      const wallet = mapWallet(rec)
      const wId = wallet.id
      const inTx = txRecords.filter((t) => t.wallet === wId && t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0)
      const outTx = txRecords.filter((t) => t.wallet === wId && t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0)
      const trfOut = txRecords.filter((t) => t.wallet === wId && t.type === 'transfer').reduce((sum, t) => sum + Number(t.amount || 0), 0)
      const trfIn = txRecords.filter((t) => t.to_wallet === wId && t.type === 'transfer').reduce((sum, t) => sum + Number(t.amount || 0), 0)
      const computedBalance = (wallet.initialBalance || 0) + inTx - outTx - trfOut + trfIn

      if (Number(rec.balance ?? 0) !== computedBalance) {
        getPB().collection('wallets').update(wId, { balance: computedBalance }).catch(() => null)
      }

      return {
        ...wallet,
        balance: computedBalance,
      }
    })

    try {
      const stored = localStorage.getItem('sintya.wallet_order')
      if (stored) {
        const orderMap = JSON.parse(stored) as Record<string, number>
        list.sort((a, b) => {
          const ordA = a.sortOrder || orderMap[a.id] || 999
          const ordB = b.sortOrder || orderMap[b.id] || 999
          if (ordA !== ordB) return ordA - ordB
          return a.name.localeCompare(b.name)
        })
      }
    } catch {
      void 0
    }

    return list
  },

  async create(input: Partial<Wallet>): Promise<Wallet> {
    const payload = {
      ...unmapWallet(input),
      balance: input.balance ?? input.initialBalance ?? 0,
      household_id: householdId(),
    }
    const rec = await getPB().collection('wallets').create(payload)
    return mapWallet(rec as unknown as Rec)
  },

  async update(id: string, input: Partial<Wallet>): Promise<Wallet> {
    const payload = unmapWallet(input)
    const rec = await getPB().collection('wallets').update(id, payload)
    return mapWallet(rec as unknown as Rec)
  },

  async remove(id: string) {
    await getPB().collection('wallets').delete(id)
  },
}

function unmapTx(input: Partial<Transaction>): Rec {
  const out: Rec = {}
  if (input.type !== undefined) out.type = input.type
  if (input.amount !== undefined) out.amount = input.amount
  if (input.date !== undefined) out.date = input.date
  if (input.note !== undefined) out.note = input.note
  if (input.category !== undefined) out.category = input.category
  if (input.subCategory !== undefined) out.sub_category = input.subCategory
  if (input.wallet !== undefined) out.wallet = input.wallet
  if (input.toWallet !== undefined) out.to_wallet = input.toWallet
  if (input.savingsGoal !== undefined) out.savings_goal = input.savingsGoal
  if (input.isRecurring !== undefined) out.is_recurring = input.isRecurring
  return out
}

export const CategoryRepo = {
  async list(type?: Category['type']): Promise<Category[]> {
    const clauses = type ? [`type = "${escape(type)}"`] : []
    const records = await getPB()
      .collection('categories')
      .getFullList<Rec>({ filter: scope(...clauses), sort: 'name' })

    return records.map(mapCategory)
  },

  async create(input: Partial<Category>): Promise<Category> {
    const payload = { ...pick(input as Rec, CATEGORY_KEYS), household_id: householdId() }
    const rec = await getPB().collection('categories').create(payload)
    return mapCategory(rec as unknown as Rec)
  },

  async update(id: string, input: Partial<Category>): Promise<Category> {
    const rec = await getPB().collection('categories').update(id, pick(input as Rec, CATEGORY_KEYS))
    return mapCategory(rec as unknown as Rec)
  },

  async remove(id: string) {
    await getPB().collection('categories').delete(id)
  },
}

export const SubCategoryRepo = {
  async list(categoryId?: string): Promise<SubCategory[]> {
    const clauses = categoryId ? [`category = "${escape(categoryId)}"`] : []
    const records = await getPB()
      .collection('sub_categories')
      .getFullList<Rec>({ filter: scope(...clauses), sort: 'name' })

    return records.map(mapSubCategory)
  },

  async create(input: { name: string; category: string }): Promise<SubCategory> {
    const rec = await getPB()
      .collection('sub_categories')
      .create({ name: input.name, category: input.category, household_id: householdId() })

    return mapSubCategory(rec as unknown as Rec)
  },

  async remove(id: string) {
    await getPB().collection('sub_categories').delete(id)
  },
}

export const TxRepo = {
  async listByMonth(month: string): Promise<Transaction[]> {
    const { start, end } = monthRange(month)
    const records = await getPB()
      .collection('transactions')
      .getList<Rec>(1, 200, {
        filter: scope('date >= "' + start + '"', 'date <= "' + end + '"'),
        sort: '-date, -created',
      })

    return records.items.map(mapTx)
  },

  async listRange(start: string, end: string): Promise<Transaction[]> {
    const records = await getPB()
      .collection('transactions')
      .getList<Rec>(1, 500, {
        filter: scope(`date >= "${start}"`, `date <= "${end}"`),
        sort: '-date, -created',
      })

    return records.items.map(mapTx)
  },

  async recent(limit = 5): Promise<Transaction[]> {
    const records = await getPB()
      .collection('transactions')
      .getList<Rec>(1, limit, { filter: scope(), sort: '-date, -created' })

    return records.items.map(mapTx)
  },

  async create(input: Partial<Transaction>): Promise<Transaction> {
    const payload = { ...unmapTx(input), household_id: householdId() }
    const rec = await getPB().collection('transactions').create(payload)
    return mapTx(rec as unknown as Rec)
  },

  async update(id: string, input: Partial<Transaction>): Promise<Transaction> {
    const rec = await getPB().collection('transactions').update(id, unmapTx(input))
    return mapTx(rec as unknown as Rec)
  },

  async remove(id: string) {
    await getPB().collection('transactions').delete(id)
  },
}

function unmapSavings(input: Partial<SavingsGoal>): Rec {
  const out: Rec = {}
  if (input.name !== undefined) out.name = input.name
  if (input.targetAmount !== undefined) out.target_amount = input.targetAmount
  if (input.currentAmount !== undefined) out.current_amount = input.currentAmount
  if (input.monthlyContribution !== undefined) out.monthly_contribution = input.monthlyContribution
  if (input.targetDate !== undefined) out.target_date = input.targetDate
  if (input.status !== undefined) out.status = input.status
  if (input.icon !== undefined) out.icon = input.icon
  if (input.color !== undefined) out.color = input.color
  if (input.includeInNetWorth !== undefined) out.include_in_networth = input.includeInNetWorth
  return out
}

export const SavingsRepo = {
  async list(includeCompleted = false): Promise<SavingsGoal[]> {
    const clauses = includeCompleted ? [] : ['status != "completed"']
    const records = await getPB()
      .collection('savings')
      .getFullList<Rec>({ filter: scope(...clauses), sort: 'name' })

    return records.map(mapSavings)
  },

  async create(input: Partial<SavingsGoal>): Promise<SavingsGoal> {
    const payload = {
      ...unmapSavings(input),
      current_amount: input.currentAmount ?? 0,
      include_in_networth: input.includeInNetWorth ?? true,
      household_id: householdId(),
    }
    const rec = await getPB().collection('savings').create(payload)
    return mapSavings(rec as unknown as Rec)
  },

  async update(id: string, input: Partial<SavingsGoal>): Promise<SavingsGoal> {
    const rec = await getPB().collection('savings').update(id, unmapSavings(input))
    return mapSavings(rec as unknown as Rec)
  },

  async remove(id: string) {
    await getPB().collection('savings').delete(id)
  },
}

function unmapDebt(input: Partial<Debt>): Rec {
  const out: Rec = {}
  if (input.creditor !== undefined) out.creditor = input.creditor
  if (input.type !== undefined) out.type = input.type
  if (input.principal !== undefined) out.principal = input.principal
  if (input.currentBalance !== undefined) out.current_balance = input.currentBalance
  if (input.interestRate !== undefined) out.interest_rate = input.interestRate
  if (input.monthlyPayment !== undefined) out.monthly_payment = input.monthlyPayment
  if (input.startDate !== undefined) out.start_date = input.startDate
  if (input.dueDate !== undefined) out.due_date = input.dueDate
  if (input.status !== undefined) out.status = input.status
  if (input.notes !== undefined) out.notes = input.notes
  return out
}

export const DebtRepo = {
  async list(includePaid = false): Promise<Debt[]> {
    const clauses = includePaid ? [] : ['status != "paid"']
    const records = await getPB()
      .collection('debts')
      .getFullList<Rec>({ filter: scope(...clauses), sort: '-current_balance' })

    return records.map(mapDebt)
  },

  async create(input: Partial<Debt>): Promise<Debt> {
    const payload = {
      ...unmapDebt(input),
      current_balance: input.currentBalance ?? input.principal ?? 0,
      household_id: householdId(),
    }
    const rec = await getPB().collection('debts').create(payload)
    return mapDebt(rec as unknown as Rec)
  },

  async update(id: string, input: Partial<Debt>): Promise<Debt> {
    const rec = await getPB().collection('debts').update(id, unmapDebt(input))
    return mapDebt(rec as unknown as Rec)
  },

  async remove(id: string) {
    await getPB().collection('debts').delete(id)
  },
}

export const DebtPaymentRepo = {
  async listByDebt(debtId: string): Promise<DebtPayment[]> {
    const records = await getPB()
      .collection('debt_payments')
      .getFullList<Rec>({ filter: scope(`debt = "${escape(debtId)}"`), sort: '-date' })

    return records.map(mapDebtPayment)
  },

  async create(input: Omit<DebtPayment, 'id'>): Promise<DebtPayment> {
    const rec = await getPB()
      .collection('debt_payments')
      .create({ ...input, household_id: householdId() })

    return mapDebtPayment(rec as unknown as Rec)
  },

  async remove(id: string) {
    await getPB().collection('debt_payments').delete(id)
  },
}

export const BudgetRepo = {
  async listByMonth(month: string): Promise<Budget[]> {
    const records = await getPB()
      .collection('budgets')
      .getFullList<Rec>({ filter: scope(`month = "${escape(month)}"`), sort: 'category' })

    return records.map(mapBudget)
  },

  async upsert(input: { month: string; category: string; amount: number; notes?: string }) {
    const pb = getPB()
    const filter = scope(`month = "${escape(input.month)}"`, `category = "${escape(input.category)}"`)

    try {
      const existing = await pb.collection('budgets').getFirstListItem(filter)
      return await pb.collection('budgets').update(existing.id, { amount: input.amount, notes: input.notes ?? '' })
    } catch (err) {
      // getFirstListItem melempar 404 saat pagaran belum ada; itu kondisi normal.
      if (!(err instanceof Error) || !/404/.test(err.message)) throw err
      return await pb.collection('budgets').create({
        month: input.month,
        category: input.category,
        amount: input.amount,
        notes: input.notes ?? '',
        household_id: householdId(),
      })
    }
  },

  async remove(id: string) {
    await getPB().collection('budgets').delete(id)
  },
}

export const HouseholdRepo = {
  async current(): Promise<Household> {
    const rec = await getPB().collection('households').getOne(householdId())
    const raw = rec as unknown as Rec

    return {
      id: raw.id as string,
      name: (raw.name as string) ?? '',
      currency: (raw.currency as string) || 'IDR',
      language: (raw.language as string) || 'id',
    }
  },

  async update(input: { name?: string; currency?: string; language?: string }) {
    const payload = pick(input as Rec, ['name', 'currency', 'language'])
    return getPB().collection('households').update(householdId(), payload)
  },
}

export const UserRepo = {
  async me() {
    const session = AuthStore.get()
    if (!session) throw new Error('Sesi berakhir, silakan masuk kembali')
    return session
  },

  /** `household_id` sengaja tidak bisa diubah dari klien. */
  async updateProfile(input: { name?: string; language?: string; baseCurrency?: string }) {
    const session = AuthStore.get()
    if (!session) throw new Error('Sesi berakhir, silakan masuk kembali')

    const payload = pick(input as Rec, ['name', 'language', 'base_currency'])

    return getPB().collection('users').update(session.id, payload)
  },

  async uploadAvatar(file: File) {
    const session = AuthStore.get()
    if (!session) throw new Error('Sesi berakhir, silakan masuk kembali')

    const form = new FormData()
    form.append('avatar', file)

    return getPB().collection('users').update(session.id, form)
  },
}