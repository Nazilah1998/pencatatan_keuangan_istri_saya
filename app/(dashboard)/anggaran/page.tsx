"use client";
import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getBudgets, deleteBudget } from "@/app/actions/budgets";
import { getTransactions } from "@/app/actions/transactions";
import { BudgetCard } from "@/components/anggaran/BudgetCard";
import { BudgetForm } from "@/components/anggaran/BudgetForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { BudgetEntry, Transaction } from "@/types";
import toast from "react-hot-toast";

export default function AnggaranPage() {
  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<{ id: string; idx: number } | null>(
    null,
  );

  const fetchData = React.useCallback(async () => {
    const [bRes, tRes] = await Promise.all([getBudgets(), getTransactions()]);
    setBudgets(bRes.success && bRes.data ? bRes.data : []);
    setTransactions(tRes.success && tRes.data ? tRes.data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => fetchData());
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteBudget(deleteId.id, deleteId.idx);
    if (result.success) {
      toast.success("Anggaran dihapus");
      setDeleteId(null);
      setLoading(true);
      fetchData();
    } else {
      toast.error("Gagal menghapus");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
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
            Anggaran Bulanan
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Pantau batas pengeluaran per kategori
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus size={16} /> Tambah Anggaran
        </Button>
      </div>

      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1rem",
          }}
        >
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="Belum ada anggaran"
          description="Tetapkan batas pengeluaran untuk mengontrol keuanganmu"
          actionLabel="Buat Anggaran"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1rem",
          }}
        >
          {budgets.map((b, idx) => (
            <BudgetCard
              key={b.id}
              budget={b}
              transactions={transactions}
              onDelete={() => setDeleteId({ id: b.id, idx })}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Anggaran"
      >
        <BudgetForm
          onSuccess={() => {
            setIsModalOpen(false);
            setLoading(true);
            fetchData();
          }}
        />
      </Modal>

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Hapus Anggaran"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p>Yakin ingin menghapus anggaran ini?</p>
      </Modal>
    </div>
  );
}
