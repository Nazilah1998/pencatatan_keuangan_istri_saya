"use client";
import React, { useEffect, useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
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

import { createClient } from "@/lib/supabase/client";

export default function AnggaranPage() {
  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<{ id: string; idx: number } | null>(
    null,
  );
  const supabase = createClient();

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
    const result = await deleteBudget(deleteId.id);
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
            Anggaran Bulanan
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
              marginTop: "0.25rem",
            }}
          >
            Pantau dan batasi pengeluaran per kategori
          </p>
        </div>
        <Button
          onClick={async () => {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
              toast.error("Silakan login untuk menambah anggaran");
              window.location.href = "/login";
              return;
            }
            setIsModalOpen(true);
          }}
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
            <Button variant="danger" onClick={handleDelete} fullWidth>
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
              Yakin ingin menghapus anggaran ini? Tindakan ini tidak dapat
              dibatalkan.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
