"use client";
import React from "react";
import { Eye, EyeOff } from "lucide-react";

interface DashboardHeaderProps {
  greeting: string;
  isPrivateMode: boolean;
  onTogglePrivateMode: () => void;
  healthStatus: {
    label: string;
    color: string;
    bg: string;
    icon: React.ReactNode;
  };
  spendingRatio: number;
  totalPemasukan: number;
  t: (key: string) => string;
}

export function DashboardHeader({
  greeting,
  isPrivateMode,
  onTogglePrivateMode,
  healthStatus,
  spendingRatio,
  totalPemasukan,
  t,
}: DashboardHeaderProps) {
  return (
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
          onClick={onTogglePrivateMode}
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
          title={isPrivateMode ? t("dashboard.show_balance") : t("dashboard.hide_balance")}
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
            {totalPemasukan === 0
              ? healthStatus.label
              : `${healthStatus.label}: ${spendingRatio.toFixed(0)}%`}
          </span>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
          {t("dashboard.this_month")}
        </p>
      </div>
    </div>
  );
}
