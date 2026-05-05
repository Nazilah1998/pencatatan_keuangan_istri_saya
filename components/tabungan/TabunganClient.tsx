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

interface TabunganClientProps {
  initialGoals: SavingsGoal[];
}

export function TabunganClient({ initialGoals }: TabunganClientProps) {
  const { t } = useTranslation();
  const [goals, setGoals] = useState<SavingsGoal[]>(initialGoals);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<{
    goal: SavingsGoal;
    idx: number;
  } | null>(null);
  const [addFundsId, setAddFundsId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState(0);
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
    const result = await addFundsToSavings(addFundsId, fundAmount);
    if (result.success) {
      toast.success(t("common.success"));
      setAddFundsId(null);
      setFundAmount(0);
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
        }}
        title={t("savings.add_funds")}
        footer={
          <Button onClick={handleAddFunds} fullWidth disabled={fundAmount <= 0}>
            {t("common.save")}
          </Button>
        }
      >
        <CurrencyInput
          label={t("savings.fund_amount")}
          value={fundAmount}
          onChange={setFundAmount}
          autoFocus
        />
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
