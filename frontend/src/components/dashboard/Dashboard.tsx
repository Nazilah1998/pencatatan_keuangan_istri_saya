/**
 * Dasbor: kartu ringkasan, arus kas bulanan, anggaran terdekat, dan transaksi
 * terakhir. Semua angka berasal dari endpoint agregasi Go Fiber, bukan dari
 * penjumlahan di komponen.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Landmark,
  PiggyBank,
  Wallet,
} from "lucide-react";

import { api, ApiError, ApiPaths } from "../../lib/api/client";
import type { BudgetReport, Cashflow, Summary } from "../../lib/api/types";
import {
  BudgetRepo,
  CategoryRepo,
  DebtRepo,
  SavingsRepo,
  TxRepo,
  WalletRepo,
  type Transaction,
  type Wallet as WalletItem,
} from "../../lib/api/repositories";
import { formatCompact, formatMoney } from "../../lib/utils/currency";
import {
  currentMonth,
  formatMonth,
  monthRange,
  todayISO,
} from "../../lib/utils/date";
import { useApp } from "../providers/useApp";
import { Button } from "../ui/Button";
import { Card, EmptyState, Skeleton, StatTile } from "../ui/Card";

export function Dashboard() {
  const { t, m, session, isAuthed, ready } = useApp();
  const currency = session?.baseCurrency === "USD" ? "USD" : "IDR";
  const [mounted, setMounted] = useState(false);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [flow, setFlow] = useState<Cashflow | null>(null);
  const [budget, setBudget] = useState<BudgetReport | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Record<string, string>>({});
  const [walletList, setWalletList] = useState<WalletItem[]>([]);
  const [walletsOpen, setWalletsOpen] = useState(false);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const month = currentMonth();

  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    setGreeting(
      hour < 11
        ? t("dashboard.greeting_morning")
        : hour < 15
          ? t("dashboard.greeting_afternoon")
          : hour < 18
            ? t("dashboard.greeting_evening")
            : t("dashboard.greeting_night"),
    );
  }, [t]);

  const load = useCallback(async () => {
    if (!ready || !isAuthed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { start, end } = monthRange(month);

      const [sRes, cRes, tx, w, bList, savings, debts, categories] =
        await Promise.all([
          api.get<Summary>(ApiPaths.summary(month)).catch(() => null),
          api.get<Cashflow>(ApiPaths.cashflow(start, end)).catch(() => null),
          TxRepo.listByMonth(month).catch(() => []),
          WalletRepo.list(true).catch(() => []),
          BudgetRepo.listByMonth(month).catch(() => []),
          SavingsRepo.list(true).catch(() => []),
          DebtRepo.list(false).catch(() => []),
          CategoryRepo.list().catch(() => []),
        ]);

      const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
      setCategoryMap(catMap);

      const localIncome = tx
        .filter((item) => item.type === "income")
        .reduce((acc, item) => acc + item.amount, 0);
      const localExpense = tx
        .filter((item) => item.type === "expense")
        .reduce((acc, item) => acc + item.amount, 0);
      const localTransfer = tx
        .filter((item) => item.type === "transfer")
        .reduce((acc, item) => acc + item.amount, 0);

      let calculatedWalletTotal = 0;
      for (const wallet of w) {
        if (!wallet.includeInNetWorth || wallet.isArchived) continue;
        calculatedWalletTotal += wallet.balance ?? wallet.initialBalance ?? 0;
      }

      const localSavingsTotal = savings.reduce((acc, s) => {
        let amt = s.currentAmount || 0;
        if (amt === 0) {
          const fromTx = tx
            .filter((t) => t.savingsGoal === s.id)
            .reduce((sum, t) => sum + t.amount, 0);
          amt = fromTx;
        }
        return acc + amt;
      }, 0);

      const localSavingsInNetWorth = savings
        .filter((s) => s.includeInNetWorth)
        .reduce((acc, s) => {
          let amt = s.currentAmount || 0;
          if (amt === 0) {
            const fromTx = tx
              .filter((t) => t.savingsGoal === s.id)
              .reduce((sum, t) => sum + t.amount, 0);
            amt = fromTx;
          }
          return acc + amt;
        }, 0);

      const localDebtTotal = debts
        .filter((d) => d.status !== "paid")
        .reduce((acc, d) => acc + (d.currentBalance ?? d.principal ?? 0), 0);

      const calculatedNetWorth =
        calculatedWalletTotal + localSavingsInNetWorth - localDebtTotal;

      const sAny = sRes as Record<string, unknown> | null;
      const resNetWorth =
        sAny?.netWorth ??
        (sAny?.net_worth as Record<string, unknown> | undefined)?.net ??
        null;
      const resTotalBalance =
        sAny?.totalBalance ??
        (sAny?.net_worth as Record<string, unknown> | undefined)?.assets ??
        null;
      const resIncome = sAny?.income ?? null;
      const resExpense = sAny?.expense ?? null;
      const resSavingsTotal =
        sAny?.savingsTotal ??
        sAny?.savings_total ??
        (sAny?.net_worth as Record<string, unknown> | undefined)
          ?.savings_total ??
        null;
      const resDebtTotal =
        sAny?.debtTotal ??
        sAny?.debt_total ??
        (sAny?.net_worth as Record<string, unknown> | undefined)?.liabilities ??
        null;

      const finalNetWorth =
        resNetWorth !== null && resNetWorth !== 0
          ? Number(resNetWorth)
          : calculatedNetWorth;
      const finalTotalBalance =
        resTotalBalance !== null && resTotalBalance !== 0
          ? Number(resTotalBalance)
          : calculatedWalletTotal;
      const finalIncome =
        resIncome !== null && resIncome !== 0 ? Number(resIncome) : localIncome;
      const finalExpense =
        resExpense !== null && resExpense !== 0
          ? Number(resExpense)
          : localExpense;
      const finalSavingsTotal =
        resSavingsTotal !== null && resSavingsTotal !== 0
          ? Number(resSavingsTotal)
          : localSavingsTotal;
      const finalDebtTotal =
        resDebtTotal !== null && resDebtTotal !== 0
          ? Number(resDebtTotal)
          : localDebtTotal;

      const s: Summary = {
        netWorth: finalNetWorth,
        totalBalance: finalTotalBalance,
        income: finalIncome,
        expense: finalExpense,
        transfer: (sAny?.transfer as number | undefined) ?? localTransfer,
        net: finalIncome - finalExpense,
        savingsTotal: finalSavingsTotal,
        debtTotal: finalDebtTotal,
        month,
        baseCurrency: currency,
      };

      let dailyList = cRes?.daily ?? [];
      if (dailyList.length === 0 && tx.length > 0) {
        const dayMap = new Map<
          string,
          { date: string; income: number; expense: number }
        >();
        for (const item of tx) {
          const d = item.date ? item.date.slice(0, 10) : todayISO();
          const existing = dayMap.get(d) ?? { date: d, income: 0, expense: 0 };
          if (item.type === "income") existing.income += item.amount;
          else if (item.type === "expense") existing.expense += item.amount;
          dayMap.set(d, existing);
        }
        dailyList = Array.from(dayMap.values()).sort((a, b) =>
          a.date.localeCompare(b.date),
        );
      }

      const c: Cashflow = {
        month,
        income: cRes?.income || finalIncome,
        expense: cRes?.expense || finalExpense,
        transfer:
          cRes?.transfer ||
          (sAny?.transfer as number | undefined) ||
          localTransfer,
        net: (cRes?.income || finalIncome) - (cRes?.expense || finalExpense),
        daily: dailyList,
      };

      const budgetByCat = new Map(bList.map((item) => [item.category, item]));
      const expCats = new Map<string, number>();
      for (const tItem of tx) {
        if (tItem.type === "expense" && tItem.category) {
          expCats.set(
            tItem.category,
            (expCats.get(tItem.category) ?? 0) + tItem.amount,
          );
        }
      }

      const allCatKeys = new Set<string>([
        ...Array.from(budgetByCat.keys()),
        ...Array.from(expCats.keys()),
      ]);

      const budgetItems: BudgetReport["items"] = Array.from(allCatKeys)
        .map((catId) => {
          const b = budgetByCat.get(catId);
          const spent = expCats.get(catId) ?? 0;
          const limit = b ? b.amount : 0;
          const pct = limit > 0 ? (spent / limit) * 100 : 0;
          const status =
            limit === 0
              ? ("safe" as const)
              : pct > 100
                ? ("over" as const)
                : pct >= 80
                  ? ("warning" as const)
                  : ("safe" as const);

          return {
            id: b ? b.id : `cat-${catId}`,
            category: catMap[catId] || catId,
            limit,
            spent,
            percentage: pct,
            status,
          };
        })
        .sort((a, b) => b.spent - a.spent);

      const bTotalLimit = bList.reduce((acc, item) => acc + item.amount, 0);
      const bTotalSpent = tx
        .filter((item) => item.type === "expense")
        .reduce((acc, item) => acc + item.amount, 0);

      const finalLimit =
        (sAny?.budget_limit as number | undefined) ?? bTotalLimit;
      const finalSpent =
        (sAny?.budget_used as number | undefined) ?? bTotalSpent;

      const b: BudgetReport = {
        month,
        totalLimit: finalLimit,
        totalSpent: finalSpent,
        remaining: Math.max(0, finalLimit - finalSpent),
        items: budgetItems,
      };

      setSummary(s);
      setFlow(c);
      setBudget(b);
      setRecent(tx.slice(0, 5));
      setWallets(Object.fromEntries(w.map((item) => [item.id, item.name])));
      setWalletList(w.filter((item) => !item.isArchived));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : m("common.retry"));
    } finally {
      setLoading(false);
    }
  }, [currency, isAuthed, m, month, ready, t]);

  const totalWalletAssets = useMemo(() => {
    return walletList.reduce((acc, item) => acc + (item.balance || 0), 0);
  }, [walletList]);

  useEffect(() => {
    if (!ready || !isAuthed) return;
    void load();
    const onTxCreated = () => {
      void load();
    };
    window.addEventListener("tx:created", onTxCreated);
    window.addEventListener("wallet:updated", onTxCreated);
    window.addEventListener("wallet:created", onTxCreated);
    return () => {
      window.removeEventListener("tx:created", onTxCreated);
      window.removeEventListener("wallet:updated", onTxCreated);
      window.removeEventListener("wallet:created", onTxCreated);
    };
  }, [isAuthed, load, ready]);

  return (
    <div className="space-y-4">
      <p className="min-h-[1.25rem] text-sm text-[var(--text-muted)]">
        {mounted ? greeting + (session?.name ? `, ${session.name}` : "") : ""}
      </p>

      {error && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--negative)]">{error}</p>
            <Button size="sm" variant="secondary" onClick={() => void load()}>
              {m("common.retry")}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {!summary ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <StatTile
              label={t("dashboard.total_balance")}
              value={formatMoney(summary.netWorth, currency)}
              icon={<Landmark className="size-4" aria-hidden />}
            />
            <StatTile
              label={t("common.income")}
              value={formatCompact(summary.income, currency)}
              tone="positive"
              icon={<ArrowUpRight className="size-4" aria-hidden />}
            />
            <StatTile
              label={t("common.expense")}
              value={formatCompact(summary.expense, currency)}
              tone="negative"
              icon={<ArrowDownRight className="size-4" aria-hidden />}
            />
            <StatTile
              label={t("dashboard.savings")}
              value={formatCompact(summary.savingsTotal, currency)}
              icon={<PiggyBank className="size-4" aria-hidden />}
            />
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--line-subtle)] bg-[var(--surface-raised)] shadow-xs">
        <button
          type="button"
          onClick={() => setWalletsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-[var(--surface-sunken)]/40 active:bg-[var(--surface-sunken)]/60 cursor-pointer"
          aria-expanded={walletsOpen}
        >
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold text-[var(--text-primary)]">
              Aset Dompet
            </span>
            <span className="rounded-full bg-[var(--surface-sunken)] px-2 py-0.5 text-[0.6875rem] font-semibold text-[var(--text-muted)]">
              {walletList.length} Akun
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="font-mono text-sm font-bold text-[var(--accent)] sm:text-base">
              {formatMoney(totalWalletAssets, currency)}
            </span>
            <ChevronDown
              className={[
                "size-4 text-[var(--text-muted)] transition-transform duration-200",
                walletsOpen ? "rotate-180" : "rotate-0",
              ].join(" ")}
            />
          </div>
        </button>

        {walletsOpen && (
          <div className="border-t border-[var(--line-subtle)]">
            {loading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : walletList.length === 0 ? (
              <div className="py-4 text-center text-xs text-[var(--text-muted)]">
                Belum ada dompet aktif.
              </div>
            ) : (
              <ul className="divide-y divide-[var(--line-subtle)] px-4">
                {walletList.map((item) => {
                  const percent =
                    totalWalletAssets > 0
                      ? Math.round(
                          (Math.max(0, item.balance) / totalWalletAssets) * 100,
                        )
                      : 0;
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between py-2.5 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="truncate text-xs font-semibold text-[var(--text-primary)] sm:text-sm">
                          {item.name}
                        </p>
                        <p className="text-[0.6875rem] text-[var(--text-muted)]">
                          {getWalletTypeLabel(item.type)}{" "}
                          {percent > 0 ? `· ${percent}% aset` : ""}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={[
                            "font-mono text-xs font-bold sm:text-sm",
                            item.balance < 0
                              ? "text-[var(--negative)]"
                              : "text-[var(--text-primary)]",
                          ].join(" ")}
                        >
                          {formatMoney(item.balance, currency)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="flex items-center justify-between border-t border-[var(--line-subtle)] bg-[var(--surface-sunken)]/30 px-4 py-2.5 text-[0.6875rem] text-[var(--text-muted)]">
              <span>Semua dompet tersinkronisasi</span>
              <a
                href="/aset-hutang"
                className="font-medium text-[var(--accent)] hover:underline inline-flex items-center gap-1"
              >
                Kelola Aset &rarr;
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card
          className="lg:col-span-3"
          title={t("dashboard.weekly_flow")}
          subtitle={formatMonth(month)}
        >
          {!flow ? (
            <Skeleton className="h-40" />
          ) : flow.daily.length === 0 ? (
            <EmptyState title={t("common.no_data")} />
          ) : (
            <CashflowChart
              daily={flow.daily}
              currency={currency}
              t={t}
              month={month}
            />
          )}
        </Card>

        <Card
          className="lg:col-span-2"
          title={t("sidebar.budget")}
          action={
            <a
              href="/anggaran"
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              {t("dashboard.see_all")}
            </a>
          }
        >
          {!budget ? (
            <Skeleton className="h-40" />
          ) : budget.items.length === 0 ? (
            <EmptyState
              title={t("common.no_data")}
              hint={t("budget.subtitle")}
            />
          ) : (
            <ul className="space-y-3">
              {budget.items.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {item.category || t("common.total")}
                    </span>
                    <span className="tnum shrink-0 text-xs text-[var(--text-muted)]">
                      {item.limit > 0 ? (
                        <>
                          <span className="font-semibold text-[var(--text-secondary)]">
                            {formatCompact(item.spent, currency)}
                          </span>
                          <span className="text-[var(--text-muted)]">
                            {" "}
                            / {formatCompact(item.limit, currency)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-[var(--text-secondary)]">
                            {formatCompact(item.spent, currency)}
                          </span>
                          <span className="ml-1 text-[0.6875rem] font-normal text-[var(--text-muted)]">
                            (Pagu Rp 0)
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-sunken)]"
                    role="progressbar"
                    aria-valuenow={
                      item.limit > 0 ? Math.min(item.percentage, 100) : 0
                    }
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full transition-[width]"
                      style={{
                        width:
                          item.limit > 0
                            ? `${Math.min(item.percentage, 100)}%`
                            : "100%",
                        opacity: item.limit > 0 ? 1 : 0.2,
                        backgroundColor:
                          item.limit === 0
                            ? "var(--text-muted)"
                            : item.status === "over"
                              ? "var(--negative)"
                              : item.status === "warning"
                                ? "var(--warning)"
                                : "var(--accent)",
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card
        title={t("dashboard.recent_transactions")}
        action={
          <a
            href="/transaksi"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            {t("dashboard.see_all")}
          </a>
        }
      >
        {loading ? (
          <Skeleton className="h-32" />
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--surface-sunken)] text-[var(--text-muted)]">
              <Wallet className="size-5" />
            </span>
            <p className="mt-2 font-display text-sm font-semibold text-[var(--text-primary)]">
              {t("transactions.empty_state")}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {t("transactions.empty_subtitle")}
            </p>
            <a
              href="/transaksi"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3.5 py-1.5 font-display text-xs font-bold text-[var(--text-inverted)] shadow-xs transition-transform hover:opacity-90 active:scale-95"
            >
              + Catat Transaksi
            </a>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--line-subtle)]">
            {recent.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-[0.625rem] bg-[var(--surface-sunken)] text-[var(--text-muted)]">
                  <Wallet className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {tx.note ||
                      categoryMap[tx.category] ||
                      tx.category ||
                      t("transactions.form.type")}
                  </span>
                  <span className="block truncate text-xs text-[var(--text-muted)]">
                    {tx.date.slice(0, 10)} ·{" "}
                    {wallets[tx.wallet] ?? t("common.total")}
                  </span>
                </span>
                <span
                  className={[
                    "tnum shrink-0 text-sm font-semibold",
                    tx.type === "income"
                      ? "text-[var(--accent)]"
                      : tx.type === "expense"
                        ? "text-[var(--negative)]"
                        : "",
                  ].join(" ")}
                >
                  {tx.type === "income"
                    ? "+"
                    : tx.type === "expense"
                      ? "−"
                      : ""}
                  {formatMoney(tx.amount, currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function CashflowChart({
  daily,
  currency,
  t,
  month,
}: {
  daily: { date: string; income: number; expense: number }[];
  currency: "IDR" | "USD";
  t: (path: string) => string;
  month: string;
}) {
  const weeks = [
    { label: "Mgg 1", range: "1-7", income: 0, expense: 0 },
    { label: "Mgg 2", range: "8-14", income: 0, expense: 0 },
    { label: "Mgg 3", range: "15-21", income: 0, expense: 0 },
    { label: "Mgg 4", range: "22-28", income: 0, expense: 0 },
    { label: "Mgg 5", range: "29-31", income: 0, expense: 0 },
  ];

  for (const d of daily) {
    const dayNum = parseInt(d.date.slice(8, 10), 10) || 1;
    const idx =
      dayNum <= 7
        ? 0
        : dayNum <= 14
          ? 1
          : dayNum <= 21
            ? 2
            : dayNum <= 28
              ? 3
              : 4;
    const targetWeek = weeks[idx];
    if (targetWeek) {
      targetWeek.income += d.income;
      targetWeek.expense += d.expense;
    }
  }

  const currentDay = todayISO().startsWith(month)
    ? parseInt(todayISO().slice(8, 10), 10)
    : 1;
  const currentWeekIdx =
    currentDay <= 7
      ? 0
      : currentDay <= 14
        ? 1
        : currentDay <= 21
          ? 2
          : currentDay <= 28
            ? 3
            : 4;

  const [selectedIdx, setSelectedIdx] = useState<number>(currentWeekIdx);

  const totalInc = weeks.reduce((sum, w) => sum + w.income, 0);
  const totalExp = weeks.reduce((sum, w) => sum + w.expense, 0);
  const totalNet = totalInc - totalExp;

  const maxVal = Math.max(1, ...weeks.flatMap((w) => [w.income, w.expense]));
  const chartHeightPx = 110;

  const fallbackWeek = { label: "Mgg 1", range: "1-7", income: 0, expense: 0 };
  const selWeek = weeks[selectedIdx] ?? weeks[0] ?? fallbackWeek;
  const selNet = selWeek.income - selWeek.expense;

  return (
    <div className="space-y-3 pt-1">
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-[var(--surface-sunken)]/60 p-2 text-center text-xs">
        <div>
          <span className="block text-[0.625rem] font-semibold text-[var(--text-muted)]">
            Pemasukan
          </span>
          <span className="font-mono text-xs font-bold text-[var(--accent)]">
            +{formatCompact(totalInc, currency)}
          </span>
        </div>
        <div className="border-x border-[var(--line-subtle)]">
          <span className="block text-[0.625rem] font-semibold text-[var(--text-muted)]">
            Pengeluaran
          </span>
          <span className="font-mono text-xs font-bold text-[var(--negative)]">
            −{formatCompact(totalExp, currency)}
          </span>
        </div>
        <div>
          <span className="block text-[0.625rem] font-semibold text-[var(--text-muted)]">
            Arus Bersih
          </span>
          <span
            className={[
              "font-mono text-xs font-bold",
              totalNet >= 0 ? "text-[var(--accent)]" : "text-[var(--negative)]",
            ].join(" ")}
          >
            {totalNet >= 0 ? "+" : "−"}
            {formatCompact(Math.abs(totalNet), currency)}
          </span>
        </div>
      </div>

      <div className="relative pt-2">
        <div className="absolute inset-x-0 top-3 border-b border-dashed border-[var(--line-subtle)]/70 pointer-events-none" />
        <div className="absolute inset-x-0 top-[65px] border-b border-dashed border-[var(--line-subtle)]/70 pointer-events-none" />

        <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 relative z-10">
          {weeks.map((w, i) => {
            const incPct =
              w.income > 0
                ? Math.max(10, Math.round((w.income / maxVal) * 100))
                : 0;
            const expPct =
              w.expense > 0
                ? Math.max(10, Math.round((w.expense / maxVal) * 100))
                : 0;
            const isSelected = selectedIdx === i;
            const isTodayWeek = currentWeekIdx === i;

            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIdx(i)}
                className={[
                  "flex flex-col items-center rounded-xl py-2 px-1 transition-all cursor-pointer text-left",
                  isSelected
                    ? "bg-[var(--surface-sunken)] ring-1 ring-[var(--line-strong)] shadow-2xs"
                    : "hover:bg-[var(--surface-sunken)]/50",
                ].join(" ")}
              >
                <div
                  className="flex w-full items-end justify-center gap-1 sm:gap-1.5"
                  style={{ height: `${chartHeightPx}px` }}
                >
                  <div className="w-2.5 sm:w-3.5 h-full rounded-full bg-[var(--surface-sunken)] flex items-end justify-center overflow-hidden">
                    <div
                      className="w-full rounded-full bg-[var(--accent)] transition-all duration-300"
                      style={{ height: `${incPct}%` }}
                    />
                  </div>
                  <div className="w-2.5 sm:w-3.5 h-full rounded-full bg-[var(--surface-sunken)] flex items-end justify-center overflow-hidden">
                    <div
                      className="w-full rounded-full bg-[var(--negative)] transition-all duration-300"
                      style={{ height: `${expPct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-2 text-center w-full">
                  <span
                    className={[
                      "block font-display text-[0.6875rem]",
                      isSelected
                        ? "font-bold text-[var(--text-primary)]"
                        : "font-medium text-[var(--text-secondary)]",
                    ].join(" ")}
                  >
                    {w.label}
                  </span>
                  <span className="block text-[0.625rem] text-[var(--text-muted)]">
                    {w.range}
                  </span>
                  {isTodayWeek && (
                    <span className="mx-auto mt-0.5 block size-1 rounded-full bg-[var(--accent)]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--line-subtle)] bg-[var(--surface-sunken)]/30 p-2.5 sm:p-3 transition-all">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[var(--text-primary)]">
              {selWeek.label} ({selWeek.range})
            </span>
            {currentWeekIdx === selectedIdx && (
              <span className="rounded-full bg-[var(--accent-soft)] px-1.5 py-0.2 text-[0.5625rem] font-bold text-[var(--accent)]">
                Minggu Ini
              </span>
            )}
          </div>
          <span
            className={[
              "font-mono text-xs font-bold",
              selNet >= 0 ? "text-[var(--accent)]" : "text-[var(--negative)]",
            ].join(" ")}
          >
            Net: {selNet >= 0 ? "+" : "−"}
            {formatMoney(Math.abs(selNet), currency)}
          </span>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-[var(--surface-raised)] p-2 border border-[var(--line-subtle)]">
            <span className="block text-[0.625rem] font-semibold text-[var(--text-muted)]">
              Pemasukan
            </span>
            <span className="font-mono text-xs font-bold text-[var(--accent)]">
              +{formatMoney(selWeek.income, currency)}
            </span>
          </div>
          <div className="rounded-lg bg-[var(--surface-raised)] p-2 border border-[var(--line-subtle)]">
            <span className="block text-[0.625rem] font-semibold text-[var(--text-muted)]">
              Pengeluaran
            </span>
            <span className="font-mono text-xs font-bold text-[var(--negative)]">
              −{formatMoney(selWeek.expense, currency)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[0.6875rem] text-[var(--text-muted)] pt-0.5">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="size-2 rounded-full bg-[var(--accent)]" />
            {t("common.income")}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="size-2 rounded-full bg-[var(--negative)]" />
            {t("common.expense")}
          </span>
        </div>
        <span className="text-[0.625rem] text-[var(--text-muted)]">
          Pilih minggu untuk rincian
        </span>
      </div>
    </div>
  );
}

function getWalletTypeLabel(type: string) {
  switch (type) {
    case "bank":
      return "Bank";
    case "cash":
      return "Tunai";
    case "ewallet":
      return "E-Wallet";
    case "credit_card":
      return "Kartu Kredit";
    case "investment":
      return "Investasi";
    case "savings":
      return "Tabungan";
    default:
      return "Dompet";
  }
}
