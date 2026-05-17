"use client";
import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";
import { BudgetEntry, Transaction } from "@/types";
import { formatCurrency, calcPercentage, getBudgetStatus } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface BudgetTrackerProps {
  budgets: BudgetEntry[];
  transactions: Transaction[];
  currentMonthStr: string;
}

export function BudgetTracker({
  budgets,
  transactions,
  currentMonthStr,
}: BudgetTrackerProps) {
  const router = useRouter();
  const { t, currentLang } = useTranslation();

  // Filter budgets for current month
  const activeBudgets = useMemo(() => {
    return budgets.filter((b) => b.periode === currentMonthStr);
  }, [budgets, currentMonthStr]);

  if (activeBudgets.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "0.75rem",
          border: "1px dashed var(--color-border)",
          background: "var(--color-surface-offset)",
          borderRadius: "var(--radius-2xl)",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "var(--color-primary-bg)",
            color: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.25rem",
          }}
        >
          🎯
        </div>
        <div>
          <h3
            style={{
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "var(--color-text)",
              marginBottom: "0.25rem",
            }}
          >
            {t("budget.empty_title") || "Belum ada anggaran bulan ini"}
          </h3>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-text-muted)",
              lineHeight: 1.4,
            }}
          >
            {t("budget.subtitle") || "Atur batas belanja per kategori untuk menjaga keuangan tetap sehat"}
          </p>
        </div>
        <button
          onClick={() => router.push("/anggaran")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--color-primary)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-lg)",
            padding: "0.5rem 1rem",
            fontSize: "0.8125rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "var(--shadow-sm)",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "var(--shadow-md)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "var(--shadow-sm)";
          }}
        >
          {t("budget.add_button") || "Buat Anggaran"}
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.125rem" }}>🎯</span>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 800,
              color: "var(--color-text)",
              letterSpacing: "-0.02em",
            }}
          >
            {t("sidebar.budget") || "Anggaran Bulan Ini"}
          </h3>
        </div>
        <button
          onClick={() => router.push("/anggaran")}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-primary)",
            fontSize: "0.8125rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            padding: "0.25rem",
          }}
        >
          {t("dashboard.see_all") || "Lihat Semua"}
          <ArrowRight size={14} />
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "0.875rem",
        }}
      >
        {activeBudgets.map((b) => {
          // Calculate spent for budget category in current month
          const spent = transactions
            .filter(
              (tr) =>
                tr.kategori === b.kategori &&
                tr.jenis === "pengeluaran" &&
                tr.tanggal.startsWith(currentMonthStr)
            )
            .reduce((sum, tr) => sum + tr.jumlah, 0);

          const pct = calcPercentage(spent, b.batas_bulanan);
          const status = getBudgetStatus(pct);

          const statusConfig = {
            aman: {
              color: "var(--color-income)",
              bg: "var(--color-income-bg)",
              emoji: "✅",
              text: t("budget.card.status.safe") || "Aman",
            },
            waspada: {
              color: "var(--color-warning)",
              bg: "var(--color-warning-bg)",
              emoji: "⚠️",
              text: t("budget.card.status.warning") || "Waspada",
            },
            melebihi: {
              color: "var(--color-expense)",
              bg: "var(--color-expense-bg)",
              emoji: "🚨",
              text: t("budget.card.status.limit") || "Melebihi Batas",
            },
          }[status];

          return (
            <div
              key={b.id}
              className="card notranslate"
              style={{
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.625rem",
                border: `1px solid var(--color-border-subtle)`,
                position: "relative",
                overflow: "hidden",
                borderRadius: "var(--radius-xl)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "var(--color-text)",
                  }}
                >
                  {b.kategori}
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "100px",
                    background: statusConfig.bg,
                    color: statusConfig.color,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  {statusConfig.emoji} {statusConfig.text}
                </span>
              </div>

              {/* Progress Bar */}
              <div
                className="progress-bar"
                style={{
                  height: "8px",
                  borderRadius: "4px",
                  background: "var(--color-surface-offset)",
                }}
              >
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    borderRadius: "4px",
                    background: statusConfig.color,
                    boxShadow: `0 0 6px ${statusConfig.color}40`,
                    transition: "width 0.8s ease-out-in",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontSize: "0.8125rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      color: statusConfig.color,
                    }}
                  >
                    {formatCurrency(spent, currentLang)}
                  </span>
                  <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                    / {formatCurrency(b.batas_bulanan, currentLang)}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 800,
                    color: "var(--color-text)",
                  }}
                >
                  {pct}%
                </span>
              </div>

              {status !== "aman" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.375rem 0.5rem",
                    background: statusConfig.bg,
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.75rem",
                    color: statusConfig.color,
                    fontWeight: 600,
                  }}
                >
                  <AlertCircle size={12} />
                  <span>
                    {status === "melebihi"
                      ? `${t("budget.card.exceeded_by") || "Lebih"} ${formatCurrency(spent - b.batas_bulanan, currentLang)}`
                      : `${t("budget.card.remaining") || "Sisa"} ${formatCurrency(b.batas_bulanan - spent, currentLang)}`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
