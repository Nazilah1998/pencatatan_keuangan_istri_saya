"use client";
import React, { useState, useMemo } from "react";
import { Trash2, Pencil, Search, AlertTriangle } from "lucide-react";
import { Transaction } from "@/types";
import { Badge } from "@/components/ui/Badge";
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
  const { settings } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
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
        const matchesSearch =
          tx.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.dompet.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === "all" || tx.jenis === typeFilter;

        return matchesSearch && matchesType;
      })
      .reverse(); // Newest first
  }, [transactions, searchTerm, typeFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const result = await deleteTransaction(
      deleteId.id,
      deleteId.idx,
      settings.google_sheet_id,
      settings.sheet_tabs.transaksi,
    );
    setIsDeleting(false);
    if (result.success) {
      toast.success("Transaksi dihapus");
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
          padding: "1rem",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
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

      {/* Modern Transaction List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "var(--color-text-muted)",
            }}
          >
            Tidak ada transaksi yang sesuai pencarian
          </div>
        ) : (
          filtered.map((tx, idx) => {
            const isIncome = tx.jenis === "pemasukan";
            const catColor =
              CATEGORY_COLORS[tx.kategori] || "var(--color-primary)";
            // Correct real index in the original array (since we reversed for display)
            const realIdx = transactions.length - 1 - idx;

            return (
              <div
                key={tx.id}
                className="card"
                style={{
                  padding: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "default",
                }}
              >
                {/* Category Icon/Circle */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "var(--radius-lg)",
                    background: `${catColor}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                    flexShrink: 0,
                    border: `1px solid ${catColor}30`,
                  }}
                >
                  {isIncome ? "📈" : "📉"}
                </div>

                {/* Main Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "0.9375rem",
                        fontWeight: 700,
                        color: "var(--color-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tx.deskripsi || tx.kategori}
                    </h4>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 800,
                        fontSize: "0.9375rem",
                        color: isIncome
                          ? "var(--color-income)"
                          : "var(--color-expense)",
                        marginLeft: "0.5rem",
                      }}
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(tx.jumlah)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                        fontWeight: 500,
                      }}
                    >
                      {formatDate(tx.tanggal)}
                    </span>
                    <div
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: "50%",
                        background: "var(--color-text-faint)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {tx.dompet}
                    </span>
                    <Badge
                      variant={isIncome ? "income" : "expense"}
                      style={{ fontSize: "0.625rem", padding: "0.1rem 0.4rem" }}
                    >
                      {tx.kategori}
                      {tx.sub_kategori && ` • ${tx.sub_kategori}`}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditData({ tx, idx: realIdx })}
                    style={{
                      color: "var(--color-text-muted)",
                      width: 32,
                      height: 32,
                    }}
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId({ id: tx.id, idx: realIdx })}
                    style={{
                      color: "var(--color-expense)",
                      width: 32,
                      height: 32,
                    }}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            );
          })
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
