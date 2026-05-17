"use client";
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/constants/categories";
import { formatCurrency } from "@/lib/utils/currency";
import { Transaction } from "@/types";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface ChartProps {
  transactions: Transaction[];
}

// -----------------------------------------------------------------------------
// HELPER: Dynamic week of month parsing (safe from hydration errors)
// -----------------------------------------------------------------------------
function getWeekOfMonthString(dateStr: string, t: (key: string) => string): string {
  const parts = dateStr.split("-");
  if (parts.length < 3) return `${t("dashboard.weekly_week") || "Minggu"} 1`;
  const day = parseInt(parts[2], 10);
  const weekWord = t("dashboard.weekly_week") || "Minggu";
  if (day <= 7) return `${weekWord} 1`;
  if (day <= 14) return `${weekWord} 2`;
  if (day <= 21) return `${weekWord} 3`;
  return `${weekWord} 4`;
}

// -----------------------------------------------------------------------------
// 1. LAPORAN PIE CHART (Donut Chart for Expenses)
// -----------------------------------------------------------------------------
export function LaporanPieChart({ transactions }: ChartProps) {
  const { t } = useTranslation();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const expenseTx = useMemo(
    () => transactions.filter((tx) => tx.jenis === "pengeluaran"),
    [transactions],
  );

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    expenseTx.forEach((tx) => {
      map.set(tx.kategori, (map.get(tx.kategori) || 0) + tx.jumlah);
    });

    const colors = [
      "#f97316",
      "#3b82f6",
      "#a855f7",
      "#84cc16",
      "#ef4444",
      "#10b981",
      "#06b6d4",
      "#f59e0b",
      "#dc2626",
      "#14b8a6",
    ];

    return Array.from(map.entries())
      .map(([kategori, total], i) => ({
        name: kategori,
        value: total,
        color: CATEGORY_COLORS[kategori] || colors[i % colors.length],
        icon: CATEGORY_ICONS[kategori] || "📦",
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenseTx]);

  const totalExpense = useMemo(
    () => chartData.reduce((sum, item) => sum + item.value, 0),
    [chartData],
  );

  if (chartData.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: "2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 280,
          background: "var(--color-surface)",
        }}
      >
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          {t("dashboard.pie_empty") || "Tidak ada data pengeluaran untuk bulan ini"}
        </p>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        padding: "1.5rem",
        background: "var(--color-surface)",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--color-text)" }}>
        {t("reports.expense_by_category") || "Distribusi Pengeluaran"}
      </h3>

      <div style={{ position: "relative", minHeight: 200, display: "flex", justifyContent: "center" }}>
        {mounted ? (
          <ResponsiveContainer width="100%" height={200} minWidth={0}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={500}
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [formatCurrency(Number(value || 0)), t("common.amount")]}
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  fontSize: "0.75rem",
                  color: "var(--color-text)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 200 }} />
        )}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
            {t("common.total") || "Total"}
          </span>
          <div style={{ fontSize: "0.9375rem", fontWeight: 800, color: "var(--color-text)" }}>
            {formatCurrency(totalExpense)}
          </div>
        </div>
      </div>

      {/* Mini Legends Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "0.5rem 1rem",
          fontSize: "0.75rem",
          maxHeight: 120,
          overflowY: "auto",
        }}
      >
        {chartData.map((item) => {
          const pct = totalExpense > 0 ? ((item.value / totalExpense) * 100).toFixed(1) : "0";
          return (
            <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "3px",
                  background: item.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: "var(--color-text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                }}
              >
                {item.icon} {item.name}
              </span>
              <span style={{ fontWeight: 700, color: "var(--color-text)", flexShrink: 0 }}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 2. LAPORAN BAR CHART (Income vs Expense Trends)
// -----------------------------------------------------------------------------
export function LaporanBarChart({ transactions }: ChartProps) {
  const { t } = useTranslation();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const barData = useMemo(() => {
    const weekMap = new Map<string, { pemasukan: number; pengeluaran: number }>();

    // Seed weeks
    const weekWord = t("dashboard.weekly_week") || "Minggu";
    for (let i = 1; i <= 4; i++) {
      weekMap.set(`${weekWord} ${i}`, { pemasukan: 0, pengeluaran: 0 });
    }

    transactions.forEach((tx) => {
      if (tx.jenis === "pemasukan" || tx.jenis === "pengeluaran") {
        const weekStr = getWeekOfMonthString(tx.tanggal, t);
        const current = weekMap.get(weekStr) || { pemasukan: 0, pengeluaran: 0 };
        current[tx.jenis] += tx.jumlah;
        weekMap.set(weekStr, current);
      }
    });

    return Array.from(weekMap.entries()).map(([week, values]) => ({
      week,
      [t("common.income") || "Pemasukan"]: values.pemasukan,
      [t("common.expense") || "Pengeluaran"]: values.pengeluaran,
    }));
  }, [transactions, t]);

  const hasData = useMemo(() => {
    return barData.some(
      (d) =>
        Number(d[t("common.income") || "Pemasukan"] || 0) > 0 ||
        Number(d[t("common.expense") || "Pengeluaran"] || 0) > 0,
    );
  }, [barData, t]);

  if (!hasData) {
    return (
      <div
        className="card"
        style={{
          padding: "2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 280,
          background: "var(--color-surface)",
        }}
      >
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          {t("dashboard.weekly_empty") || "Tidak ada transaksi kas bulan ini"}
        </p>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        padding: "1.5rem",
        background: "var(--color-surface)",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--color-text)" }}>
        {t("reports.cashflow_weekly") || "Tren Arus Kas Mingguan"}
      </h3>

      <div style={{ width: "100%", height: 200 }}>
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                style={{ fontSize: "0.6875rem", fill: "var(--color-text-muted)", fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                style={{ fontSize: "0.6875rem", fill: "var(--color-text-muted)" }}
                tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)}
              />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => formatCurrency(Number(value || 0))}
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  fontSize: "0.75rem",
                  color: "var(--color-text)",
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "0.75rem", fontWeight: 600 }}
              />
              <Bar
                dataKey={t("common.income") || "Pemasukan"}
                fill="var(--color-income)"
                radius={[4, 4, 0, 0]}
                maxBarSize={16}
              />
              <Bar
                dataKey={t("common.expense") || "Pengeluaran"}
                fill="var(--color-expense)"
                radius={[4, 4, 0, 0]}
                maxBarSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 200 }} />
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3. CATEGORY PROGRESS GRID (List with progress bars)
// -----------------------------------------------------------------------------
export function CategoryProgressGrid({ transactions }: ChartProps) {
  const { t } = useTranslation();

  const expenseTx = useMemo(
    () => transactions.filter((tx) => tx.jenis === "pengeluaran"),
    [transactions],
  );

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    expenseTx.forEach((tx) => {
      map.set(tx.kategori, (map.get(tx.kategori) || 0) + tx.jumlah);
    });

    const colors = [
      "#f97316",
      "#3b82f6",
      "#a855f7",
      "#84cc16",
      "#ef4444",
      "#10b981",
      "#06b6d4",
      "#f59e0b",
      "#dc2626",
      "#14b8a6",
    ];

    return Array.from(map.entries())
      .map(([kategori, total], i) => ({
        kategori,
        total,
        color: CATEGORY_COLORS[kategori] || colors[i % colors.length],
        icon: CATEGORY_ICONS[kategori] || "📦",
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenseTx]);

  const maxTotal = useMemo(() => {
    if (categoryTotals.length === 0) return 0;
    return Math.max(...categoryTotals.map((c) => c.total));
  }, [categoryTotals]);

  const totalExpense = useMemo(
    () => categoryTotals.reduce((sum, item) => sum + item.total, 0),
    [categoryTotals],
  );

  if (categoryTotals.length === 0) return null;

  return (
    <div
      className="card"
      style={{
        padding: "1.5rem",
        background: "var(--color-surface)",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--color-text)" }}>
        {t("reports.category_breakdown") || "Rincian Detail per Kategori"}
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {categoryTotals.map((item) => {
          const pctOfMax = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
          const pctOfTotal = totalExpense > 0 ? ((item.total / totalExpense) * 100).toFixed(1) : "0";
          return (
            <div key={item.kategori} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem" }}>
                <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
                  {item.icon} {item.kategori}
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "0.375rem", fontWeight: 500 }}>
                    ({pctOfTotal}%)
                  </span>
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-text)" }}>
                  {formatCurrency(item.total)}
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: "999px",
                  background: "var(--color-surface-offset)",
                  width: "100%",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background: item.color,
                    width: `${pctOfMax}%`,
                    borderRadius: "999px",
                    transition: "width 0.6s ease-out",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
