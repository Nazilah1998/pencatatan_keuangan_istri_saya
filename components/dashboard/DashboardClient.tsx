"use client";
import React, { useMemo, useEffect } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useDashboardStats } from "@/lib/hooks/useDashboardStats";

// Sub-components
import { DashboardHeader } from "./sections/DashboardHeader";
import { AiInsights } from "./sections/AiInsights";
import { AssetQuickGrid } from "./sections/AssetQuickGrid";
import { KPIGrid } from "./sections/KPIGrid";
import { ChartsGrid } from "./sections/ChartsGrid";
import { BudgetTracker } from "./sections/BudgetTracker";

export function DashboardClient() {
  const {
    transactions,
    savings,
    assets,
    debts,
    budgets,
    isPrivateMode,
    togglePrivateMode,
    user,
    settings,
    fetchExchangeRates,
  } = useAppStore();
  const { t, currentLang } = useTranslation();

  useEffect(() => {
    // Silently fetch and update live exchange rates on startup
    fetchExchangeRates().catch((err) => {
      console.error("Failed to silently fetch live exchange rates:", err);
    });
  }, [fetchExchangeRates]);

  const now = useMemo(() => new Date(), []);
  const stats = useDashboardStats(
    transactions,
    savings,
    now,
    t,
    settings.custom_wallets,
    assets,
    debts,
  );

  // Get display name
  const displayName = useMemo(() => {
    if (settings.nama_panggilan) return settings.nama_panggilan;
    if (user?.full_name) return user.full_name.split(" ")[0];
    return "";
  }, [settings.nama_panggilan, user]);

  const greeting = useMemo(() => {
    const hour = now.getHours();
    let timeGreeting = t("dashboard.greeting") || "Selamat Datang";
    if (hour >= 5 && hour < 12)
      timeGreeting = t("dashboard.greeting_morning") || "Selamat Pagi";
    else if (hour >= 12 && hour < 16)
      timeGreeting = t("dashboard.greeting_afternoon") || "Selamat Siang";
    else if (hour >= 16 && hour < 19)
      timeGreeting = t("dashboard.greeting_evening") || "Selamat Sore";
    else timeGreeting = t("dashboard.greeting_night") || "Selamat Malam";

    return displayName
      ? `${timeGreeting}, ${displayName}! 👋`
      : `${timeGreeting}! 👋`;
  }, [displayName, t, now]);

  const currentMonthStr = useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, [now]);

  const healthStatus = useMemo(() => {
    if (stats.totalPemasukan === 0) {
      return {
        label: t("dashboard.health.no_data"),
        color: "var(--color-text-muted)",
        bg: "var(--color-surface-offset)",
        icon: <AlertCircle size={14} />,
      };
    }
    if (stats.spendingRatio > 80) {
      return {
        label: t("dashboard.health.wasteful"),
        color: "var(--color-danger)",
        bg: "var(--color-danger-bg)",
        icon: <AlertCircle size={14} />,
      };
    }
    if (stats.spendingRatio > 60) {
      return {
        label: t("dashboard.health.warning"),
        color: "#f59e0b",
        bg: "#fef3c7",
        icon: <AlertCircle size={14} />,
      };
    }
    return {
      label: t("dashboard.health.healthy"),
      color: "var(--color-income)",
      bg: "var(--color-income-bg)",
      icon: <CheckCircle2 size={14} />,
    };
  }, [stats.totalPemasukan, stats.spendingRatio, t]);

  const intlLocale =
    currentLang === "id"
      ? "id-ID"
      : currentLang === "en"
        ? "en-US"
        : currentLang;

  const currencyPlaceholder = intlLocale === "id-ID" ? "Rp ••••••" : "$ ••••••";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <DashboardHeader
        greeting={greeting}
        isPrivateMode={isPrivateMode}
        onTogglePrivateMode={togglePrivateMode}
        healthStatus={healthStatus}
        spendingRatio={stats.spendingRatio}
        totalPemasukan={stats.totalPemasukan}
        t={t}
      />

      <KPIGrid stats={stats} t={t} />

      <AssetQuickGrid
        assets={assets}
        isPrivateMode={isPrivateMode}
        currencyPlaceholder={currencyPlaceholder}
        intlLocale={intlLocale}
        t={t}
      />

      <BudgetTracker
        budgets={budgets}
        transactions={transactions}
        currentMonthStr={currentMonthStr}
      />

      <AiInsights stats={stats} t={t} isPrivateMode={isPrivateMode} />

      <ChartsGrid
        weeklyData={stats.weeklyData}
        categoryData={stats.categoryData}
      />
    </div>
  );
}
