"use client";
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CategoryChartData } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface CategoryPieChartProps {
  data: CategoryChartData[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: CategoryChartData;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
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
      <div
        style={{
          fontWeight: 700,
          color: "var(--color-text)",
          marginBottom: "0.25rem",
        }}
      >
        {entry.name}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          color: entry.payload.fill,
          fontWeight: 600,
        }}
      >
        {formatCurrency(entry.value)}
      </div>
    </div>
  );
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (!data.length) {
    return (
      <div
        className="card"
        style={{
          padding: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 280,
        }}
      >
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem" }}>
          Belum ada data pengeluaran
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--color-text)",
          }}
        >
          Pengeluaran per Kategori
        </h3>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-text-muted)",
            marginTop: "0.25rem",
          }}
        >
          Distribusi pengeluaran bulan ini
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="total"
              nameKey="kategori"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          marginTop: "0.75rem",
        }}
      >
        {data.slice(0, 5).map((item) => {
          const total = data.reduce((s, d) => s + d.total, 0);
          const pct = total > 0 ? Math.round((item.total / total) * 100) : 0;
          return (
            <div
              key={item.kategori}
              style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: item.fill,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.kategori}
              </span>
              <span
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--color-text)",
                }}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
