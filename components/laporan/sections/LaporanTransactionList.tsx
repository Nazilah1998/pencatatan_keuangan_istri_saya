"use client";
import React, { useState, useMemo } from "react";
import { Search, Inbox, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Transaction } from "@/types";
import { formatCurrency } from "@/lib/utils/currency";
import { CATEGORY_ICONS } from "@/lib/constants/categories";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface LaporanTransactionListProps {
  transactions: Transaction[];
}

export function LaporanTransactionList({ transactions }: LaporanTransactionListProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"semua" | "pemasukan" | "pengeluaran">("semua");

  // Filter transaction list based on search bar and type buttons
  const filteredList = useMemo(() => {
    return transactions.filter((tx) => {
      const matchType = typeFilter === "semua" || tx.jenis === typeFilter;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchType;

      const matchDesc = (tx.deskripsi || "").toLowerCase().includes(query);
      const matchCat = tx.kategori.toLowerCase().includes(query);
      const matchWallet = tx.dompet.toLowerCase().includes(query);
      
      return matchType && (matchDesc || matchCat || matchWallet);
    });
  }, [transactions, searchQuery, typeFilter]);

  return (
    <div
      className="card"
      style={{
        padding: "1.5rem",
        background: "var(--color-surface)",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--color-text)" }}>
          {t("transactions.history") || "Daftar Transaksi"}
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "0.5rem", fontWeight: 500 }}>
            ({filteredList.length} transaksi)
          </span>
        </h3>

        {/* Type Filter Buttons */}
        <div style={{ display: "flex", gap: "0.25rem", background: "var(--color-surface-offset)", padding: "0.25rem", borderRadius: "8px" }}>
          {(["semua", "pemasukan", "pengeluaran"] as const).map((type) => {
            const active = typeFilter === type;
            const label = type === "semua" ? t("common.all") || "Semua" : type === "pemasukan" ? t("common.income") || "Pemasukan" : t("common.expense") || "Pengeluaran";
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                style={{
                  padding: "0.25rem 0.625rem",
                  fontSize: "0.75rem",
                  fontWeight: active ? 700 : 500,
                  borderRadius: "6px",
                  border: "none",
                  background: active ? "var(--color-surface)" : "transparent",
                  color: active ? "var(--color-primary)" : "var(--color-text-muted)",
                  cursor: "pointer",
                  boxShadow: active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Search Bar */}
      <div style={{ position: "relative", width: "100%" }}>
        <input
          type="text"
          placeholder={t("transactions.search_placeholder") || "Cari deskripsi, kategori, atau dompet..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            height: "38px",
            padding: "0.5rem 1rem 0.5rem 2.25rem",
            borderRadius: "10px",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-offset)",
            fontSize: "0.8125rem",
            color: "var(--color-text)",
            outline: "none",
            transition: "all 0.2s",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--color-primary)";
            e.target.style.background = "var(--color-surface)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--color-border)";
            e.target.style.background = "var(--color-surface-offset)";
          }}
        />
        <Search
          size={15}
          style={{
            position: "absolute",
            left: "0.875rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-text-muted)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Responsive View (Table for Desktop, Cards for Mobile) */}
      {filteredList.length === 0 ? (
        <div
          style={{
            padding: "3rem",
            textAlign: "center",
            color: "var(--color-text-muted)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <Inbox size={32} opacity={0.3} />
          <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
            {t("common.no_data") || "Tidak ada transaksi yang cocok"}
          </span>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="desktop-only" style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.8125rem",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                  <th style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                    {t("transactions.date") || "Tanggal"}
                  </th>
                  <th style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                    {t("transactions.category") || "Kategori"}
                  </th>
                  <th style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                    {t("transactions.wallet") || "Dompet"}
                  </th>
                  <th style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                    {t("transactions.description") || "Deskripsi"}
                  </th>
                  <th style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-muted)", fontWeight: 600, textAlign: "right" }}>
                    {t("transactions.amount") || "Jumlah"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((tx) => {
                  const isIncome = tx.jenis === "pemasukan";
                  const icon = CATEGORY_ICONS[tx.kategori] || "📦";
                  return (
                    <tr
                      key={tx.id}
                      style={{
                        borderBottom: "1px solid var(--color-border-subtle)",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-offset)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "0.875rem 0.5rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                        {tx.tanggal}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", fontWeight: 700, color: "var(--color-text)" }}>
                        <span style={{ marginRight: "0.25rem" }}>{icon}</span> {tx.kategori}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", color: "var(--color-text-muted)" }}>
                        {tx.dompet}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", color: "var(--color-text)" }}>
                        {tx.deskripsi || "-"}
                      </td>
                      <td
                        style={{
                          padding: "0.875rem 0.5rem",
                          textAlign: "right",
                          fontWeight: 700,
                          fontFamily: "var(--font-mono)",
                          color: isIncome ? "var(--color-income)" : "var(--color-expense)",
                        }}
                      >
                        {isIncome ? "+" : "-"} {formatCurrency(tx.jumlah)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD VIEW */}
          <div className="mobile-only" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filteredList.map((tx) => {
              const isIncome = tx.jenis === "pemasukan";
              const icon = CATEGORY_ICONS[tx.kategori] || "📦";
              return (
                <div
                  key={tx.id}
                  style={{
                    padding: "0.875rem",
                    borderRadius: "12px",
                    border: "1px solid var(--color-border-subtle)",
                    background: "var(--color-surface-offset)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "10px",
                        background: isIncome ? "var(--color-income-bg)" : "var(--color-expense-bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.15rem",
                        color: isIncome ? "var(--color-income)" : "var(--color-expense)",
                        flexShrink: 0,
                      }}
                    >
                      {isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text)" }}>
                        {icon} {tx.kategori}
                      </p>
                      <p
                        style={{
                          margin: "0.15rem 0 0 0",
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tx.deskripsi || `-`} • <span style={{ fontWeight: 600 }}>{tx.dompet}</span>
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.8125rem",
                        fontWeight: 800,
                        fontFamily: "var(--font-mono)",
                        color: isIncome ? "var(--color-income)" : "var(--color-expense)",
                      }}
                    >
                      {isIncome ? "+" : "-"} {formatCurrency(tx.jumlah)}
                    </p>
                    <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.6875rem", color: "var(--color-text-faint)" }}>
                      {tx.tanggal}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Styled Responsive helpers (ensures table hidden correctly on mobiles/desktops) */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
        }
        @media (min-width: 769px) {
          .desktop-only { display: block !important; }
          .mobile-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}
