"use client";
import React from "react";
import { CustomWallet } from "@/types";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface WalletSelectorProps {
  wallets: CustomWallet[];
  selectedDompet: string;
  onSelect: (name: string) => void;
  error?: string;
}

export function WalletSelector({
  wallets,
  selectedDompet,
  onSelect,
  error,
}: WalletSelectorProps) {
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
          {t("transactions.form.select_wallet")} *
        </label>
        <button
          type="button"
          onClick={() => (window.location.href = "/pengaturan/dompet")}
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
        {wallets.map((wallet) => {
          const isSelected = selectedDompet === wallet.name;
          return (
            <button
              key={wallet.id}
              type="button"
              onClick={() => onSelect(wallet.name)}
              className="grid-item-btn"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.375rem",
                borderRadius: "var(--radius-lg)",
                border: "2px solid",
                borderColor: isSelected
                  ? "var(--color-primary)"
                  : "var(--color-border)",
                background: isSelected
                  ? "var(--color-surface-offset)"
                  : "transparent",
                cursor: "pointer",
                transition: "all var(--transition)",
                padding: "0.875rem 0.5rem",
              }}
            >
              <span style={{ fontSize: "1.25rem" }}>{wallet.icon || "💳"}</span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: isSelected
                    ? "var(--color-primary)"
                    : "var(--color-text)",
                }}
              >
                {wallet.name}
              </span>
            </button>
          );
        })}
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
