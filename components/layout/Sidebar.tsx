"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  Building2,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/anggaran", label: "Anggaran", icon: Wallet },
  { href: "/tabungan", label: "Tabungan", icon: PiggyBank },
  { href: "/aset-hutang", label: "Aset & Hutang", icon: Building2 },
  { href: "/laporan", label: "Laporan", icon: BarChart3 },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, setSidebarOpen, settings } = useAppStore();
  const { data: session } = useSession();

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "oklch(0.15 0.01 80 / 0.5)",
            backdropFilter: "blur(2px)",
            zIndex: 39,
            display: "none",
          }}
          className="sidebar-overlay"
        />
      )}

      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100dvh",
          width: "var(--sidebar-width)",
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          zIndex: 40,
          transition: "transform var(--transition-slow)",
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "1.5rem 1.25rem 1rem",
            borderBottom: "1px solid var(--color-divider)",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                background: "var(--color-primary)",
                borderRadius: "var(--radius-lg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
                flexShrink: 0,
              }}
            >
              💎
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "var(--color-text)",
                }}
              >
                Tyaaa Financee
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                }}
              >
                {settings.nama_rumah_tangga || "Keuangan Keluarga"}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "0.75rem 0.75rem 0" }}>
          <ul
            style={{
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.625rem 0.875rem",
                      borderRadius: "var(--radius-lg)",
                      fontSize: "0.9375rem",
                      fontWeight: isActive ? 600 : 500,
                      color: isActive
                        ? "var(--color-primary)"
                        : "var(--color-text-muted)",
                      background: isActive
                        ? "var(--color-primary-highlight)"
                        : "transparent",
                      textDecoration: "none",
                      transition: "all var(--transition)",
                      minHeight: 44,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--color-surface-offset)";
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--color-text)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background =
                          "transparent";
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--color-text-muted)";
                      }
                    }}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{label}</span>
                    {isActive && (
                      <div
                        style={{
                          marginLeft: "auto",
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "var(--color-primary)",
                        }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        {session?.user && (
          <div
            style={{
              padding: "1rem 0.75rem",
              borderTop: "1px solid var(--color-divider)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                width={36}
                height={36}
                style={{
                  borderRadius: "50%",
                  border: "2px solid var(--color-border)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  flexShrink: 0,
                }}
              >
                {session.user.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {session.user.name}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {session.user.email}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Keluar"
              style={{
                padding: "0.375rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text-muted)",
                borderRadius: "var(--radius-sm)",
                transition: "color var(--transition)",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--color-danger)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--color-text-muted)";
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </aside>

      <style jsx global>{`
        @media (max-width: 767px) {
          .sidebar-overlay {
            display: block !important;
          }
          aside {
            transform: ${isSidebarOpen ? "translateX(0)" : "translateX(-100%)"};
          }
        }
      `}</style>
    </>
  );
}
