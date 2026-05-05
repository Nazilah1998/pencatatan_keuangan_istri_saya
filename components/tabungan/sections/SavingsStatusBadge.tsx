"use client";
import React from "react";

interface SavingsStatusBadgeProps {
  remainingDays: number;
  isCompleted: boolean;
}

export function SavingsStatusBadge({
  remainingDays,
  isCompleted,
}: SavingsStatusBadgeProps) {
  if (isCompleted) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
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
    );
  }

  if (remainingDays > 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
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
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
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
  );
}
