"use client";
import { useMemo } from "react";
import { isSameMonth, parseISO, format } from "date-fns";
import { id } from "date-fns/locale";
import { Transaction, SavingsGoal, Asset, Debt } from "@/types";
import { CATEGORY_COLORS } from "@/lib/constants";

export function useDashboardStats(
  transactions: Transaction[],
  savings: SavingsGoal[],
  now: Date,
  t: (key: string) => string,
  wallets: { id: string; name: string; icon?: string }[] = [],
  assets: Asset[] = [],
  debts: Debt[] = [],
) {
  return useMemo(() => {
    let totalSaldo = 0;
    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let totalTabungan = 0;

    const weeklyDataMap = new Map<
      string,
      { pemasukan: number; pengeluaran: number }
    >();
    const categoryDataMap = new Map<string, number>();
    const walletBalancesMap = new Map<string, number>();

    // Initialize with existing wallets
    wallets.forEach((w) => walletBalancesMap.set(w.name, 0));

    transactions.forEach((tx) => {
      const isThisMonth = isSameMonth(parseISO(tx.tanggal), now);
      const amount = tx.jumlah;

      if (tx.jenis === "pemasukan") {
        totalSaldo += amount;
        walletBalancesMap.set(
          tx.dompet,
          (walletBalancesMap.get(tx.dompet) || 0) + amount,
        );
        if (isThisMonth) totalPemasukan += amount;
      } else if (tx.jenis === "pengeluaran") {
        totalSaldo -= amount;
        walletBalancesMap.set(
          tx.dompet,
          (walletBalancesMap.get(tx.dompet) || 0) - amount,
        );
        if (isThisMonth) totalPengeluaran += amount;
      }

      if (isThisMonth) {
        if (tx.jenis === "pemasukan" || tx.jenis === "pengeluaran") {
          const week = format(parseISO(tx.tanggal), "wo", { locale: id });
          const label = `${t("dashboard.weekly_week") || "Minggu"} ${week}`;
          const current = weeklyDataMap.get(label) || {
            pemasukan: 0,
            pengeluaran: 0,
          };
          current[tx.jenis] += tx.jumlah;
          weeklyDataMap.set(label, current);
        }

        if (tx.jenis === "pengeluaran") {
          categoryDataMap.set(
            tx.kategori,
            (categoryDataMap.get(tx.kategori) || 0) + tx.jumlah,
          );
        }
      }
    });

    const walletBalances = wallets.map((w) => ({
      name: w.name,
      balance: walletBalancesMap.get(w.name) || 0,
      icon: w.icon || "💰",
    }));

    savings.forEach((s) => {
      if (s.status === "aktif") totalTabungan += s.jumlah_terkumpul;
    });

    const weeklyData = Array.from(weeklyDataMap.entries())
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => {
        const numA = parseInt(a.week.replace(/[^0-9]/g, ""), 10);
        const numB = parseInt(b.week.replace(/[^0-9]/g, ""), 10);
        return numA - numB;
      });

    const colors = [
      "#f97316",
      "#3b82f6",
      "#a855f7",
      "#ef4444",
      "#10b981",
      "#06b6d4",
      "#f59e0b",
      "#ec4899",
    ];
    const categoryData = Array.from(categoryDataMap.entries())
      .map(([kategori, total], i) => ({
        kategori,
        total,
        fill: CATEGORY_COLORS[kategori] || colors[i % colors.length],
      }))
      .sort((a, b) => b.total - a.total);

    const spendingRatio =
      totalPemasukan > 0 ? (totalPengeluaran / totalPemasukan) * 100 : 0;

    const totalAset = assets.reduce((sum, a) => sum + (a.nilai || 0), 0);
    const totalHutang = debts.reduce((sum, d) => sum + (d.sisa_hutang || 0), 0);
    const netWorth = totalSaldo + totalAset - totalHutang;

    return {
      totalSaldo,
      totalPemasukan,
      totalPengeluaran,
      totalTabungan,
      walletBalances,
      weeklyData,
      categoryData,
      spendingRatio,
      totalAset,
      totalHutang,
      netWorth,
    };
  }, [transactions, savings, now, t, wallets, assets, debts]);
}
