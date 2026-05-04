"use client";
import React, { useState, useMemo } from "react";
import { Trash2, Pencil, Search, AlertTriangle } from "lucide-react";
import { Transaction } from "@/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { deleteTransaction } from "@/app/actions/transactions";
import { useAppStore } from "@/store/useAppStore";
import { TransactionForm } from "./TransactionForm";
import { CATEGORY_COLORS } from "@/lib/constants";
import toast from "react-hot-toast";

interface TransactionTableProps {
  transactions: Transaction[];
  onRefresh: () => void;
}

export function TransactionTable({
  transactions,
  onRefresh,
}: TransactionTableProps) {
  const { settings, isPrivateMode } = useAppStore();
  const now = new Date();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [editData, setEditData] = useState<{
    tx: Transaction;
    idx: number;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<{ id: string; idx: number } | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [typeFilter, setTypeFilter] = useState<
    "all" | "pemasukan" | "pengeluaran"
  >("all");

  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => {
        const txDate = new Date(tx.tanggal);
        const matchesDate =
          txDate.getMonth() === selectedMonth &&
          txDate.getFullYear() === selectedYear;

        const matchesSearch =
          tx.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.dompet.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === "all" || tx.jenis === typeFilter;

        return matchesDate && matchesSearch && matchesType;
      })
      .reverse(); // Newest first
  }, [transactions, searchTerm, typeFilter, selectedMonth, selectedYear]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const txToDelete = transactions.find((t) => t.id === deleteId.id);
    if (!txToDelete) return;
    const result = await deleteTransaction(deleteId.id, txToDelete);
    setIsDeleting(false);
    if (result.success) {
      toast.success("Transaksi dihapus");

      // Instant Update: Remove from local store
      const currentTransactions = useAppStore.getState().transactions;
      const txToDelete = currentTransactions.find((t) => t.id === deleteId.id);

      if (txToDelete) {
        // --- REVERT ASSET BALANCE ---
        const currentAssets = useAppStore.getState().assets;
        const amountToRevert =
          txToDelete.jenis === "pemasukan"
            ? -txToDelete.jumlah
            : txToDelete.jumlah;

        const updatedAssets = currentAssets.map((asset) => {
          if (asset.nama === txToDelete.dompet) {
            return { ...asset, nilai: asset.nilai + amountToRevert };
          }
          return asset;
        });
        useAppStore.getState().setAssets(updatedAssets);
        // ----------------------------
      }

      const updated = currentTransactions.filter((t) => t.id !== deleteId.id);
      useAppStore.getState().setTransactions(updated);

      // Trigger background sync for assets
      window.dispatchEvent(new Event("focus"));

      setDeleteId(null);
      onRefresh();
    } else {
      toast.error(result.error || "Gagal menghapus");
    }
  };

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="Belum ada transaksi"
        description="Gunakan tombol + untuk menambahkan transaksi pertama"
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Search Bar & Filter */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          background: "var(--color-surface)",
          padding: "1.25rem",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Custom Date Filter Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.875rem",
          }}
        >
          {/* Month Custom Select */}
          <div style={{ position: "relative" }}>
            <div
              className="input"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
                padding: "0.625rem 1rem",
              }}
              onClick={() => {
                const el = document.getElementById("month-dropdown");
                if (el)
                  el.style.display =
                    el.style.display === "none" ? "block" : "none";
                const yr = document.getElementById("year-dropdown");
                if (yr) yr.style.display = "none";
              }}
            >
              {
                [
                  "Januari",
                  "Februari",
                  "Maret",
                  "April",
                  "Mei",
                  "Juni",
                  "Juli",
                  "Agustus",
                  "September",
                  "Oktober",
                  "November",
                  "Desember",
                ][selectedMonth]
              }
              <span style={{ fontSize: "0.6rem", opacity: 0.5 }}>▼</span>
            </div>
            <div
              id="month-dropdown"
              className="card"
              style={{
                display: "none",
                position: "absolute",
                top: "calc(100% + 0.5rem)",
                left: 0,
                right: 0,
                zIndex: 100,
                maxHeight: "240px",
                overflowY: "auto",
                padding: "0.5rem",
                boxShadow: "var(--shadow-xl)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              {[
                "Januari",
                "Februari",
                "Maret",
                "April",
                "Mei",
                "Juni",
                "Juli",
                "Agustus",
                "September",
                "Oktober",
                "November",
                "Desember",
              ].map((m, i) => (
                <div
                  key={m}
                  onClick={() => {
                    setSelectedMonth(i);
                    document.getElementById("month-dropdown")!.style.display =
                      "none";
                  }}
                  style={{
                    padding: "0.625rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.8125rem",
                    fontWeight: selectedMonth === i ? 700 : 500,
                    color:
                      selectedMonth === i
                        ? "var(--color-primary)"
                        : "var(--color-text)",
                    background:
                      selectedMonth === i
                        ? "var(--color-primary-bg)"
                        : "transparent",
                    cursor: "pointer",
                    transition: "all 0.1s ease",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background =
                      "var(--color-surface-offset)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background =
                      selectedMonth === i
                        ? "var(--color-primary-bg)"
                        : "transparent")
                  }
                >
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* Year Custom Select */}
          <div style={{ position: "relative" }}>
            <div
              className="input"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
                padding: "0.625rem 1rem",
              }}
              onClick={() => {
                const el = document.getElementById("year-dropdown");
                if (el)
                  el.style.display =
                    el.style.display === "none" ? "block" : "none";
                const mo = document.getElementById("month-dropdown");
                if (mo) mo.style.display = "none";
              }}
            >
              {selectedYear}
              <span style={{ fontSize: "0.6rem", opacity: 0.5 }}>▼</span>
            </div>
            <div
              id="year-dropdown"
              className="card"
              style={{
                display: "none",
                position: "absolute",
                top: "calc(100% + 0.5rem)",
                left: 0,
                right: 0,
                zIndex: 100,
                padding: "0.5rem",
                boxShadow: "var(--shadow-xl)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              {Array.from(
                { length: 5 },
                (_, i) => now.getFullYear() - 2 + i,
              ).map((y) => (
                <div
                  key={y}
                  onClick={() => {
                    setSelectedYear(y);
                    document.getElementById("year-dropdown")!.style.display =
                      "none";
                  }}
                  style={{
                    padding: "0.625rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.8125rem",
                    fontWeight: selectedYear === y ? 700 : 500,
                    color:
                      selectedYear === y
                        ? "var(--color-primary)"
                        : "var(--color-text)",
                    background:
                      selectedYear === y
                        ? "var(--color-primary-bg)"
                        : "transparent",
                    cursor: "pointer",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background =
                      "var(--color-surface-offset)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background =
                      selectedYear === y
                        ? "var(--color-primary-bg)"
                        : "transparent")
                  }
                >
                  {y}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-faint)",
            }}
          />
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 2.75rem",
              background: "var(--color-surface-offset)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              fontSize: "0.875rem",
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            background: "var(--color-surface-offset)",
            padding: "0.25rem",
            borderRadius: "var(--radius-lg)",
            gap: "0.25rem",
          }}
        >
          {(["all", "pemasukan", "pengeluaran"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background:
                  typeFilter === type ? "var(--color-surface)" : "transparent",
                color:
                  typeFilter === type
                    ? type === "all"
                      ? "var(--color-primary)"
                      : type === "pemasukan"
                        ? "var(--color-income)"
                        : "var(--color-expense)"
                    : "var(--color-text-muted)",
                boxShadow: typeFilter === type ? "var(--shadow-sm)" : "none",
                transition: "all 0.2s ease",
                textTransform: "capitalize",
              }}
            >
              {type === "all" ? "Semua" : type}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Grouped Transaction List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem 1rem",
              color: "var(--color-text-muted)",
              background: "var(--color-surface-offset)",
              borderRadius: "var(--radius-xl)",
              border: "1px dashed var(--color-border)",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔍</div>
            <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>
              Tidak ada transaksi untuk periode ini
            </p>
          </div>
        ) : (
          (() => {
            // Group transactions by date
            const groups: Record<string, Transaction[]> = {};
            filtered.forEach((tx) => {
              const dateKey = tx.tanggal;
              if (!groups[dateKey]) groups[dateKey] = [];
              groups[dateKey].push(tx);
            });

            const sortedDates = Object.keys(groups).sort(
              (a, b) => new Date(b).getTime() - new Date(a).getTime(),
            );

            const isToday = (d: string) =>
              d === now.toISOString().split("T")[0];
            const isYesterday = (d: string) => {
              const yesterday = new Date(now);
              yesterday.setDate(yesterday.getDate() - 1);
              return d === yesterday.toISOString().split("T")[0];
            };

            return sortedDates.map((date) => {
              const dayTransactions = groups[date];
              const totalDayExpense = dayTransactions
                .filter((tx) => tx.jenis === "pengeluaran")
                .reduce((sum, tx) => sum + tx.jumlah, 0);
              const totalDayIncome = dayTransactions
                .filter((tx) => tx.jenis === "pemasukan")
                .reduce((sum, tx) => sum + tx.jumlah, 0);

              return (
                <div
                  key={date}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {/* Date Header */}
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
                      {isToday(date)
                        ? "Hari Ini"
                        : isYesterday(date)
                          ? "Kemarin"
                          : formatDate(date)}
                    </h5>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
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
                      <div
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: "var(--color-text-faint)",
                          marginLeft: "0.25rem",
                        }}
                      >
                        {dayTransactions.length} Tx
                      </div>
                    </div>
                  </div>

                  {/* Group Items */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    {dayTransactions.map((tx) => {
                      const isIncome = tx.jenis === "pemasukan";
                      const catColor =
                        CATEGORY_COLORS[tx.kategori] || "var(--color-primary)";
                      const realIdx = transactions.findIndex(
                        (t) => t.id === tx.id,
                      );

                      return (
                        <div
                          key={tx.id}
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
                          {/* Category Icon */}
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

                          {/* Info */}
                          <div
                            style={{
                              flex: 1,
                              minWidth: 0,
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.25rem",
                            }}
                          >
                            {/* Row 1: Description & Wallet */}
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

                            {/* Row 2: Category & Amount */}
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
                                  color: isIncome
                                    ? "var(--color-income)"
                                    : "var(--color-expense)",
                                }}
                              >
                                {isIncome ? "+" : "-"}
                                {isPrivateMode
                                  ? "Rp ••••••"
                                  : formatCurrency(tx.jumlah)}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: "flex", gap: "0.125rem" }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditData({ tx, idx: realIdx })}
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
                              onClick={() =>
                                setDeleteId({ id: tx.id, idx: realIdx })
                              }
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
                    })}
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editData}
        onClose={() => setEditData(null)}
        title="Edit Transaksi"
      >
        {editData && (
          <TransactionForm
            initialData={editData.tx}
            rowIndex={editData.idx}
            onSuccess={() => {
              setEditData(null);
              onRefresh();
            }}
          />
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Hapus Transaksi"
        footer={
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              width: "100%",
            }}
          >
            <Button
              variant="secondary"
              onClick={() => setDeleteId(null)}
              fullWidth
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={isDeleting}
              fullWidth
            >
              Ya, Hapus
            </Button>
          </div>
        }
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "1rem",
            padding: "0.5rem 0",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--color-expense-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-expense)",
              marginBottom: "0.5rem",
            }}
          >
            <AlertTriangle size={28} />
          </div>
          <div>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "var(--color-text)",
                marginBottom: "0.5rem",
              }}
            >
              Konfirmasi Hapus
            </h3>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "var(--color-text-muted)",
                lineHeight: 1.5,
              }}
            >
              Yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat
              dibatalkan.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
