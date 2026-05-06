"use client";
import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
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
  wallets?: { name: string; balance: number; icon?: string }[];
  isFeatured?: boolean;
}

export const KPICard = React.memo(function KPICard({
  title,
  amount,
  type = "default",
  trend,
  icon,
  subtitle,
  onClick,
  wallets,
  isFeatured = false,
}: KPICardProps) {
  const { isPrivateMode } = useAppStore();
  const { currentLang } = useTranslation();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const displayed = useAnimatedValue(amount, 1200);

  const isExpandable = wallets && wallets.length > 0;

  const handleToggle = () => {
    if (isExpandable) {
      setIsExpanded(!isExpanded);
    } else if (onClick) {
      onClick();
    }
  };

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
      text: "var(--color-primary-dark)",
      bg: "linear-gradient(135deg, var(--color-primary-bg) 0%, #fff 100%)",
      accent: "var(--color-primary)",
      shadow: "rgba(var(--color-primary-rgb), 0.1)",
    },
    income: {
      text: "var(--color-income)",
      bg: "linear-gradient(135deg, var(--color-income-bg) 0%, #fff 100%)",
      accent: "var(--color-income)",
      shadow: "rgba(16, 185, 129, 0.1)",
    },
    expense: {
      text: "var(--color-expense)",
      bg: "linear-gradient(135deg, var(--color-expense-bg) 0%, #fff 100%)",
      accent: "var(--color-expense)",
      shadow: "rgba(239, 68, 68, 0.1)",
    },
    saving: {
      text: "var(--color-saving)",
      bg: "linear-gradient(135deg, var(--color-saving-bg) 0%, #fff 100%)",
      accent: "var(--color-saving)",
      shadow: "rgba(59, 130, 246, 0.1)",
    },
  };

  const colors = colorMap[type];
  const currencyPlaceholder = intlLocale === "id-ID" ? "Rp ••••••" : "$ ••••••";

  return (
    <div
      className="card notranslate"
      onClick={handleToggle}
      style={{
        padding: isFeatured ? "1.5rem" : "1.125rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        position: "relative",
        overflow: "hidden",
        background: isFeatured
          ? `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #000) 140%)`
          : colors.bg,
        border: `1px solid ${isFeatured ? "rgba(255,255,255,0.1)" : "var(--color-border-subtle)"}`,
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: isExpandable || onClick ? "pointer" : "default",
        boxShadow: isFeatured
          ? "0 10px 25px -5px rgba(0,0,0,0.15)"
          : `0 8px 32px -4px ${colors.shadow}`,
        borderRadius: "var(--radius-2xl)",
      }}
    >
      {/* Decorative Blur Circle */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-10%",
          right: "-5%",
          width: isFeatured ? "120px" : "80px",
          height: isFeatured ? "120px" : "80px",
          borderRadius: "50%",
          background: isFeatured ? "rgba(255,255,255,0.2)" : colors.accent,
          filter: "blur(40px)",
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: isFeatured
                ? "rgba(255,255,255,0.85)"
                : "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {title}
          </span>
          {isExpandable && (
            <ChevronDown
              size={14}
              style={{
                color: isFeatured ? "#fff" : "var(--color-text-muted)",
                transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                transition: "transform 0.3s ease",
                opacity: 0.8,
              }}
            />
          )}
        </div>
        {icon && (
          <span
            style={{
              fontSize: isFeatured ? "1.5rem" : "1.25rem",
              background: isFeatured
                ? "rgba(255,255,255,0.2)"
                : "rgba(255,255,255,0.8)",
              backdropFilter: "blur(8px)",
              padding: "0.5rem",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${isFeatured ? "rgba(255,255,255,0.3)" : "var(--color-border-subtle)"}`,
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
          fontSize: isFeatured
            ? "clamp(1.75rem, 6vw, 2.5rem)"
            : "clamp(1.375rem, 4.5vw, 1.875rem)",
          fontWeight: 900,
          color: isFeatured ? "#fff" : colors.text,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          position: "relative",
          zIndex: 2,
          textShadow: isFeatured ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
        }}
      >
        {!hasHydrated
          ? "..."
          : isPrivateMode
            ? currencyPlaceholder
            : formatCurrency(displayed, intlLocale)}
      </div>

      {(trend !== undefined || subtitle) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "0.125rem",
            position: "relative",
            zIndex: 2,
          }}
        >
          {trend !== undefined && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                background: isFeatured
                  ? "rgba(255,255,255,0.15)"
                  : colors.shadow,
                padding: "0.125rem 0.5rem",
                borderRadius: "100px",
                border: isFeatured ? "1px solid rgba(255,255,255,0.2)" : "none",
              }}
            >
              {trend >= 0 ? (
                <TrendingUp
                  size={12}
                  style={{ color: isFeatured ? "#fff" : "var(--color-income)" }}
                />
              ) : (
                <TrendingDown
                  size={12}
                  style={{
                    color: isFeatured ? "#fff" : "var(--color-expense)",
                  }}
                />
              )}
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: isFeatured
                    ? "#fff"
                    : trend >= 0
                      ? "var(--color-income)"
                      : "var(--color-expense)",
                }}
              >
                {trend >= 0 ? "+" : ""}
                {trend.toFixed(1)}%
              </span>
            </div>
          )}
          {subtitle && (
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 500,
                color: isFeatured
                  ? "rgba(255,255,255,0.7)"
                  : "var(--color-text-muted)",
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}

      {isExpandable && (
        <div
          style={{
            maxHeight: isExpanded ? "600px" : "0px",
            opacity: isExpanded ? 1 : 0,
            overflow: "hidden",
            transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              paddingTop: "1rem",
              borderTop: `1px dashed ${isFeatured ? "rgba(255,255,255,0.2)" : "var(--color-border)"}`,
              marginTop: "0.75rem",
            }}
          >
            {wallets?.map((w, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.8125rem",
                  padding: "0.25rem 0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      background: isFeatured
                        ? "rgba(255,255,255,0.1)"
                        : "var(--color-surface-offset)",
                      padding: "0.25rem",
                      borderRadius: "8px",
                    }}
                  >
                    {w.icon || "💰"}
                  </span>
                  <span
                    style={{
                      color: isFeatured
                        ? "rgba(255,255,255,0.9)"
                        : "var(--color-text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    {w.name}
                  </span>
                </div>
                <span
                  style={{
                    fontWeight: 800,
                    color: isFeatured ? "#fff" : colors.text,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {isPrivateMode
                    ? "••••"
                    : formatCurrency(w.balance, intlLocale)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
