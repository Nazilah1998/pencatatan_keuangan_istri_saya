"use client";
import React from "react";
import { CustomCategory } from "@/types";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface CategorySelectorProps {
  categories: CustomCategory[];
  selectedKategori: string;
  watchedJenis: string;
  onSelect: (name: string) => void;
  error?: string;
}

export function CategorySelector({
  categories,
  selectedKategori,
  watchedJenis,
  onSelect,
  error,
}: CategorySelectorProps) {
  const { t } = useTranslation();
  return (
    <div className="form-group">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <label className="form-label" style={{ margin: 0 }}>
          {t("transactions.form.select_category")} *
        </label>
        <button
          type="button"
          onClick={() => (window.location.href = "/pengaturan/kategori")}
          style={{
            fontSize: "0.75rem",
            background: "var(--color-primary-highlight)",
            color: "var(--color-primary)",
            border: "none",
            padding: "2px 8px",
            borderRadius: "6px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>+ {t("transactions.form.add_new")}</span>
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: "0.625rem",
        }}
      >
        {categories
          .filter((c) => c.type === watchedJenis)
          .map((cat) => {
            const isSelected = selectedKategori === cat.name;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect(cat.name)}
                className="grid-item-btn"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                  borderRadius: "var(--radius-xl)",
                  border: "2px solid",
                  borderColor: isSelected
                    ? "var(--color-primary)"
                    : "var(--color-border)",
                  background: isSelected
                    ? "var(--color-surface-offset)"
                    : "transparent",
                  cursor: "pointer",
                  transition: "all var(--transition)",
                  boxShadow: isSelected ? "var(--shadow-sm)" : "none",
                  padding: "0.875rem 0.5rem",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>{cat.icon || "📁"}</span>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    textAlign: "center",
                    color: isSelected
                      ? "var(--color-primary)"
                      : "var(--color-text)",
                    lineHeight: 1.2,
                  }}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
