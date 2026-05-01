"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/transaksi": "Transaksi",
  "/transaksi/tambah": "Tambah Transaksi",
  "/anggaran": "Anggaran",
  "/tabungan": "Tabungan",
  "/aset-hutang": "Aset & Hutang",
  "/laporan": "Laporan",
  "/pengaturan": "Pengaturan",
};

export function TopBar() {
  const pathname = usePathname();
  const { toggleSidebar } = useAppStore();

  const pageTitle = PAGE_TITLES[pathname] || "Tyaaa Financee";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        height: "4rem",
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid rgba(247, 209, 217, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1rem",
        boxShadow: "0 4px 10px -10px rgba(255, 133, 162, 0.2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Mobile hamburger */}
        <button
          onClick={toggleSidebar}
          className="md-hidden"
          id="sidebar-toggle-btn"
          style={{
            display: "none",
            border: "none",
            background: "var(--color-surface-offset)",
            color: "var(--color-primary)",
            padding: "0.5rem",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "scale(1.05)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Menu size={20} strokeWidth={2.5} />
        </button>

        <h1
          style={{
            fontSize: "1rem",
            fontWeight: 800,
            color: "var(--color-text)",
            letterSpacing: "-0.02em",
            textTransform: "capitalize",
          }}
        >
          {pageTitle}
        </h1>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {/* Potentially add profile or notification icons here in future */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--color-primary-highlight)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            fontWeight: 800,
            color: "var(--color-primary)",
          }}
        >
          T
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 1023px) {
          #sidebar-toggle-btn {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
