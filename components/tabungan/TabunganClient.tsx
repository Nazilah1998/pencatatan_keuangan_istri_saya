"use client";
import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  deleteSavings,
  addFundsToSavings,
  getSavings,
} from "@/app/actions/savings";
import { SavingsGoalCard } from "@/components/tabungan/SavingsGoalCard";
import { SavingsForm } from "@/components/tabungan/SavingsForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { SavingsGoal } from "@/types";
import toast from "react-hot-toast";
import { SavingsHeader } from "@/components/tabungan/sections/SavingsHeader";
import { useTranslation } from "@/lib/i18n/useTranslation";

import { useAppStore } from "@/store/useAppStore";

interface TabunganClientProps {
  initialGoals: SavingsGoal[];
}

export function TabunganClient({ initialGoals }: TabunganClientProps) {
  const { t } = useTranslation();
  const { settings } = useAppStore();
  const wallets = settings.custom_wallets || [];

  const [goals, setGoals] = useState<SavingsGoal[]>(initialGoals);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<{
    goal: SavingsGoal;
    idx: number;
  } | null>(null);
  const [addFundsId, setAddFundsId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState(0);
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const refreshData = async () => {
    const res = await getSavings();
    if (res.success && res.data) setGoals(res.data);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteSavings(deleteId);
    if (result.success) {
      toast.success(t("common.success"));
      setDeleteId(null);
      refreshData();
    } else {
      toast.error(t("common.error"));
    }
  };

  const handleAddFunds = async () => {
    if (!addFundsId || fundAmount <= 0) return;
    const walletParam = selectedWallet === "" ? undefined : selectedWallet;
    const result = await addFundsToSavings(addFundsId, fundAmount, walletParam);
    if (result.success) {
      toast.success(t("common.success"));
      setAddFundsId(null);
      setFundAmount(0);
      setSelectedWallet("");
      refreshData();
    } else {
      toast.error(t("common.error"));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <SavingsHeader onAdd={() => setIsModalOpen(true)} />

      {goals.length === 0 ? (
        <EmptyState
          icon="🎯"
          title={t("savings.empty_title")}
          description={t("savings.empty_subtitle")}
          actionLabel={t("savings.add_button")}
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
          {goals.map((goal, idx) => (
            <SavingsGoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => setEditGoal({ goal, idx })}
              onAddFunds={() => setAddFundsId(goal.id)}
              onDelete={() => setDeleteId(goal.id)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen || !!editGoal}
        onClose={() => {
          setIsModalOpen(false);
          setEditGoal(null);
        }}
        title={editGoal ? t("common.edit") : t("savings.add_button")}
      >
        <SavingsForm
          initialData={editGoal?.goal}
          rowIndex={editGoal?.idx}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditGoal(null);
            refreshData();
          }}
        />
      </Modal>

      <Modal
        isOpen={!!addFundsId}
        onClose={() => {
          setAddFundsId(null);
          setFundAmount(0);
          setSelectedWallet("");
        }}
        title={t("savings.add_funds")}
        footer={
          <Button onClick={handleAddFunds} fullWidth disabled={fundAmount <= 0}>
            {t("common.save")}
          </Button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <CurrencyInput
            label={t("savings.fund_amount")}
            value={fundAmount}
            onChange={setFundAmount}
            autoFocus
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {t("transactions.form.select_wallet") || "Pilih Dompet Sumber"}
            </label>
            <select
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                fontSize: "0.875rem",
                outline: "none",
                background: "var(--color-surface-offset)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                color: "var(--color-text)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <option value="">🚫 {t("settings.wallet.others") || "Hanya Catatan (Tidak Memotong Dompet)"}</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.name}>
                  {w.icon || "💰"} {w.name}
                </option>
              ))}
            </select>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", lineHeight: 1.4, margin: 0 }}>
              {selectedWallet
                ? `Saldo di dompet "${selectedWallet}" akan otomatis terpotong dan tercatat sebagai pengeluaran.`
                : "Hanya menambah target tabungan tanpa memotong saldo di dompet manapun."}
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t("common.delete")}
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
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={handleDelete} fullWidth>
              {t("common.delete")}
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
            }}
          >
            <AlertTriangle size={28} />
          </div>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--color-text-muted)",
              lineHeight: 1.5,
            }}
          >
            {t("common.delete_confirm_desc")}
          </p>
        </div>
      </Modal>
    </div>
  );
}
