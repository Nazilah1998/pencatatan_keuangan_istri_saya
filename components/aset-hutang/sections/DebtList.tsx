"use client";
import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Debt } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

interface DebtListProps {
  debts: Debt[];
  sortBy: "highest" | "lowest" | "newest";
  isPrivateMode: boolean;
  onEdit: (debt: Debt) => void;
  onDelete: (id: string) => void;
}

export function DebtList({
  debts,
  sortBy,
  isPrivateMode,
  onEdit,
  onDelete,
}: DebtListProps) {
  if (debts.length === 0) {
    return (
      <EmptyState
        icon="💳"
        title="Belum ada hutang"
        description="Wah bagus! Belum ada tanggungan hutang yang dicatat."
      />
    );
  }

  const sortedDebts = [...debts].sort((a, b) => {
    if (sortBy === "highest") return b.sisa_hutang - a.sisa_hutang;
    if (sortBy === "lowest") return a.sisa_hutang - b.sisa_hutang;
    return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {sortedDebts.map((d) => (
        <div
          key={d.id}
          className="card"
          style={{
            padding: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: "1.25rem",
                width: "40px",
                height: "40px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--color-surface-offset)",
                borderRadius: "12px",
              }}
            >
              💳
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "1rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: "var(--color-text)",
                }}
              >
                {d.nama_hutang}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginTop: "0.125rem",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "var(--color-expense)",
                  }}
                >
                  {isPrivateMode ? "Rp ••••••" : formatCurrency(d.sisa_hutang)}
                </span>
                <span style={{ fontSize: "0.6875rem", color: "var(--color-text-faint)" }}>
                  • s.d {formatDate(d.tanggal_jatuh_tempo)}
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  marginTop: "0.125rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {d.catatan ? `${d.catatan} • ` : ""}Cicilan:{" "}
                {isPrivateMode ? "Rp ••••••" : `${formatCurrency(d.cicilan_bulanan)}/bln`}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0rem", flexShrink: 0 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(d)}
              style={{ color: "var(--color-text-faint)", width: 28, height: 28 }}
            >
              <Pencil size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(d.id)}
              style={{ color: "var(--color-expense)", opacity: 0.7, width: 28, height: 28 }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
