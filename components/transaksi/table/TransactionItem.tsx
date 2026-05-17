"use client";
import React, { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { Transaction } from "@/types";

import { formatCurrency } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/constants";

interface TransactionItemProps {
  tx: Transaction;
  realIdx: number;
  onEdit: (tx: Transaction, idx: number) => void;
  onDelete: (id: string, idx: number) => void;
}

export function TransactionItem({
  tx,
  realIdx,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const isIncome = tx.jenis === "pemasukan";
  const catColor = CATEGORY_COLORS[tx.kategori] || "var(--color-primary)";

  // Swipe-to-action states
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [hasVibrated, setHasVibrated] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
    setHasVibrated(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const deltaX = e.touches[0].clientX - startX;

    // Apply elasticity/damping resistance when swiping far
    let currentOffset = deltaX;
    if (deltaX > 100) {
      currentOffset = 100 + (deltaX - 100) * 0.35;
    } else if (deltaX < -100) {
      currentOffset = -100 + (deltaX + 100) * 0.35;
    }

    setOffsetX(currentOffset);

    // Tactile haptic click tick when crossing action threshold
    if (Math.abs(currentOffset) > 130 && !hasVibrated) {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(10);
        } catch {}
      }
      setHasVibrated(true);
    } else if (Math.abs(currentOffset) < 130 && hasVibrated) {
      setHasVibrated(false);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);

    if (offsetX > 130) {
      // Swiped fully right: Edit
      onEdit(tx, realIdx);
    } else if (offsetX < -130) {
      // Swiped fully left: Delete
      onDelete(tx.id, realIdx);
    } else if (offsetX > 45) {
      // Snap to revealed Edit action
      setOffsetX(80);
      return;
    } else if (offsetX < -45) {
      // Snap to revealed Delete action
      setOffsetX(-80);
      return;
    }

    setOffsetX(0);
  };

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--radius-xl)",
        userSelect: "none",
        touchAction: "pan-y",
      }}
    >
      {/* Background Revealed Actions */}
      {offsetX > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "100%",
            background: "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            paddingLeft: "1.5rem",
            borderRadius: "var(--radius-xl)",
            fontSize: "0.875rem",
            fontWeight: 700,
            opacity: Math.min(offsetX / 80, 1),
            transition: "opacity 0.2s",
            cursor: "pointer",
          }}
          onClick={() => {
            onEdit(tx, realIdx);
            setOffsetX(0);
          }}
        >
          <Pencil size={20} style={{ marginRight: "0.5rem" }} />
          Edit
        </div>
      )}

      {offsetX < 0 && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "100%",
            background: "linear-gradient(90deg, #ef4444 0%, #f87171 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: "1.5rem",
            borderRadius: "var(--radius-xl)",
            fontSize: "0.875rem",
            fontWeight: 700,
            opacity: Math.min(Math.abs(offsetX) / 80, 1),
            transition: "opacity 0.2s",
            cursor: "pointer",
          }}
          onClick={() => {
            onDelete(tx.id, realIdx);
            setOffsetX(0);
          }}
        >
          Hapus
          <Trash2 size={20} style={{ marginLeft: "0.5rem" }} />
        </div>
      )}

      {/* Swipeable Foreground Row Content */}
      <div
        className="card card-lift"
        style={{
          padding: "0.875rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
          background: "var(--color-surface)",
          transform: `translate3d(${offsetX}px, 0, 0)`,
          transition: isSwiping ? "none" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          position: "relative",
          zIndex: 2,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "14px",
            background: `${catColor}12`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.125rem",
            flexShrink: 0,
            border: `1px solid ${catColor}20`,
          }}
        >
          {isIncome ? "📈" : "📉"}
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          {/* Left Side: Description & Category Tag */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 0, flex: 1 }}>
            <h4
              style={{
                fontSize: "0.9375rem",
                fontWeight: 700,
                color: "var(--color-text)",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {tx.deskripsi || tx.kategori}
            </h4>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: catColor,
                  fontWeight: 700,
                  background: `${catColor}10`,
                  padding: "0.1rem 0.4rem",
                  borderRadius: "4px",
                }}
              >
                {tx.kategori}
              </span>
              {tx.sub_kategori && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-faint)",
                    fontWeight: 500,
                  }}
                >
                  › {tx.sub_kategori}
                </span>
              )}
            </div>
          </div>

          {/* Right Side: Amount & Wallet Name */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem", flexShrink: 0 }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
                fontSize: "0.9375rem",
                color: isIncome ? "var(--color-income)" : "var(--color-expense)",
              }}
            >
              {isIncome ? "+" : "-"}
              {formatCurrency(tx.jumlah)}
            </span>
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--color-text-faint)",
                fontWeight: 600,
                background: "var(--color-background-soft)",
                padding: "0.1rem 0.35rem",
                borderRadius: "4px",
                border: "1px solid var(--color-border-subtle)",
                textTransform: "uppercase",
                letterSpacing: "0.025em",
              }}
            >
              {tx.dompet}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

