"use client";
import React, { useState, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { Transaction, AppSettings } from "@/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { deleteTransaction } from "@/app/actions/transactions";
import { useAppStore } from "@/store/useAppStore";
import { useSearchParams } from "next/navigation";
import { TransactionForm } from "./TransactionForm";
import toast from "react-hot-toast";
import { useTranslation } from "@/lib/i18n/useTranslation";

// Sub-components
import { TransactionFilter } from "./table/TransactionFilter";
import { TransactionGroup } from "./table/TransactionGroup";

interface TransactionTableProps {
  transactions: Transaction[];
  onRefresh: () => void;
  initialSettings?: Partial<AppSettings>;
}

export function TransactionTable({
  transactions,
  onRefresh,
  initialSettings,
}: TransactionTableProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type");

  const now = new Date();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [editData, setEditData] = useState<{ tx: Transaction; idx: number } | null>(null);
  const [deleteId, setDeleteId] = useState<{ id: string; idx: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "pemasukan" | "pengeluaran">(
    initialType === "pemasukan" || initialType === "pengeluaran" ? initialType : "all"
  );

  // Sync typeFilter if URL param changes
  const [prevInitialType, setPrevInitialType] = useState(initialType);
  if (initialType !== prevInitialType) {
    setPrevInitialType(initialType);
    setTypeFilter(initialType === "pemasukan" || initialType === "pengeluaran" ? initialType : "all");
  }

  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => {
        const txDate = new Date(tx.tanggal);
        const matchesDate = txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;
        const matchesSearch =
          tx.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.dompet.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === "all" || tx.jenis === typeFilter;
        return matchesDate && matchesSearch && matchesType;
      })
      .reverse();
  }, [transactions, searchTerm, typeFilter, selectedMonth, selectedYear]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const txToDelete = transactions.find((t) => t.id === deleteId.id);
    if (!txToDelete) return;
    
    const result = await deleteTransaction(deleteId.id, txToDelete);
    setIsDeleting(false);
    
    if (result.success) {
      toast.success(t("transactions.success_delete"));
      
      // Instant Update State
      const currentTransactions = useAppStore.getState().transactions;
      const tx = currentTransactions.find((t) => t.id === deleteId.id);
      if (tx) {
        const currentAssets = useAppStore.getState().assets;
        const amountToRevert = tx.jenis === "pemasukan" ? -tx.jumlah : tx.jumlah;
        const updatedAssets = currentAssets.map((asset) => 
          asset.nama === tx.dompet ? { ...asset, nilai: asset.nilai + amountToRevert } : asset
        );
        useAppStore.getState().setAssets(updatedAssets);
      }
      
      useAppStore.getState().setTransactions(currentTransactions.filter((t) => t.id !== deleteId.id));
      window.dispatchEvent(new Event("focus")); // Trigger background sync
      setDeleteId(null);
      onRefresh();
    } else {
      toast.error(result.error || t("common.error"));
    }
  };

  // Grouping for render
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach((tx) => {
      const dateKey = tx.tanggal;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    });
    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(date => ({ date, items: groups[date] }));
  }, [filtered]);

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title={t("transactions.empty_state")}
        description={t("transactions.subtitle")}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <TransactionFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {groupedTransactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-muted)", background: "var(--color-surface-offset)", borderRadius: "var(--radius-xl)", border: "1px dashed var(--color-border)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔍</div>
            <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>{t("common.no_data")}</p>
          </div>
        ) : (
          groupedTransactions.map(({ date, items }) => (
            <TransactionGroup
              key={date}
              date={date}
              dayTransactions={items}
              transactions={transactions}
              onEdit={(tx, idx) => setEditData({ tx, idx })}
              onDelete={(id, idx) => setDeleteId({ id, idx })}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={!!editData} onClose={() => setEditData(null)} title={t("common.edit")}>
        {editData && (
          <TransactionForm
            initialData={editData.tx}
            rowIndex={editData.idx}
            initialSettings={initialSettings}
            onSuccess={() => { setEditData(null); onRefresh(); }}
          />
        )}
      </Modal>

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t("common.delete")}
        footer={
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", width: "100%" }}>
            <Button variant="secondary" onClick={() => setDeleteId(null)} fullWidth>{t("common.cancel")}</Button>
            <Button variant="danger" onClick={handleDelete} loading={isDeleting} fullWidth>{t("common.delete")}</Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem", padding: "0.5rem 0" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-expense-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-expense)", marginBottom: "0.5rem" }}>
            <AlertTriangle size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.25rem" }}>{t("common.delete")}?</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>{t("common.no_data")}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
