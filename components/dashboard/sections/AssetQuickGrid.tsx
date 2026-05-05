"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Building2, CreditCard, Banknote, ChevronLeft, ChevronRight } from "lucide-react";
import { Asset } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface AssetQuickGridProps {
  assets: Asset[];
  isPrivateMode: boolean;
  currencyPlaceholder: string;
  intlLocale: string;
  t: (key: string) => string;
}

export function AssetQuickGrid({
  assets,
  isPrivateMode,
  currencyPlaceholder,
  intlLocale,
  t,
}: AssetQuickGridProps) {
  const assetScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!assetScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = assetScrollRef.current;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  };

  useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    const el = assetScrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        clearTimeout(timer);
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
    return () => clearTimeout(timer);
  }, [assets]);

  const scrollAssets = (direction: "left" | "right") => {
    if (!assetScrollRef.current) return;
    const scrollAmount = assetScrollRef.current.clientWidth;
    assetScrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "bank": return <Building2 size={16} />;
      case "ewallet": return <CreditCard size={16} />;
      default: return <Banknote size={16} />;
    }
  };

  if (assets.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
          {t("dashboard.wallet_assets") || "Dompet & Aset"}
        </h3>
        <Link href="/aset-hutang" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}>
          {t("dashboard.manage_assets") || "Atur Aset"}
        </Link>
      </div>

      <div style={{ position: "relative" }}>
        {assets.length > 2 && canScrollLeft && (
          <button
            onClick={() => scrollAssets("left")}
            style={{ position: "absolute", left: "-4px", top: "50%", transform: "translateY(-50%)", zIndex: 20, background: "rgba(255, 255, 255, 0.98)", backdropFilter: "blur(8px)", border: "1px solid var(--color-border)", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-primary)", boxShadow: "0 4px 12px rgba(0,0,0,0.18)" }}
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {assets.length > 2 && canScrollRight && (
          <button
            onClick={() => scrollAssets("right")}
            style={{ position: "absolute", right: "-4px", top: "50%", transform: "translateY(-50%)", zIndex: 20, background: "rgba(255, 255, 255, 0.98)", backdropFilter: "blur(8px)", border: "1px solid var(--color-border)", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-primary)", boxShadow: "0 4px 12px rgba(0,0,0,0.18)" }}
          >
            <ChevronRight size={20} />
          </button>
        )}

        <div
          ref={assetScrollRef}
          style={{ display: "flex", gap: "0.75rem", overflowX: "auto", padding: "0.5rem 0", scrollbarWidth: "none", scrollSnapType: "x mandatory" }}
        >
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="card"
              style={{ flex: "0 0 calc(50% - 0.375rem)", scrollSnapAlign: "start", padding: "0.875rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem", background: "var(--color-surface)", border: "1px solid var(--color-border-subtle)", boxShadow: "var(--shadow-sm)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)" }}>
                <span style={{ color: "var(--color-primary)" }}>{getAssetIcon(asset.jenis)}</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {asset.nama}
                </span>
              </div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 800, fontFamily: "var(--font-mono)" }}>
                {isPrivateMode ? currencyPlaceholder : formatCurrency(asset.nilai, intlLocale)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
