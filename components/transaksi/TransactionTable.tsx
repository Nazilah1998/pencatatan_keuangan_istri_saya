"use client";
import React, { useState, useMemo } from "react";
import { Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Transaction } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { deleteTransaction } from "@/app/actions/transactions";
import { useAppStore } from "@/store/useAppStore";
import toast from "react-hot-toast";

interface TransactionTableProps {
  transactions: Transaction[];
  onRefresh: () => void;
}

type SortKey = "tanggal" | "jumlah" | "kategori" | "dompet";
type SortDir = "asc" | "desc";

export function TransactionTable({
  transactions,
  onRefresh,
}: TransactionTableProps) {
  const { settings } = useAppStore();
  const [sortKey, setSortKey] = useState<SortKey>("tanggal");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [deleteId, setDeleteId] = useState<{ id: string; idx: number } | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const sorted = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [transactions, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

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

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortDir === "asc" ? (
        <ChevronUp size={13} />
      ) : (
        <ChevronDown size={13} />
      )
    ) : null;

  const thStyle: React.CSSProperties = {
    padding: "0.625rem 1rem",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "var(--color-text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    background: "var(--color-surface-offset)",
  };

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="Belum ada transaksi"
        description="Gunakan tombol + untuk menambahkan transaksi pertama"
      />
    );
  }

  return (
    <>
      <div
        style={{
          overflowX: "auto",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border)",
        }}
      >
        <table
          style={{ width: "100%", borderCollapse: "collapse" }}
          className="table-responsive-card"
        >
          <thead>
            <tr>
              {(
                [
                  ["tanggal", "Tanggal"],
                  ["kategori", "Kategori"],
                  ["dompet", "Dompet"],
                  ["jumlah", "Jumlah"],
                ] as [SortKey, string][]
              ).map(([key, label]) => (
                <th key={key} style={thStyle} onClick={() => handleSort(key)}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    {label} <SortIcon col={key} />
                  </span>
                </th>
              ))}
              <th style={{ ...thStyle, cursor: "default" }}>Keterangan</th>
              <th style={{ ...thStyle, cursor: "default", textAlign: "right" }}>
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((tx, idx) => {
              const isIncome = tx.jenis === "pemasukan";
              const isTransfer = tx.jenis === "transfer";
              return (
                <tr
                  key={tx.id}
                  style={{
                    borderTop: "1px solid var(--color-divider)",
                    transition: "background var(--transition)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--color-surface-offset)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "";
                  }}
                >
                  <td
                    data-label="Tanggal"
                    style={{
                      padding: "0.875rem 1rem",
                      fontSize: "0.875rem",
                      color: "var(--color-text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(tx.tanggal, "dd MMM yyyy")}
                  </td>
                  <td
                    data-label="Kategori"
                    style={{ padding: "0.875rem 1rem" }}
                  >
                    <Badge
                      variant={
                        isIncome ? "income" : isTransfer ? "saving" : "expense"
                      }
                    >
                      {tx.kategori}
                    </Badge>
                  </td>
                  <td
                    data-label="Dompet"
                    style={{
                      padding: "0.875rem 1rem",
                      fontSize: "0.875rem",
                      color: "var(--color-text)",
                    }}
                  >
                    {tx.dompet}
                  </td>
                  <td
                    data-label="Jumlah"
                    style={{ padding: "0.875rem 1rem", whiteSpace: "nowrap" }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                        color: isIncome
                          ? "var(--color-income)"
                          : isTransfer
                            ? "var(--color-saving)"
                            : "var(--color-expense)",
                      }}
                    >
                      {isIncome ? "+" : isTransfer ? "" : "-"}
                      {formatCurrency(tx.jumlah)}
                    </span>
                  </td>
                  <td
                    data-label="Keterangan"
                    style={{
                      padding: "0.875rem 1rem",
                      fontSize: "0.875rem",
                      color: "var(--color-text-muted)",
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tx.deskripsi || "-"}
                  </td>
                  <td
                    data-label="Aksi"
                    style={{ padding: "0.875rem 1rem", textAlign: "right" }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId({ id: tx.id, idx })}
                      aria-label="Hapus transaksi"
                      style={{
                        color: "var(--color-expense)",
                        minWidth: 36,
                        height: 36,
                      }}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Hapus Transaksi"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={isDeleting}
            >
              Hapus
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--color-text-muted)", lineHeight: 1.6 }}>
          Yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat
          dibatalkan dan data akan dihapus dari Google Sheets.
        </p>
      </Modal>
    </>
  );
}
