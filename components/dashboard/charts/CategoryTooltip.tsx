"use client";
import React from "react";
import { formatCurrency } from "@/lib/utils";
import { CategoryChartData } from "@/types";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: CategoryChartData;
  }>;
  intlLocale: string;
}

export function CategoryTooltip({ active, payload, intlLocale }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
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
      <div style={{ fontWeight: 700, color: "var(--color-text)", marginBottom: "0.25rem" }}>
        {entry.name}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", color: entry.payload.fill, fontWeight: 600 }}>
        {formatCurrency(entry.value, intlLocale)}
      </div>
    </div>
  );
}
