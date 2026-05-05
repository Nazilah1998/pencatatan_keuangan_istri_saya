"use client";
import React from "react";
import { PENGELUARAN_CATEGORIES, CATEGORY_ICONS } from "@/lib/constants";

import { useTranslation } from "@/lib/i18n/useTranslation";

interface BudgetCategorySelectorProps {
  selectedKategori: string;
  onSelect: (cat: string) => void;
  error?: string;
}

export function BudgetCategorySelector({
  selectedKategori,
  onSelect,
  error,
}: BudgetCategorySelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="form-group">
      <style jsx>{`
        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.625rem;
        }
        .grid-item-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 0.5rem;
          border-radius: var(--radius-xl);
          border: 2px solid var(--color-border);
          background: transparent;
          cursor: pointer;
          transition: all var(--transition);
        }
        .grid-item-btn.selected {
          border-color: var(--color-primary);
          background: var(--color-surface-offset);
          box-shadow: var(--shadow-sm);
        }
        @media (max-width: 640px) {
          .grid-item-btn {
            padding: 0.625rem 0.375rem;
          }
        }
      `}</style>
      <label className="form-label">{t("budget.form.category_label")} *</label>

      <div className="category-grid">
        {PENGELUARAN_CATEGORIES.map((cat) => {
          const isSelected = selectedKategori === cat;
          const icon = CATEGORY_ICONS[cat] || "📁";
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelect(cat)}
              className={`grid-item-btn ${isSelected ? "selected" : ""}`}
            >
              <span style={{ fontSize: "1.5rem" }}>{icon}</span>
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  textAlign: "center",
                  color: isSelected ? "var(--color-primary)" : "var(--color-text)",
                  lineHeight: 1.2,
                }}
              >
                {cat}
              </span>
            </button>
          );
        })}
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
