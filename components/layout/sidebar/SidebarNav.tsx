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
} from "lucide-react";

interface SidebarNavProps {
  onItemClick: () => void;
  t: (key: string) => string;
}

export function SidebarNav({ onItemClick, t }: SidebarNavProps) {
  const pathname = usePathname();

  const NAV_ITEMS = [
    { href: "/", label: t("sidebar.dashboard"), icon: LayoutDashboard },
    { href: "/transaksi", label: t("sidebar.transactions"), icon: ArrowLeftRight },
    { href: "/anggaran", label: t("sidebar.budget"), icon: Wallet },
    { href: "/tabungan", label: t("sidebar.savings"), icon: PiggyBank },
    { href: "/aset-hutang", label: t("sidebar.assets"), icon: Building2 },
    { href: "/laporan", label: t("sidebar.reports"), icon: BarChart3 },
    { href: "/pengaturan", label: t("sidebar.settings"), icon: Settings },
  ];

  return (
    <nav style={{ flex: 1, padding: "1rem 0.75rem 0" }}>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onItemClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.875rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-xl)",
                  fontSize: "0.9375rem",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                  background: isActive ? "var(--color-primary-highlight)" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  minHeight: 48,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20 }}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span style={{ flex: 1 }}>{label}</span>
                {isActive && (
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--color-primary)",
                      boxShadow: "0 0 10px var(--color-primary)",
                    }}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
