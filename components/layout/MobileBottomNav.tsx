"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  BarChart3,
} from "lucide-react";

const MOBILE_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/anggaran", label: "Anggaran", icon: Wallet },
  { href: "/tabungan", label: "Tabungan", icon: PiggyBank },
  { href: "/laporan", label: "Laporan", icon: BarChart3 },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "4.5rem",
        background: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "stretch",
        zIndex: 40,
        backdropFilter: "blur(12px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.25rem",
              textDecoration: "none",
              color: isActive
                ? "var(--color-primary)"
                : "var(--color-text-faint)",
              fontSize: "0.6875rem",
              fontWeight: isActive ? 600 : 400,
              transition: "color var(--transition)",
              minHeight: 44,
            }}
          >
            <div
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "var(--radius-lg)",
                background: isActive
                  ? "var(--color-primary-highlight)"
                  : "transparent",
                transition: "background var(--transition)",
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
            </div>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
