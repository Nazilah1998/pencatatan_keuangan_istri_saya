"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Sun, Moon, Monitor } from "lucide-react";
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

type ThemeCycle = "light" | "dark" | "system";

export function TopBar() {
  const pathname = usePathname();
  const { toggleSidebar, settings, setSettings, applyTheme } = useAppStore();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const pageTitle = PAGE_TITLES[pathname] || "Tyaaa Financee";

  const cycleTheme = (theme: ThemeCycle) => {
    setSettings({ tema: theme });
    setTimeout(applyTheme, 0);
    setShowThemeMenu(false);
  };

  const ThemeIcon =
    settings.tema === "dark" ? Moon : settings.tema === "light" ? Sun : Monitor;

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

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {/* Theme Toggle */}
        <div style={{ position: "relative" }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            aria-label="Toggle theme"
            id="theme-toggle-btn"
          >
            <ThemeIcon size={18} />
          </Button>

          {showThemeMenu && (
            <>
              <div
                onClick={() => setShowThemeMenu(false)}
                style={{ position: "fixed", inset: 0, zIndex: 49 }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "110%",
                  right: 0,
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-lg)",
                  zIndex: 50,
                  minWidth: 160,
                  padding: "0.375rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.125rem",
                }}
              >
                {(
                  [
                    ["light", Sun, "Terang"],
                    ["dark", Moon, "Gelap"],
                    ["system", Monitor, "Sistem"],
                  ] as const
                ).map(([val, Icon, label]) => (
                  <button
                    key={val}
                    onClick={() => cycleTheme(val)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.625rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      background:
                        settings.tema === val
                          ? "var(--color-primary-highlight)"
                          : "transparent",
                      color:
                        settings.tema === val
                          ? "var(--color-primary)"
                          : "var(--color-text)",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: settings.tema === val ? 600 : 400,
                      textAlign: "left",
                      width: "100%",
                      transition: "background var(--transition)",
                    }}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

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
