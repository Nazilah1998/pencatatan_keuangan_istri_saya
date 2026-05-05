"use client";
import React from "react";
import { CategoryChartData } from "@/types";

interface CategoryFilterProps {
  data: CategoryChartData[];
  activeCategories: string[];
  onToggle: (kategori: string) => void;
  onReset: () => void;
  t: (key: string) => string;
}

export function CategoryFilter({
  data,
  activeCategories,
  onToggle,
  onReset,
  t,
}: CategoryFilterProps) {
  const isFiltered = activeCategories.length !== data.length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)" }}>
            {t("dashboard.pie_title")}
          </h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
            {t("dashboard.pie_subtitle")}
          </p>
        </div>
        {isFiltered && (
          <button
            onClick={onReset}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary)",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "6px",
            }}
          >
            {t("dashboard.reset_filter")}
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
        {data.map((item) => {
          const isActive = activeCategories.includes(item.kategori);
          return (
            <button
              key={item.kategori}
              onClick={() => onToggle(item.kategori)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.375rem 0.75rem",
                borderRadius: "100px",
                border: `1.5px solid ${isActive ? item.fill : "var(--color-border)"}`,
                background: isActive ? `${item.fill}15` : "transparent",
                color: isActive ? "var(--color-text)" : "var(--color-text-muted)",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                opacity: isActive ? 1 : 0.6,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.fill }} />
              {item.kategori}
            </button>
          );
        })}
      </div>
    </div>
  );
}
