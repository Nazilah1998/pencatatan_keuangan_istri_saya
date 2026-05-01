"use client";
import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  getSavings,
  deleteSavings,
  addFundsToSavings,
} from "@/app/actions/savings";
import { SavingsGoalCard } from "@/components/tabungan/SavingsGoalCard";
import { SavingsForm } from "@/components/tabungan/SavingsForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { SavingsGoal } from "@/types";
import toast from "react-hot-toast";

export default function TabunganPage() {
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<{ id: string; idx: number } | null>(
    null,
  );

  // Add funds modal state
  const [addFundsGoal, setAddFundsGoal] = useState<{
    goal: SavingsGoal;
    idx: number;
  } | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [isAddingFunds, setIsAddingFunds] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const res = await getSavings();
    if (res.success && res.data) setSavings(res.data);
    setLoading(false);
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchData());
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteSavings(deleteId.id, deleteId.idx);
    if (result.success) {
      toast.success("Tabungan dihapus");
      setDeleteId(null);
      fetchData();
    } else {
      toast.error("Gagal menghapus");
    }
  };

  const handleAddFunds = async () => {
    if (!addFundsGoal || !addAmount) return;
    const amount = Number(addAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Nominal tidak valid");
      return;
    }

    setIsAddingFunds(true);
    const result = await addFundsToSavings(
      addFundsGoal.goal.id,
      addFundsGoal.idx,
      addFundsGoal.goal.jumlah_terkumpul,
      amount,
    );
    setIsAddingFunds(false);

    if (result.success) {
      toast.success("Dana berhasil ditambahkan");
      setAddFundsGoal(null);
      setAddAmount("");
      fetchData();
    } else {
      toast.error("Gagal menambah dana");
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
            Target Tabungan
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Pantau progress menabungmu
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus size={16} /> Buat Target
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
        </div>
      ) : savings.length === 0 ? (
        <EmptyState
          icon="🐷"
          title="Belum ada target tabungan"
          description="Mulai menabung untuk masa depan yang lebih baik"
          actionLabel="Buat Target"
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
          {savings.map((s, idx) => (
            <SavingsGoalCard
              key={s.id}
              goal={s}
              onDelete={() => setDeleteId({ id: s.id, idx })}
              onAddFunds={() => setAddFundsGoal({ goal: s, idx })}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Target Tabungan"
      >
        <SavingsForm
          onSuccess={() => {
            setIsModalOpen(false);
            fetchData();
          }}
        />
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Hapus Tabungan"
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
        <p>Yakin ingin menghapus target tabungan ini?</p>
      </Modal>

      {/* Add Funds Modal */}
      <Modal
        isOpen={!!addFundsGoal}
        onClose={() => {
          setAddFundsGoal(null);
          setAddAmount("");
        }}
        title="Tambah Dana"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setAddFundsGoal(null);
                setAddAmount("");
              }}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleAddFunds}
              loading={isAddingFunds}
            >
              Simpan
            </Button>
          </>
        }
      >
        {addFundsGoal && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <p>
              Tambah dana untuk:{" "}
              <strong>{addFundsGoal.goal.nama_tujuan}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">Nominal (Rp)</label>
              <input
                type="number"
                className="input"
                placeholder="0"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
