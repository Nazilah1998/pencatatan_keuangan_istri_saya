import { getTransactions } from "@/app/actions/transactions";
import { getSavings } from "@/app/actions/savings";
import { getAssets } from "@/app/actions/assets";
import { KPICard } from "@/components/dashboard/KPICard";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { format, parseISO, isSameMonth } from "date-fns";
import { id } from "date-fns/locale";

import {
  AlertCircle,
  CheckCircle2,
  Building2,
  CreditCard,
  Banknote,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const [txRes, savingsRes, assetsRes] = await Promise.all([
    getTransactions(),
    getSavings(),
    getAssets(),
  ]);

  const transactions = txRes.data || [];
  const savings = savingsRes.data || [];
  const assets = assetsRes.data || [];

  const now = new Date();
  const hour = now.getHours();
  let greeting = "Selamat Malam";
  if (hour < 12) greeting = "Selamat Pagi";
  else if (hour < 18) greeting = "Selamat Siang";

  let totalSaldo = 0;
  let totalPemasukan = 0;
  let totalPengeluaran = 0;
  let totalTabungan = 0;

  const weeklyDataMap = new Map<
    string,
    { pemasukan: number; pengeluaran: number }
  >();
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
        const label = `Minggu ${week}`;
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

  savings.forEach((s) => {
    if (s.status === "aktif") totalTabungan += s.jumlah_terkumpul;
  });

  const weeklyData = Array.from(weeklyDataMap.entries())
    .map(([week, data]) => ({ week, ...data }))
    .sort((a, b) => a.week.localeCompare(b.week));

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
      fill: colors[i % colors.length],
    }))
    .sort((a, b) => b.total - a.total);

  const spendingRatio =
    totalPemasukan > 0 ? (totalPengeluaran / totalPemasukan) * 100 : 0;

  let healthStatus = {
    label: "Sehat",
    color: "var(--color-income)",
    bg: "var(--color-income-bg)",
    icon: <CheckCircle2 size={14} />,
  };

  if (totalPemasukan === 0) {
    healthStatus = {
      label: "Belum ada data",
      color: "var(--color-text-muted)",
      bg: "var(--color-surface-offset)",
      icon: <AlertCircle size={14} />,
    };
  } else if (spendingRatio > 80) {
    healthStatus = {
      label: "Boros",
      color: "var(--color-danger)",
      bg: "var(--color-danger-bg)",
      icon: <AlertCircle size={14} />,
    };
  } else if (spendingRatio > 60) {
    healthStatus = {
      label: "Waspada",
      color: "#f59e0b",
      bg: "#fef3c7",
      icon: <AlertCircle size={14} />,
    };
  }

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "bank":
        return <Building2 size={16} />;
      case "ewallet":
        return <CreditCard size={16} />;
      default:
        return <Banknote size={16} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          padding: "0.5rem 0",
          borderBottom: "1px solid var(--color-border-subtle)",
          marginBottom: "0.5rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "var(--color-text)",
            letterSpacing: "-0.03em",
            margin: 0,
          }}
        >
          {greeting}, Tya! 👋
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.25rem 0.75rem",
              background: healthStatus.bg,
              borderRadius: "100px",
              width: "fit-content",
              color: healthStatus.color,
            }}
          >
            {healthStatus.icon}
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              {totalPemasukan === 0
                ? healthStatus.label
                : `${healthStatus.label}: ${spendingRatio.toFixed(0)}%`}
            </span>
          </div>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-text-muted)",
              fontWeight: 500,
            }}
          >
            Bulan ini
          </p>
        </div>
      </div>

      {/* Wallet / Assets Quick Grid */}
      {assets.length > 0 && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: 700,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Dompet & Aset
            </h3>
            <Link
              href="/aset-hutang"
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-primary)",
                textDecoration: "none",
              }}
            >
              Atur Aset
            </Link>
          </div>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              overflowX: "auto",
              paddingBottom: "0.25rem",
              scrollbarWidth: "none",
            }}
          >
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="card"
                style={{
                  minWidth: "160px",
                  padding: "0.875rem 1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <span style={{ color: "var(--color-primary)" }}>
                    {getAssetIcon(asset.jenis)}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {asset.nama}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {formatCurrency(asset.nilai)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.25rem",
        }}
      >
        <KPICard title="Total Saldo" amount={totalSaldo} icon="💰" />
        <KPICard
          title="Pemasukan"
          amount={totalPemasukan}
          type="income"
          icon="📈"
        />
        <KPICard
          title="Pengeluaran"
          amount={totalPengeluaran}
          type="expense"
          icon="📉"
        />
        <KPICard
          title="Tabungan"
          amount={totalTabungan}
          type="saving"
          icon="🏦"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <SpendingChart data={weeklyData} />
        <CategoryPieChart data={categoryData} />
      </div>
    </div>
  );
}
