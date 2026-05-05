"use client";
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SavingsHeaderProps {
  onAdd: () => void;
}

export function SavingsHeader({ onAdd }: SavingsHeaderProps) {
  return (
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
          Tabungan & Impian
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
            marginTop: "0.25rem",
          }}
        >
          Kelola dana cadangan dan target impian masa depan
        </p>
      </div>
      <Button
        onClick={onAdd}
        size="sm"
        style={{
          borderRadius: "12px",
          gap: "0.375rem",
          padding: "0.5rem 1rem",
        }}
      >
        <Plus size={18} strokeWidth={3} />
        <span style={{ fontWeight: 700 }}>Buat Target</span>
      </Button>
    </div>
  );
}
