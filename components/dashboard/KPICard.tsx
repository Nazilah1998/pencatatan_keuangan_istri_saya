"use client";
import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAnimatedValue } from "@/lib/hooks/useAnimatedValue";

interface KPICardProps {
  title: string;
  amount: number;
  type?: "default" | "income" | "expense" | "saving";
  trend?: number;
  icon?: string;
  subtitle?: string;
  onClick?: () => void;
}

export const KPICard = React.memo(function KPICard({
  title,
  amount,
  type = "default",
  trend,
  icon,
  subtitle,
  onClick,
}: KPICardProps) {
  const { isPrivateMode } = useAppStore();
  const { currentLang } = useTranslation();
  const [hasHydrated, setHasHydrated] = useState(false);
  const displayed = useAnimatedValue(amount, 1200);

  const intlLocale =
    currentLang === "id"
      ? "id-ID"
      : currentLang === "en"
        ? "en-US"
        : currentLang;

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorMap = {
    default: {
      text: "var(--color-text)",
      bg: "var(--color-surface-offset)",
      border: "var(--color-border)",
    },
    income: {
      text: "var(--color-income)",
      bg: "var(--color-income-bg)",
      border: "transparent",
    },
    expense: {
      text: "var(--color-expense)",
      bg: "var(--color-expense-bg)",
      border: "transparent",
    },
    saving: {
      text: "var(--color-saving)",
      bg: "var(--color-saving-bg)",
      border: "transparent",
    },
  };

  const colors = colorMap[type];
  const currencyPlaceholder = intlLocale === "id-ID" ? "Rp ••••••" : "$ ••••••";

  return (
    <div
      className="card notranslate"
      onClick={onClick}
      style={{
        padding: "var(--card-padding)",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: onClick ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "var(--shadow-xl)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: colors.bg,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <span
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {title}
        </span>
        {icon && (
          <span
            style={{
              fontSize: "1.25rem",
              background: colors.bg,
              padding: "0.5rem",
              borderRadius: "14px",
              boxShadow: `0 4px 12px ${colors.text}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </span>
        )}
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontVariantNumeric: "tabular-nums",
          fontSize: "clamp(1.25rem, 3vw, 1.625rem)",
          fontWeight: 700,
          color: colors.text,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
        }}
      >
        {!hasHydrated
          ? "..."
          : isPrivateMode
            ? currencyPlaceholder
            : formatCurrency(displayed, intlLocale)}
      </div>

      {(trend !== undefined || subtitle) && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          {trend !== undefined && (
            <>
              {trend >= 0 ? (
                <TrendingUp
                  size={14}
                  style={{ color: "var(--color-income)" }}
                />
              ) : (
                <TrendingDown
                  size={14}
                  style={{ color: "var(--color-expense)" }}
                />
              )}
              <span
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color:
                    trend >= 0 ? "var(--color-income)" : "var(--color-expense)",
                }}
              >
                {trend >= 0 ? "+" : ""}
                {trend.toFixed(1)}%
              </span>
            </>
          )}
          {subtitle && (
            <span
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
});
