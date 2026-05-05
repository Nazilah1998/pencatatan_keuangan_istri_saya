"use client";
import React from "react";
import { UseFormRegister } from "react-hook-form";
import { DebtSchema } from "@/lib/validations";

export const DEBT_TYPES = [
  { value: "kpr", label: "KPR Rumah", icon: "🏠" },
  { value: "kendaraan", label: "Kredit Kendaraan", icon: "🏍️" },
  { value: "kartu_kredit", label: "Kartu Kredit", icon: "💳" },
  { value: "pinjaman_pribadi", label: "Pinjaman Pribadi", icon: "👤" },
  { value: "lainnya", label: "Hutang Lainnya", icon: "📄" },
];

interface DebtTypeSelectorProps {
  selectedJenis: string;
  register: UseFormRegister<DebtSchema>;
}

export function DebtTypeSelector({ selectedJenis, register }: DebtTypeSelectorProps) {
  return (
    <div className="form-group">
      <label className="form-label">Jenis Hutang</label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "0.75rem",
        }}
      >
        {DEBT_TYPES.map((type) => (
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
