"use client";
import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Transaction } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { CATEGORY_COLORS } from "@/lib/constants";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const TransactionItem = React.memo(function TransactionItem({
  tx,
}: {
  tx: Transaction;
}) {
  const isIncome = tx.jenis === "pemasukan";
  const color = CATEGORY_COLORS[tx.kategori] || "#94a3b8";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        padding: "0.75rem 0",
        borderBottom: "1px solid var(--color-divider)",
      }}
    >
      {/* Category dot */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: `${color}20`,
          border: `2px solid ${color}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1rem",
          flexShrink: 0,
        }}
      >
        {isIncome ? "📈" : "📉"}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "var(--color-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {tx.deskripsi || tx.kategori}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "0.25rem",
          }}
        >
          <span
            style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}
          >
            {formatDate(tx.tanggal)}
          </span>
          <Badge variant={isIncome ? "income" : "expense"}>{tx.kategori}</Badge>
        </div>
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontVariantNumeric: "tabular-nums",
          fontSize: "0.9375rem",
          fontWeight: 700,
          color: isIncome ? "var(--color-income)" : "var(--color-expense)",
          whiteSpace: "nowrap",
        }}
      >
        {isIncome ? "+" : "-"}
        {formatCurrency(tx.jumlah)}
      </div>
    </div>
  );
});

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const recent = transactions.slice(-5).reverse();

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.5rem",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--color-text)",
            }}
          >
            Transaksi Terbaru
          </h3>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-text-muted)",
              marginTop: "0.25rem",
            }}
          >
            5 transaksi terakhir
          </p>
        </div>
        <Link
          href="/transaksi"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--color-primary)",
            textDecoration: "none",
            transition: "gap var(--transition)",
          }}
        >
          Lihat Semua <ArrowRight size={14} />
        </Link>
      </div>

      {recent.length === 0 ? (
        <EmptyState
          icon="💸"
          title="Belum ada transaksi"
          description="Mulai catat transaksi pertamamu"
        />
      ) : (
        <div>
          {recent.map((tx) => (
            <TransactionItem key={tx.id} tx={tx} />
          ))}
        </div>
      )}
    </div>
  );
}
