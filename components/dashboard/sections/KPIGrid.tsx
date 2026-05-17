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
    totalAset: number;
    totalHutang: number;
    netWorth: number;
    walletBalances?: { name: string; balance: number; icon?: string }[];
  };
  t: (key: string) => string;
}

export function KPIGrid({ stats, t }: KPIGridProps) {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Net Worth - Full Width Expandable Featured Card */}
      <KPICard
        title={t("assets.net_worth") || "Kekayaan Bersih"}
        amount={stats.netWorth}
        icon="💎"
        wallets={[
          { name: t("dashboard.total_balance") || "Total Saldo Dompet", balance: stats.totalSaldo, icon: "💰" },
          { name: t("assets.total_assets") || "Total Aset", balance: stats.totalAset, icon: "🏠" },
          { name: t("assets.total_debts") || "Total Hutang", balance: -stats.totalHutang, icon: "💳" }
        ]}
        isFeatured={true}
      />

      {/* Income & Expense Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
        }}
      >
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
      </div>
    </div>
  );
}
