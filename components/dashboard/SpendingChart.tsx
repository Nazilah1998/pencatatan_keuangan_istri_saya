"use client";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { WeeklyChartData } from "@/types";
import { formatCurrency } from "@/lib/utils";

import { useTranslation } from "@/lib/i18n/useTranslation";

interface SpendingChartProps {
  data: WeeklyChartData[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  const { t, currentLang } = useTranslation();
  const intlLocale =
    currentLang === "id"
      ? "id-ID"
      : currentLang === "en"
        ? "en-US"
        : currentLang;

  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "0.75rem 1rem",
        boxShadow: "var(--shadow-md)",
        fontSize: "0.8125rem",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          marginBottom: "0.5rem",
          color: "var(--color-text)",
        }}
      >
        {label}
      </div>
      {payload.map((entry) => (
        <div
          key={entry.name}
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            marginBottom: "0.25rem",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: entry.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: "var(--color-text-muted)" }}>
            {entry.name === "pemasukan"
              ? t("dashboard.income")
              : t("dashboard.expense")}
            :
          </span>
          <span
            style={{
              fontWeight: 600,
              color: "var(--color-text)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {formatCurrency(entry.value, intlLocale)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function SpendingChart({ data }: SpendingChartProps) {
  const { t } = useTranslation();

  return (
    <div className="card" style={{ padding: "var(--card-padding)" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--color-text)",
          }}
        >
          {t("dashboard.weekly_title")}
        </h3>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-text-muted)",
            marginTop: "0.25rem",
          }}
        >
          {t("dashboard.weekly_subtitle")}
        </p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barCategoryGap="35%" barGap={4}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-divider)"
            vertical={false}
          />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) =>
              `${v / 1000000}${t("dashboard.weekly_week")[0] === "M" ? "jt" : "M"}`
            }
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            axisLine={false}
            tickLine={false}
            width={42}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "var(--color-surface-offset)" }}
          />
          <Bar
            dataKey="pemasukan"
            fill="var(--color-income)"
            radius={[4, 4, 0, 0]}
            name="pemasukan"
          />
          <Bar
            dataKey="pengeluaran"
            fill="var(--color-expense)"
            radius={[4, 4, 0, 0]}
            name="pengeluaran"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
