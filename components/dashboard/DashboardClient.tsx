"use client";
import React, { useMemo, useState, useEffect } from "react";
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
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function DashboardClient() {
  const {
    transactions,
    savings,
    assets,
    isPrivateMode,
    togglePrivateMode,
    user,
    settings,
  } = useAppStore();
  const router = useRouter();
  const { t } = useTranslation();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  const now = useMemo(() => new Date(), []);

  // Get display name
  const displayName = useMemo(() => {
    if (settings.nama_panggilan) return settings.nama_panggilan;
    if (user?.full_name) return user.full_name.split(" ")[0];
    return "";
  }, [settings.nama_panggilan, user]);

  const greeting = useMemo(() => {
    const baseGreeting = t("dashboard.greeting");
    return displayName
      ? `${baseGreeting}, ${displayName}! 👋`
      : `${baseGreeting}! 👋`;
  }, [displayName, t]);

  const stats = useMemo(() => {
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

    return {
      totalSaldo,
      totalPemasukan,
      totalPengeluaran,
      totalTabungan,
      weeklyData,
      categoryData,
      spendingRatio,
    };
  }, [transactions, savings, now]);

  const healthStatus = useMemo(() => {
    if (stats.totalPemasukan === 0) {
      return {
        label: "Belum ada data",
        color: "var(--color-text-muted)",
        bg: "var(--color-surface-offset)",
        icon: <AlertCircle size={14} />,
      };
    }
    if (stats.spendingRatio > 80) {
      return {
        label: "Boros",
        color: "var(--color-danger)",
        bg: "var(--color-danger-bg)",
        icon: <AlertCircle size={14} />,
      };
    }
    if (stats.spendingRatio > 60) {
      return {
        label: "Waspada",
        color: "#f59e0b",
        bg: "#fef3c7",
        icon: <AlertCircle size={14} />,
      };
    }
    return {
      label: "Sehat",
      color: "var(--color-income)",
      bg: "var(--color-income-bg)",
      icon: <CheckCircle2 size={14} />,
    };
  }, [stats.totalPemasukan, stats.spendingRatio]);

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

  if (!mounted) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div
          className="skeleton"
          style={{ height: "150px", borderRadius: "var(--radius-xl)" }}
        ></div>
        <div
          className="skeleton"
          style={{ height: "300px", borderRadius: "var(--radius-xl)" }}
        ></div>
      </div>
    );
  }

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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <h1
            style={{
              fontSize: "min(1.75rem, 6vw)",
              fontWeight: 800,
              color: "var(--color-text)",
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            {greeting}
          </h1>
          <button
            onClick={togglePrivateMode}
            style={{
              background: "var(--color-surface-offset)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "0.625rem",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            title={isPrivateMode ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
          >
            {isPrivateMode ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
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
            <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>
              {stats.totalPemasukan === 0
                ? healthStatus.label
                : `${healthStatus.label}: ${stats.spendingRatio.toFixed(0)}%`}
            </span>
          </div>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-text-muted)",
              fontWeight: 500,
            }}
          >
            {t("dashboard.this_month") || "Bulan ini"}
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
              {t("dashboard.wallet_assets") || "Dompet & Aset"}
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
              {t("dashboard.manage_assets") || "Atur Aset"}
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
                  {isPrivateMode ? "Rp ••••••" : formatCurrency(asset.nilai)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", // Lowered from 320px
          gap: "1rem",
        }}
      >
        <SpendingChart data={stats.weeklyData} />
        <CategoryPieChart data={stats.categoryData} />
      </div>
    </div>
  );
}
