"use client";
import React from "react";
import { formatCurrency } from "@/lib/utils";
import { CategoryChartData } from "@/types";

interface CategoryLegendProps {
  filteredData: CategoryChartData[];
  totalFiltered: number;
  intlLocale: string;
}

export function CategoryLegend({
  filteredData,
  totalFiltered,
  intlLocale,
}: CategoryLegendProps) {
  if (filteredData.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "0.75rem",
        marginTop: "0.25rem",
      }}
    >
      {filteredData.map((item) => {
        const pct = totalFiltered > 0 ? Math.round((item.total / totalFiltered) * 100) : 0;
        return (
          <div key={item.kategori} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: item.fill,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text)",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.kategori}
              </div>
              <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
                {pct}% • {formatCurrency(item.total, intlLocale)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
