"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";

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
        zIndex: 30,
        height: 64,
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "0 1.5rem",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="md-hidden"
        style={{ display: "none" }}
        id="sidebar-toggle-btn"
      >
        <Menu size={20} />
      </Button>

      <h1
        style={{
          fontSize: "1.125rem",
          fontWeight: 700,
          color: "var(--color-text)",
          flex: 1,
        }}
      >
        {pageTitle}
      </h1>

      <style jsx global>{`
        @media (max-width: 767px) {
          #sidebar-toggle-btn {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
