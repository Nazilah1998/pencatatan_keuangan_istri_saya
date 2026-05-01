"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getTransactions } from "@/app/actions/transactions";
import { TransactionTable } from "@/components/transaksi/TransactionTable";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Transaction } from "@/types";

export default function TransaksiPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    const res = await getTransactions();
    if (res.success && res.data) setTransactions(res.data);
    setLoading(false);
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchTransactions());
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          padding: "0.5rem 0",
          borderBottom: "1px solid var(--color-border-subtle)",
          marginBottom: "0.5rem",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--color-text)",
              letterSpacing: "-0.025em",
              margin: 0,
            }}
          >
            Daftar Transaksi
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
              marginTop: "0.25rem",
            }}
          >
            Riwayat arus kas masuk dan keluar Anda
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/transaksi/tambah" style={{ textDecoration: "none" }}>
            <Button
              size="sm"
              style={{
                borderRadius: "12px",
                gap: "0.375rem",
                padding: "0.5rem 1rem",
              }}
            >
              <Plus size={18} strokeWidth={3} />{" "}
              <span style={{ fontWeight: 700 }}>Tambah</span>
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: "1.5rem" }}>
          <TableSkeleton />
        </div>
      ) : (
        <TransactionTable
          transactions={transactions}
          onRefresh={fetchTransactions}
        />
      )}
    </div>
  );
}
