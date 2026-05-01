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
  const categoryKeys = data.map((d) => d.kategori).join(",");
  const [prevKeys, setPrevKeys] = React.useState(categoryKeys);
  const [activeCategories, setActiveCategories] = React.useState<string[]>(
    data.map((d) => d.kategori),
  );

  // Sync active categories when data categories change (e.g. new month)
  if (categoryKeys !== prevKeys) {
    setPrevKeys(categoryKeys);
    setActiveCategories(data.map((d) => d.kategori));
  }

  const filteredData = React.useMemo(() => {
    return data.filter((d) => activeCategories.includes(d.kategori));
  }, [data, activeCategories]);

  const toggleCategory = (kategori: string) => {
    setActiveCategories((prev) =>
      prev.includes(kategori)
        ? prev.filter((c) => c !== kategori)
        : [...prev, kategori],
    );
  };

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

  const totalFiltered = filteredData.reduce((s, d) => s + d.total, 0);

  return (
    <div
      className="card"
      style={{
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
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
              Klik kategori untuk memfilter tampilan
            </p>
          </div>
          {filteredData.length !== data.length && (
            <button
              onClick={() => setActiveCategories(data.map((d) => d.kategori))}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-primary)",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "6px",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  "var(--color-primary-highlight)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Category Chips Filter */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginTop: "1rem",
          }}
        >
          {data.map((item) => {
            const isActive = activeCategories.includes(item.kategori);
            return (
              <button
                key={item.kategori}
                onClick={() => toggleCategory(item.kategori)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.375rem 0.75rem",
                  borderRadius: "100px",
                  border: `1.5px solid ${isActive ? item.fill : "var(--color-border)"}`,
                  background: isActive ? `${item.fill}15` : "transparent",
                  color: isActive
                    ? "var(--color-text)"
                    : "var(--color-text-muted)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  opacity: isActive ? 1 : 0.6,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: item.fill,
                  }}
                />
                {item.kategori}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ position: "relative", minHeight: 200 }}>
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={filteredData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="total"
                nameKey="kategori"
                animationBegin={0}
                animationDuration={800}
              >
                {filteredData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-muted)",
              fontSize: "0.875rem",
            }}
          >
            Pilih kategori untuk melihat data
          </div>
        )}
      </div>

      {/* Legend with Dynamic Percentages */}
      {filteredData.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
            marginTop: "0.25rem",
          }}
        >
          {filteredData.map((item) => {
            const pct =
              totalFiltered > 0
                ? Math.round((item.total / totalFiltered) * 100)
                : 0;
            return (
              <div
                key={item.kategori}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
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
                  <div
                    style={{
                      fontSize: "0.6875rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {pct}% • {formatCurrency(item.total)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
