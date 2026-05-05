"use client";
import React from "react";
import { UseFormRegister } from "react-hook-form";
import { AssetSchema } from "@/lib/validations";

export const ASSET_TYPES = [
  { value: "kas", label: "Uang Tunai (Cash)", icon: "💵" },
  { value: "rekening", label: "Tabungan/Bank", icon: "🏦" },
  { value: "investasi", label: "Investasi", icon: "📈" },
  { value: "emas", label: "Emas/Perhiasan", icon: "🟡" },
  { value: "properti", label: "Properti", icon: "🏠" },
  { value: "kendaraan", label: "Kendaraan", icon: "🚗" },
  { value: "lainnya", label: "Aset Lainnya", icon: "📦" },
];

interface AssetTypeSelectorProps {
  selectedJenis: string;
  register: UseFormRegister<AssetSchema>;
}

export function AssetTypeSelector({ selectedJenis, register }: AssetTypeSelectorProps) {
  return (
    <div className="form-group">
      <label className="form-label">Jenis Aset</label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "0.75rem",
        }}
      >
        {ASSET_TYPES.map((type) => (
          <label
            key={type.value}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem",
              borderRadius: "var(--radius-lg)",
              border: "2px solid",
              borderColor: selectedJenis === type.value ? "var(--color-primary)" : "var(--color-border)",
              background: selectedJenis === type.value ? "var(--color-surface-offset)" : "transparent",
              cursor: "pointer",
              transition: "all var(--transition)",
            }}
          >
            <input type="radio" value={type.value} style={{ display: "none" }} {...register("jenis")} />
            <span style={{ fontSize: "1.5rem" }}>{type.icon}</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, textAlign: "center" }}>{type.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
