"use client";
import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SummaryCardProps {
  totalAset: number;
  totalHutang: number;
  kekayaanBersih: number;
  isPrivateMode: boolean;
  togglePrivateMode: () => void;
}

export function SummaryCard({
  totalAset,
  totalHutang,
  kekayaanBersih,
  isPrivateMode,
  togglePrivateMode,
}: SummaryCardProps) {
  return (
    <div
      className="card"
      style={{
        padding: "1.5rem",
        background: "var(--color-primary)",
        color: "white",
        border: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h3
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            opacity: 0.9,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Kekayaan Bersih (Net Worth)
        </h3>
        <button
          onClick={togglePrivateMode}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "none",
            color: "white",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          title={isPrivateMode ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
        >
          {isPrivateMode ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "2rem",
          fontWeight: 700,
          marginTop: "0.5rem",
        }}
      >
        {isPrivateMode ? "Rp ••••••" : formatCurrency(kekayaanBersih)}
      </div>
      <div
        style={{
          display: "flex",
          gap: "2rem",
          marginTop: "1.25rem",
          paddingTop: "1.25rem",
          borderTop: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <div>
          <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Total Aset</div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            {isPrivateMode ? "Rp ••••••" : formatCurrency(totalAset)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Total Hutang</div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            {isPrivateMode ? "Rp ••••••" : formatCurrency(totalHutang)}
          </div>
        </div>
      </div>
    </div>
  );
}
