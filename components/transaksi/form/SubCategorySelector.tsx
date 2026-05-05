"use client";
import React from "react";
import { CustomSubCategory } from "@/types";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface SubCategorySelectorProps {
  subCategories: CustomSubCategory[];
  selectedSubKategori: string;
  onSelect: (name: string) => void;
}

export function SubCategorySelector({
  subCategories,
  selectedSubKategori,
  onSelect,
}: SubCategorySelectorProps) {
  const { t } = useTranslation();
  if (subCategories.length === 0) return null;

  return (
    <div className="form-group animate-in fade-in slide-in-from-top-2">
      <label className="form-label">
        {t("transactions.form.select_subcategory")}
      </label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: "0.625rem",
        }}
      >
        {subCategories.map((sub) => {
          const isSelected = selectedSubKategori === sub.name;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => onSelect(sub.name)}
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
              <span style={{ fontSize: "1.5rem" }}>{sub.icon || "🔹"}</span>
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
                {sub.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
