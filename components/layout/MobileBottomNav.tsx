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
  Building2,
} from "lucide-react";

import { format } from "date-fns";
import { id } from "date-fns/locale";

const MOBILE_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/anggaran", label: "Anggaran", icon: Wallet },
  { href: "/tabungan", label: "Tabungan", icon: PiggyBank },
  { href: "/aset-hutang", label: "Aset", icon: Building2 },
  { href: "/laporan", label: "Laporan", icon: BarChart3 },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const now = new Date();

  return (
    <nav
      className="mobile-bottom-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "5rem",
        background: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        backdropFilter: "blur(12px)",
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -4px 15px rgba(0,0,0,0.05)",
      }}
    >
      {/* Date Bar */}
      <div
        style={{
          textAlign: "center",
          padding: "0.5rem 0 0.125rem 0",
          fontSize: "0.6rem",
          fontWeight: 700,
          color: "var(--color-text-faint)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {format(now, "EEEE, d MMMM yyyy", { locale: id })}
      </div>

      <div style={{ display: "flex", flex: 1, alignItems: "stretch" }}>
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
                gap: "0.125rem",
                textDecoration: "none",
                color: isActive
                  ? "var(--color-primary)"
                  : "var(--color-text-muted)",
                fontSize: "0.625rem",
                fontWeight: isActive ? 700 : 500,
                transition: "all 0.2s",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  padding: "0.25rem 0.6rem",
                  borderRadius: "10px",
                  background: isActive
                    ? "var(--color-primary-highlight)"
                    : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "0.125rem",
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              </div>
              <span
                style={{
                  opacity: isActive ? 1 : 0.7,
                  fontSize: "0.6rem",
                  letterSpacing: "-0.01em",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      <style jsx>{`
        @media (min-width: 1024px) {
          .mobile-bottom-nav {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}
