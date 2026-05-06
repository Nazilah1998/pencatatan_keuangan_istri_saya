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
        gap: "0.75rem",
        padding: "0.5rem 0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(1.5rem, 5vw, 1.875rem)",
            fontWeight: 900,
            color: "var(--color-text)",
            letterSpacing: "-0.04em",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {greeting}
        </h1>
        <button
          onClick={onTogglePrivateMode}
          style={{
            background: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: "14px",
            padding: "0.625rem",
            cursor: "pointer",
            color: "var(--color-text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
          }}
          title={
            isPrivateMode
              ? t("dashboard.show_balance")
              : t("dashboard.hide_balance")
          }
        >
          {isPrivateMode ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.25rem 0.625rem",
            background: healthStatus.bg,
            borderRadius: "100px",
            width: "fit-content",
            color: healthStatus.color,
            border: `1px solid ${healthStatus.color}20`,
          }}
        >
          {healthStatus.icon}
          <span style={{ fontSize: "0.75rem", fontWeight: 800 }}>
            {totalPemasukan === 0
              ? healthStatus.label
              : `${healthStatus.label}: ${spendingRatio.toFixed(0)}%`}
          </span>
        </div>
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {t("dashboard.this_month")}
        </p>
      </div>
    </div>
  );
}
