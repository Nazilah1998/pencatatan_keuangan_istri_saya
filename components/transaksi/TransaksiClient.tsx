"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getTransactions } from "@/app/actions/transactions";
import { TransactionTable } from "@/components/transaksi/TransactionTable";
import { Button } from "@/components/ui/Button";
import { Transaction, AppSettings } from "@/types";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface TransaksiClientProps {
  initialTransactions: Transaction[];
  initialSettings?: Partial<AppSettings>;
}

export function TransaksiClient({
  initialTransactions,
  initialSettings,
}: TransaksiClientProps) {
  const { t } = useTranslation();
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);

  const fetchTransactions = async () => {
    const res = await getTransactions();
    if (res.success && res.data) setTransactions(res.data);
  };

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
            {t("transactions.list_title")}
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
              marginTop: "0.25rem",
            }}
          >
            {t("transactions.subtitle")}
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
              <span style={{ fontWeight: 700 }}>{t("common.add")}</span>
            </Button>
          </Link>
        </div>
      </div>

      <TransactionTable
        transactions={transactions}
        onRefresh={fetchTransactions}
        initialSettings={initialSettings}
      />
    </div>
  );
}
