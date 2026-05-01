"use client";
import React from "react";
import { Trash2, Plus } from "lucide-react";
import { SavingsGoal } from "@/types";
import { formatCurrency, calcPercentage, daysUntil } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onAddFunds: () => void;
  onDelete: () => void;
}

export const SavingsGoalCard = React.memo(function SavingsGoalCard({
  goal,
  onAddFunds,
  onDelete,
}: SavingsGoalCardProps) {
  const pct = calcPercentage(goal.jumlah_terkumpul, goal.target_jumlah);
  const remainingDays = daysUntil(goal.target_tanggal);
  const isCompleted = pct >= 100 || goal.status === "tercapai";

  return (
    <div
      className="card"
      style={{
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: `${goal.warna}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              flexShrink: 0,
            }}
          >
            {goal.ikon}
          </div>
          <div>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--color-text)",
              }}
            >
              {goal.nama_tujuan}
            </h3>
            {remainingDays > 0 && !isCompleted ? (
              <span
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                }}
              >
                Sisa {remainingDays} hari
              </span>
            ) : isCompleted ? (
              <span
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-income)",
                  fontWeight: 600,
                }}
              >
                Tercapai 🎉
              </span>
            ) : (
              <span
                style={{ fontSize: "0.8125rem", color: "var(--color-expense)" }}
              >
                Terlewat {Math.abs(remainingDays)} hari
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          style={{
            color: "var(--color-expense)",
            minWidth: 32,
            height: 32,
            padding: 0,
          }}
        >
          <Trash2 size={16} />
        </Button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: "1.25rem",
              color: goal.warna,
            }}
          >
            {formatCurrency(goal.jumlah_terkumpul)}
          </span>
          <span
            style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}
          >
            Target: {formatCurrency(goal.target_jumlah)}
          </span>
        </div>

        <div className="progress-bar" style={{ height: 12 }}>
          <div
            className="progress-bar-fill"
            style={{
              width: `${pct}%`,
              background: isCompleted ? "var(--color-income)" : goal.warna,
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--color-text)",
            }}
          >
            {pct}%
          </span>
        </div>
      </div>

      {!isCompleted && (
        <Button
          variant="secondary"
          onClick={onAddFunds}
          style={{
            width: "100%",
            marginTop: "auto",
            background: `${goal.warna}10`,
            color: goal.warna,
            borderColor: `${goal.warna}30`,
          }}
        >
          <Plus size={16} style={{ marginRight: "0.25rem" }} /> Tambah Dana
        </Button>
      )}
    </div>
  );
});
