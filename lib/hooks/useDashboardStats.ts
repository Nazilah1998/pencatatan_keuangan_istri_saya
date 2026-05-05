"use client";
import { useMemo } from "react";
import { isSameMonth, parseISO, format } from "date-fns";
import { id } from "date-fns/locale";
import { Transaction, SavingsGoal } from "@/types";
import { CATEGORY_COLORS } from "@/lib/constants";

export function useDashboardStats(
  transactions: Transaction[],
  savings: SavingsGoal[],
  now: Date,
  t: (key: string) => string
) {
  return useMemo(() => {
    let totalSaldo = 0;
    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let totalTabungan = 0;

    const weeklyDataMap = new Map<string, { pemasukan: number; pengeluaran: number }>();
    const categoryDataMap = new Map<string, number>();

    transactions.forEach((tx) => {
      const isThisMonth = isSameMonth(parseISO(tx.tanggal), now);

      if (tx.jenis === "pemasukan") {
        totalSaldo += tx.jumlah;
        if (isThisMonth) totalPemasukan += tx.jumlah;
      } else if (tx.jenis === "pengeluaran") {
        totalSaldo -= tx.jumlah;
        if (isThisMonth) totalPengeluaran += tx.jumlah;
      }

      if (isThisMonth) {
        if (tx.jenis === "pemasukan" || tx.jenis === "pengeluaran") {
          const week = format(parseISO(tx.tanggal), "wo", { locale: id });
          const label = `${t("dashboard.weekly_week") || "Minggu"} ${week}`;
          const current = weeklyDataMap.get(label) || { pemasukan: 0, pengeluaran: 0 };
          current[tx.jenis] += tx.jumlah;
          weeklyDataMap.set(label, current);
        }

        if (tx.jenis === "pengeluaran") {
          categoryDataMap.set(tx.kategori, (categoryDataMap.get(tx.kategori) || 0) + tx.jumlah);
        }
      }
    });

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

    const colors = ["#f97316", "#3b82f6", "#a855f7", "#ef4444", "#10b981", "#06b6d4", "#f59e0b", "#ec4899"];
    const categoryData = Array.from(categoryDataMap.entries())
      .map(([kategori, total], i) => ({
        kategori,
        total,
        fill: CATEGORY_COLORS[kategori] || colors[i % colors.length],
      }))
      .sort((a, b) => b.total - a.total);

    const spendingRatio = totalPemasukan > 0 ? (totalPengeluaran / totalPemasukan) * 100 : 0;

    return {
      totalSaldo,
      totalPemasukan,
      totalPengeluaran,
      totalTabungan,
      weeklyData,
      categoryData,
      spendingRatio,
    };
  }, [transactions, savings, now, t]);
}
