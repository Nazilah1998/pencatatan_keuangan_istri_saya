"use client";
import React, { useEffect, useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import {
  getSavings,
  deleteSavings,
  addFundsToSavings,
} from "@/app/actions/savings";
import { getAssets } from "@/app/actions/assets";

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
  const [editGoal, setEditGoal] = useState<{
    goal: SavingsGoal;
    idx: number;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<{ id: string; idx: number } | null>(
    null,
  );

  // Add funds modal state
  const [addFundsGoal, setAddFundsGoal] = useState<{
    goal: SavingsGoal;
    idx: number;
  } | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("Cash");
  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [assets, setAssets] = useState<{ nama: string }[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const [sRes, aRes] = await Promise.all([getSavings(), getAssets()]);
    if (sRes.success && sRes.data) setSavings(sRes.data);
    if (aRes.success && aRes.data) setAssets(aRes.data);
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
      selectedWallet,
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

  const openEdit = (goal: SavingsGoal, idx: number) => {
    setEditGoal({ goal, idx });
    setIsModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setEditGoal(null);
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
            Target Tabungan
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
              marginTop: "0.25rem",
            }}
          >
            Pantau progress menabungmu untuk masa depan
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
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
            gap: "1.25rem",
          }}
        >
          {savings.map((s, idx) => (
            <SavingsGoalCard
              key={s.id}
              goal={s}
              onEdit={() => openEdit(s, idx)}
              onDelete={() => setDeleteId({ id: s.id, idx })}
              onAddFunds={() => setAddFundsGoal({ goal: s, idx })}
            />
          ))}
        </div>
      )}

      {/* Form Modal (Create/Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModals}
        title={editGoal ? "Edit Target Tabungan" : "Buat Target Tabungan"}
      >
        <SavingsForm
          initialData={editGoal?.goal}
          rowIndex={editGoal?.idx}
          onSuccess={() => {
            closeModals();
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
              Yakin ingin menghapus target tabungan ini? Progress menabung Anda
              untuk tujuan ini akan hilang.
            </p>
          </div>
        </div>
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
              <label className="form-label">Sumber Dana (Dompet)</label>
              <select
                className="input"
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
              >
                {assets.length > 0 ? (
                  assets.map((a) => (
                    <option key={a.nama} value={a.nama}>
                      {a.nama}
                    </option>
                  ))
                ) : (
                  <option value="Cash">Cash</option>
                )}
              </select>
            </div>
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
