"use client";
import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { getTransactions } from "@/app/actions/transactions";
import { Transaction } from "@/types";
import { formatCurrency, arrayToCSV, downloadCSV } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { format } from "date-fns";

export default function LaporanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM"),
  );

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const res = await getTransactions();
      if (res.success && res.data) setTransactions(res.data);
      setLoading(false);
    }
    fetch();
  }, []);

  const monthlyTx = transactions.filter((t) =>
    t.tanggal.startsWith(selectedMonth),
  );

  const income = monthlyTx
    .filter((t) => t.jenis === "pemasukan")
    .reduce((s, t) => s + t.jumlah, 0);
  const expense = monthlyTx
    .filter((t) => t.jenis === "pengeluaran")
    .reduce((s, t) => s + t.jumlah, 0);
  const surplus = income - expense;

  const handleExport = () => {
    const headers = [
      "ID",
      "Tanggal",
      "Jenis",
      "Jumlah",
      "Kategori",
      "Dompet",
      "Deskripsi",
    ];
    const rows = monthlyTx.map((t) => [
      t.id,
      t.tanggal,
      t.jenis,
      String(t.jumlah),
      t.kategori,
      t.dompet,
      t.deskripsi,
    ]);
    downloadCSV(arrayToCSV(headers, rows), `laporan-${selectedMonth}.csv`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--color-text)",
            }}
          >
            Laporan Bulanan
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Ringkasan keuangan per bulan
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input"
            style={{
              width: "auto",
              minHeight: 36,
              padding: "0.375rem 0.75rem",
            }}
          />
          <Button variant="secondary" onClick={handleExport} size="sm">
            <Download size={16} /> Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <CardSkeleton />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1rem",
          }}
        >
          <div
            className="card"
            style={{ padding: "1.5rem", textAlign: "center" }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                marginBottom: "0.5rem",
              }}
            >
              Total Pemasukan
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--color-income)",
              }}
            >
              {formatCurrency(income)}
            </div>
          </div>
          <div
            className="card"
            style={{ padding: "1.5rem", textAlign: "center" }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                marginBottom: "0.5rem",
              }}
            >
              Total Pengeluaran
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--color-expense)",
              }}
            >
              {formatCurrency(expense)}
            </div>
          </div>
          <div
            className="card"
            style={{
              padding: "1.5rem",
              textAlign: "center",
              background:
                surplus >= 0
                  ? "var(--color-income-bg)"
                  : "var(--color-danger-bg)",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color:
                  surplus >= 0 ? "var(--color-income)" : "var(--color-danger)",
                marginBottom: "0.5rem",
              }}
            >
              {surplus >= 0 ? "Surplus (Sisa)" : "Defisit (Kekurangan)"}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1.5rem",
                fontWeight: 700,
                color:
                  surplus >= 0 ? "var(--color-income)" : "var(--color-danger)",
              }}
            >
              {formatCurrency(Math.abs(surplus))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
