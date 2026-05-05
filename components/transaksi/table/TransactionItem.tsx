"use client";
import React from "react";
import { Trash2, Pencil } from "lucide-react";
import { Transaction } from "@/types";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/constants";

interface TransactionItemProps {
  tx: Transaction;
  realIdx: number;
  onEdit: (tx: Transaction, idx: number) => void;
  onDelete: (id: string, idx: number) => void;
}

export function TransactionItem({
  tx,
  realIdx,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const isIncome = tx.jenis === "pemasukan";
  const catColor = CATEGORY_COLORS[tx.kategori] || "var(--color-primary)";

  return (
    <div
      className="card"
      style={{
        padding: "0.875rem 1rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        border: "1px solid var(--color-border-subtle)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        background: "var(--color-surface)",
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: "14px",
          background: `${catColor}12`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.125rem",
          flexShrink: 0,
          border: `1px solid ${catColor}20`,
        }}
      >
        {isIncome ? "📈" : "📉"}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            width: "100%",
          }}
        >
          <h4
            style={{
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "var(--color-text)",
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "70%",
            }}
          >
            {tx.deskripsi || tx.kategori}
          </h4>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-faint)",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            • {tx.dompet}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              color: catColor,
              fontWeight: 700,
              background: `${catColor}10`,
              padding: "0.1rem 0.4rem",
              borderRadius: "4px",
            }}
          >
            {tx.kategori}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              fontSize: "0.9375rem",
              color: isIncome ? "var(--color-income)" : "var(--color-expense)",
            }}
          >
            {isIncome ? "+" : "-"}
            {formatCurrency(tx.jumlah)}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.125rem" }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(tx, realIdx)}
          style={{
            color: "var(--color-text-faint)",
            width: 32,
            height: 32,
          }}
        >
          <Pencil size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(tx.id, realIdx)}
          style={{
            color: "var(--color-expense)",
            opacity: 0.7,
            width: 32,
            height: 32,
          }}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}
