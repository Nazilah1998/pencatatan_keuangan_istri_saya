"use client";
import React from "react";
import { Trash2, Plus, Pencil } from "lucide-react";
import { SavingsGoal } from "@/types";
import { formatCurrency, calcPercentage, daysUntil } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onEdit: () => void;
  onAddFunds: () => void;
  onDelete: () => void;
}

export const SavingsGoalCard = React.memo(function SavingsGoalCard({
  goal,
  onEdit,
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
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        position: "relative",
        overflow: "hidden",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
      }}
    >
      {/* Top Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "var(--radius-xl)",
              background: `${goal.warna}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
              flexShrink: 0,
              border: `1px solid ${goal.warna}30`,
            }}
          >
            {goal.ikon}
          </div>
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                fontSize: "1.0625rem",
                fontWeight: 800,
                color: "var(--color-text)",
                marginBottom: "0.25rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {goal.nama_tujuan}
            </h3>
            {remainingDays > 0 && !isCompleted ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--color-warning)",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    fontWeight: 500,
                  }}
                >
                  Sisa {remainingDays} hari
                </span>
              </div>
            ) : isCompleted ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--color-income)",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-income)",
                    fontWeight: 700,
                  }}
                >
                  Tercapai 🎉
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--color-expense)",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-expense)",
                    fontWeight: 500,
                  }}
                >
                  Terlewat {Math.abs(remainingDays)} hari
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.25rem" }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            style={{ color: "var(--color-text-muted)", width: 32, height: 32 }}
          >
            <Pencil size={15} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            style={{ color: "var(--color-expense)", width: 32, height: 32 }}
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </div>

      {/* Progress & Amounts */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.125rem",
              }}
            >
              Terkumpul
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
                fontSize: "1.375rem",
                color: goal.warna,
                lineHeight: 1,
              }}
            >
              {formatCurrency(goal.jumlah_terkumpul)}
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              Target:{" "}
              <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
                {formatCurrency(goal.target_jumlah)}
              </span>
            </span>
            <span
              style={{
                fontSize: "0.9375rem",
                fontWeight: 800,
                color: "var(--color-text)",
              }}
            >
              {pct}%
            </span>
          </div>
        </div>

        <div
          className="progress-bar"
          style={{
            height: 10,
            background: "var(--color-surface-offset)",
            borderRadius: 10,
          }}
        >
          <div
            className="progress-bar-fill"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: isCompleted
                ? "var(--color-income)"
                : `linear-gradient(90deg, ${goal.warna}, ${goal.warna}dd)`,
              borderRadius: 10,
              boxShadow: `0 0 10px ${goal.warna}30`,
            }}
          />
        </div>
      </div>

      {!isCompleted && (
        <Button
          variant="secondary"
          onClick={onAddFunds}
          style={{
            width: "100%",
            background: `${goal.warna}10`,
            color: goal.warna,
            borderColor: `${goal.warna}30`,
            fontWeight: 700,
            fontSize: "0.875rem",
          }}
        >
          <Plus size={16} style={{ marginRight: "0.375rem" }} /> Tambah Dana
        </Button>
      )}
    </div>
  );
});
