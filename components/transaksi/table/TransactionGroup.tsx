"use client";
import React from "react";
import { Transaction } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TransactionItem } from "./TransactionItem";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { id as localeId, enUS as localeEn } from "date-fns/locale";

interface TransactionGroupProps {
  date: string;
  dayTransactions: Transaction[];
  transactions: Transaction[]; // full list for realIdx
  onEdit: (tx: Transaction, idx: number) => void;
  onDelete: (id: string, idx: number) => void;
}

export function TransactionGroup({
  date,
  dayTransactions,
  transactions,
  onEdit,
  onDelete,
}: TransactionGroupProps) {
  const { t, currentLang } = useTranslation();
  const dateLocale = currentLang === "id" ? localeId : localeEn;
  const now = new Date();
  const dateStr = date;
  
  const isToday = (d: string) => d === now.toISOString().split("T")[0];
  const isYesterday = (d: string) => {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return d === yesterday.toISOString().split("T")[0];
  };

  const totalDayExpense = dayTransactions
    .filter((tx) => tx.jenis === "pengeluaran")
    .reduce((sum, tx) => sum + tx.jumlah, 0);
  const totalDayIncome = dayTransactions
    .filter((tx) => tx.jenis === "pemasukan")
    .reduce((sum, tx) => sum + tx.jumlah, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem 0.5rem",
          position: "sticky",
          top: "0",
          zIndex: 10,
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(8px)",
        }}
      >
        <h5
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          {isToday(dateStr) 
            ? t("common.today") 
            : isYesterday(dateStr) 
              ? t("common.yesterday") 
              : formatDate(dateStr, "dd MMM yyyy", dateLocale)}
        </h5>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {totalDayIncome > 0 && (
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 800,
                color: "var(--color-income)",
                background: "var(--color-income-bg)",
                padding: "0.1rem 0.4rem",
                borderRadius: "100px",
              }}
            >
              +{formatCurrency(totalDayIncome)}
            </span>
          )}
          {totalDayExpense > 0 && (
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 800,
                color: "var(--color-expense)",
                background: "var(--color-expense-bg)",
                padding: "0.1rem 0.4rem",
                borderRadius: "100px",
              }}
            >
              -{formatCurrency(totalDayExpense)}
            </span>
          )}
          <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--color-text-faint)", marginLeft: "0.25rem" }}>
            {dayTransactions.length} Tx
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {dayTransactions.map((tx) => {
          const realIdx = transactions.findIndex((t) => t.id === tx.id);
          return (
            <TransactionItem
              key={tx.id}
              tx={tx}
              realIdx={realIdx}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          );
        })}
      </div>
    </div>
  );
}
