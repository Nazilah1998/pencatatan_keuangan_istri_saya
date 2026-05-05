"use client";
import React from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface TypeSelectorProps {
  watchedJenis: "pemasukan" | "pengeluaran";
  onJenisChange: (val: "pemasukan" | "pengeluaran") => void;
}

export function TypeSelector({ watchedJenis, onJenisChange }: TypeSelectorProps) {
  const { t } = useTranslation();
  const tabStyle = (active: boolean, color: string) => ({
    flex: 1,
    padding: "0.75rem",
    border: "none",
    borderRadius: "var(--radius-md)",
    background: active ? color : "transparent",
    color: active ? "white" : "var(--color-text-muted)",
    fontWeight: 700,
    fontSize: "0.8125rem",
    cursor: "pointer",
    transition: "all var(--transition)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  });

  return (
    <div className="form-group">
      <label className="form-label">{t("transactions.form.type")}</label>
      <div
        style={{
          display: "flex",
          gap: "0.375rem",
          padding: "0.375rem",
          background: "var(--color-surface-offset)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <button
          type="button"
          style={tabStyle(watchedJenis === "pemasukan", "var(--color-income)")}
          onClick={() => onJenisChange("pemasukan")}
        >
          📈 {t("common.income")}
        </button>
        <button
          type="button"
          style={tabStyle(watchedJenis === "pengeluaran", "var(--color-expense)")}
          onClick={() => onJenisChange("pengeluaran")}
        >
          📉 {t("common.expense")}
        </button>
      </div>
    </div>
  );
}
