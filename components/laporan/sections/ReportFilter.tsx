"use client";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ReportFilterProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export function ReportFilter({
  currentDate,
  onPrevMonth,
  onNextMonth,
  categories,
  selectedCategory,
  onSelectCategory,
}: ReportFilterProps) {
  return (
    <div
      className="card"
      style={{
        padding: "1.25rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
        <button
          onClick={onPrevMonth}
          style={{
            width: 36,
            height: 36,
            borderRadius: "10px 0 0 10px",
            border: "1px solid var(--color-border)",
            borderRight: "none",
            background: "var(--color-surface-offset)",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <div
          style={{
            flex: 1,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            fontSize: "0.9375rem",
            fontWeight: 700,
            color: "var(--color-text)",
          }}
        >
          {format(currentDate, "MMMM yyyy", { locale: id })}
        </div>

        <button
          onClick={onNextMonth}
          style={{
            width: 36,
            height: 36,
            borderRadius: "0 10px 10px 0",
            border: "1px solid var(--color-border)",
            borderLeft: "none",
            background: "var(--color-surface-offset)",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              style={{
                padding: "0.375rem 0.875rem",
                borderRadius: "999px",
                border: active ? "1.5px solid var(--color-primary)" : "1.5px solid var(--color-border)",
                background: active ? "var(--color-primary-highlight)" : "var(--color-surface)",
                color: active ? "var(--color-primary)" : "var(--color-text-muted)",
                fontSize: "0.8125rem",
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
