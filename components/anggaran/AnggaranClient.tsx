"use client";
import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { getBudgets, deleteBudget } from "@/app/actions/budgets";
import { getTransactions } from "@/app/actions/transactions";
import { BudgetCard } from "@/components/anggaran/BudgetCard";
import { BudgetForm } from "@/components/anggaran/BudgetForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { BudgetEntry, Transaction } from "@/types";
import toast from "react-hot-toast";
import { BudgetHeader } from "@/components/anggaran/sections/BudgetHeader";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface AnggaranClientProps {
  initialBudgets: BudgetEntry[];
  initialTransactions: Transaction[];
}

export function AnggaranClient({
  initialBudgets,
  initialTransactions,
}: AnggaranClientProps) {
  const { t } = useTranslation();
  const [budgets, setBudgets] = useState<BudgetEntry[]>(initialBudgets);

  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<{ id: string; idx: number } | null>(
    null,
  );

  const refreshData = async () => {
    const [bRes, tRes] = await Promise.all([getBudgets(), getTransactions()]);
    if (bRes.success && bRes.data) setBudgets(bRes.data);
    if (tRes.success && tRes.data) setTransactions(tRes.data);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteBudget(deleteId.id);
    if (result.success) {
      toast.success(t("common.success"));
      setDeleteId(null);
      refreshData();
    } else {
      toast.error(t("common.error"));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <BudgetHeader onAdd={() => setIsModalOpen(true)} />

      {budgets.length === 0 ? (
        <EmptyState
          icon="🎯"
          title={t("budget.empty_title")}
          description={t("budget.subtitle")}
          actionLabel={t("budget.add_button")}
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
        title={t("budget.form.title")}
      >
        <BudgetForm
          onSuccess={() => {
            setIsModalOpen(false);
            refreshData();
          }}
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
              {t("common.delete")}?
            </h3>
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
        </div>
      </Modal>
    </div>
  );
}
