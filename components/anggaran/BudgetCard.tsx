"use client";
import React from "react";
import { Trash2 } from "lucide-react";
import { BudgetEntry, Transaction } from "@/types";
import {
  formatCurrency,
  calcPercentage,
  getBudgetStatus,
  getPeriodLabel,
} from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { id as localeId, enUS as localeEn } from "date-fns/locale";

interface BudgetCardProps {
  budget: BudgetEntry;
  transactions: Transaction[];
  onDelete: () => void;
}

export const BudgetCard = React.memo(function BudgetCard({
  budget,
  transactions,
  onDelete,
}: BudgetCardProps) {
  const { t, currentLang } = useTranslation();
  const dateLocale = currentLang === "id" ? localeId : localeEn;

  const spent = transactions
    .filter(
      (t) =>
        t.kategori === budget.kategori &&
        t.jenis === "pengeluaran" &&
        t.tanggal.startsWith(budget.periode),
    )
    .reduce((s, t) => s + t.jumlah, 0);

  const pct = calcPercentage(spent, budget.batas_bulanan);
  const status = getBudgetStatus(pct);

  const statusConfig = {
    aman: {
      color: "var(--color-income)",
      bg: "var(--color-income-bg)",
      label: t("budget.card.status.safe"),
      emoji: "✅",
    },
    waspada: {
      color: "var(--color-warning)",
      bg: "var(--color-warning-bg)",
      label: t("budget.card.status.warning"),
      emoji: "⚠️",
    },
    melebihi: {
      color: "var(--color-expense)",
      bg: "var(--color-expense-bg)",
      label: t("budget.card.status.limit"),
      emoji: "🚨",
    },
  }[status];

  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "1rem",
          gap: "0.5rem",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--color-text)",
              }}
            >
              {budget.kategori}
            </h3>
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                padding: "0.15rem 0.5rem",
                borderRadius: 999,
                background: statusConfig.bg,
                color: statusConfig.color,
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              {statusConfig.emoji} {statusConfig.label}
            </span>
          </div>
          <div
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-text-muted)",
              marginTop: "0.25rem",
            }}
          >
            {getPeriodLabel(budget.periode, dateLocale)}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          style={{ color: "var(--color-expense)", minWidth: 32, height: 32 }}
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar" style={{ marginBottom: "0.625rem" }}>
        <div
          className="progress-bar-fill"
          style={{
            width: `${pct}%`,
            background: statusConfig.color,
            boxShadow: `0 0 8px ${statusConfig.color}60`,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: "0.9375rem",
              color: statusConfig.color,
            }}
          >
            {formatCurrency(spent, currentLang)}
          </span>
          <span
            style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}
          >
            {" "}
            {t("budget.card.spent_of")}{" "}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              fontSize: "0.9375rem",
              color: "var(--color-text)",
            }}
          >
            {formatCurrency(budget.batas_bulanan, currentLang)}
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: "1rem",
            color: statusConfig.color,
          }}
        >
          {pct}%
        </span>
      </div>

      {status !== "aman" && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.5rem 0.75rem",
            background: statusConfig.bg,
            borderRadius: "var(--radius-md)",
            fontSize: "0.8125rem",
            color: statusConfig.color,
            fontWeight: 500,
          }}
        >
          {status === "melebihi"
            ? `${t("budget.card.exceeded_by")} ${formatCurrency(spent - budget.batas_bulanan, currentLang)}`
            : `${t("budget.card.remaining")} ${formatCurrency(budget.batas_bulanan - spent, currentLang)}`}
        </div>
      )}
    </div>
  );
});
