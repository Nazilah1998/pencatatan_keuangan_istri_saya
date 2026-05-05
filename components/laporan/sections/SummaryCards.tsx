"use client";
import React from "react";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useAnimatedValue, formatAnimated } from "@/lib/hooks/useAnimatedValue";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface SummaryCardsProps {
  income: number;
  expense: number;
  surplus: number;
}

export function SummaryCards({ income, expense, surplus }: SummaryCardsProps) {
  const { t } = useTranslation();
  const animIncome = useAnimatedValue(income);
  const animExpense = useAnimatedValue(expense);
  const animSurplus = useAnimatedValue(Math.abs(surplus));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "1.25rem",
      }}
    >
      {/* Income */}
      <div
        className="card"
        style={{ padding: "1.5rem", position: "relative", overflow: "hidden" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1rem",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-muted)",
              }}
            >
              {t("common.income")}
            </p>
            <h3
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "var(--color-income)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {formatAnimated(animIncome)}
            </h3>
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: "var(--color-income-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-income)",
            }}
          >
            <TrendingUp size={22} />
          </div>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-faint)" }}>
          {t("reports.income_desc")}
        </p>
      </div>

      {/* Expense */}
      <div
        className="card"
        style={{ padding: "1.5rem", position: "relative", overflow: "hidden" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1rem",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-muted)",
              }}
            >
              {t("common.expense")}
            </p>
            <h3
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "var(--color-expense)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {formatAnimated(animExpense)}
            </h3>
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: "var(--color-expense-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-expense)",
            }}
          >
            <TrendingDown size={22} />
          </div>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-faint)" }}>
          {t("reports.expense_desc")}
        </p>
      </div>

      {/* Surplus/Deficit */}
      <div
        className="card"
        style={{
          padding: "1.5rem",
          background:
            surplus >= 0
              ? "linear-gradient(135deg, var(--color-surface) 0%, var(--color-income-bg) 100%)"
              : "linear-gradient(135deg, var(--color-surface) 0%, var(--color-danger-bg) 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1rem",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-muted)",
              }}
            >
              {surplus >= 0
                ? `${t("reports.surplus_label")} (Surplus)`
                : `${t("reports.surplus_label")} (Defisit)`}
            </p>
            <h3
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color:
                  surplus >= 0 ? "var(--color-income)" : "var(--color-danger)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {formatAnimated(animSurplus)}
            </h3>
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background:
                surplus >= 0 ? "var(--color-income)" : "var(--color-danger)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <Wallet size={22} />
          </div>
        </div>
        <p
          style={{
            fontSize: "0.75rem",
            color: surplus >= 0 ? "var(--color-income)" : "var(--color-danger)",
            fontWeight: 600,
            opacity: 0.9,
          }}
        >
          {surplus >= 0 ? t("reports.healthy_msg") : t("reports.wasteful_msg")}
        </p>
      </div>
    </div>
  );
}
