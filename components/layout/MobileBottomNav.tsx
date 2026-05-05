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

import { useTranslation } from "@/lib/i18n/useTranslation";
import { Locale, format } from "date-fns";
import { id, enUS, zhCN, es, hi, fr, ja, ru, ptBR } from "date-fns/locale";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t, currentLang } = useTranslation();
  const now = new Date();

  // Map our language IDs to date-fns locales
  const localeMap: Record<string, Locale> = {
    id: id,
    en: enUS,
    zh: zhCN,
    es: es,
    hi: hi,
    fr: fr,
    ja: ja,
    ru: ru,
    pt: ptBR,
  };

  const activeLocale = localeMap[currentLang] || id;

  const MOBILE_NAV = [
    { href: "/", label: t("sidebar.dashboard"), icon: LayoutDashboard },
    { href: "/transaksi", label: t("sidebar.transactions"), icon: ArrowLeftRight },
    { href: "/anggaran", label: t("sidebar.budget"), icon: Wallet },
    { href: "/tabungan", label: t("sidebar.savings"), icon: PiggyBank },
    { href: "/aset-hutang", label: t("sidebar.assets"), icon: Building2 },
    { href: "/laporan", label: t("sidebar.reports"), icon: BarChart3 },
  ];

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
        {format(now, "EEEE, d MMMM yyyy", { locale: activeLocale })}
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
