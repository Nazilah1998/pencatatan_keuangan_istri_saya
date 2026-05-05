"use client";
import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Asset } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

interface AssetListProps {
  assets: Asset[];
  sortBy: "highest" | "lowest" | "newest";
  isPrivateMode: boolean;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

export function AssetList({
  assets,
  sortBy,
  isPrivateMode,
  onEdit,
  onDelete,
}: AssetListProps) {
  if (assets.length === 0) {
    return (
      <EmptyState
        icon="🏢"
        title="Belum ada aset"
        description="Catat aset pertamamu (Rumah, Kendaraan, Investasi)"
      />
    );
  }

  const sortedAssets = [...assets].sort((a, b) => {
    if (sortBy === "highest") return b.nilai - a.nilai;
    if (sortBy === "lowest") return a.nilai - b.nilai;
    return new Date(b.tanggal_update).getTime() - new Date(a.tanggal_update).getTime();
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {sortedAssets.map((a) => (
        <div
          key={a.id}
          className="card"
          style={{
            padding: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: "1.25rem",
                width: "40px",
                height: "40px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--color-surface-offset)",
                borderRadius: "12px",
              }}
            >
              {a.jenis === "kas" && "💵"}
              {a.jenis === "rekening" && "🏦"}
              {a.jenis === "investasi" && "📈"}
              {a.jenis === "emas" && "🟡"}
              {a.jenis === "properti" && "🏠"}
              {a.jenis === "kendaraan" && "🚗"}
              {a.jenis === "lainnya" && "📦"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "1rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: "var(--color-text)",
                }}
              >
                {a.nama}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginTop: "0.125rem",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "var(--color-income)",
                  }}
                >
                  {isPrivateMode ? "Rp ••••••" : formatCurrency(a.nilai)}
                </span>
                <span style={{ fontSize: "0.6875rem", color: "var(--color-text-faint)" }}>
                  • {formatDate(a.tanggal_update)}
                </span>
              </div>
              {a.catatan && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    marginTop: "0.125rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {a.catatan}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0rem", flexShrink: 0 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(a)}
              style={{ color: "var(--color-text-faint)", width: 28, height: 28 }}
            >
              <Pencil size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(a.id)}
              style={{ color: "var(--color-expense)", opacity: 0.7, width: 28, height: 28 }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
