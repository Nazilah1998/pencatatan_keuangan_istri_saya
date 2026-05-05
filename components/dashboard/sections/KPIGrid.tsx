"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { KPICard } from "@/components/dashboard/KPICard";

interface KPIGridProps {
  stats: {
    totalSaldo: number;
    totalPemasukan: number;
    totalPengeluaran: number;
    totalTabungan: number;
  };
  t: (key: string) => string;
}

export function KPIGrid({ stats, t }: KPIGridProps) {
  const router = useRouter();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "1rem",
      }}
    >
      <KPICard
        title={t("dashboard.total_balance")}
        amount={stats.totalSaldo}
        icon="💰"
        onClick={() => router.push("/transaksi")}
      />
      <KPICard
        title={t("dashboard.income")}
        amount={stats.totalPemasukan}
        type="income"
        icon="📈"
        onClick={() => router.push("/transaksi?type=pemasukan")}
      />
      <KPICard
        title={t("dashboard.expense")}
        amount={stats.totalPengeluaran}
        type="expense"
        icon="📉"
        onClick={() => router.push("/transaksi?type=pengeluaran")}
      />
      <KPICard
        title={t("dashboard.savings")}
        amount={stats.totalTabungan}
        type="saving"
        icon="🏦"
        onClick={() => router.push("/tabungan")}
      />
    </div>
  );
}
