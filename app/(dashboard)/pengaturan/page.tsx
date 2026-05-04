"use client";
import React from "react";
import Link from "next/link";
import {
  User2,
  Palette,
  Languages,
  CreditCard,
  Tags,
  Smartphone,
  ChevronRight,
} from "lucide-react";

import { useTranslation } from "@/lib/i18n/useTranslation";

export default function PengaturanPage() {
  const { t } = useTranslation();

  const SETTINGS_MENU = [
    {
      id: "preferensi",
      title: t("settings.pref_title"),
      description: "Nama panggilan dan nama rumah tangga",
      icon: <User2 size={22} />,
      href: "/pengaturan/preferensi",
      color: "#6366f1",
    },
    {
      id: "tema",
      title: t("settings.theme_title"),
      description: "Sesuaikan warna utama aplikasi",
      icon: <Palette size={22} />,
      href: "/pengaturan/tema",
      color: "#ec4899",
    },
    {
      id: "bahasa",
      title: t("settings.lang_title"),
      description: "Pilih bahasa aplikasi",
      icon: <Languages size={22} />,
      href: "/pengaturan/bahasa",
      color: "#10b981",
    },
    {
      id: "dompet",
      title: t("settings.wallet_title"),
      description: "Atur daftar dompet dan akun bank",
      icon: <CreditCard size={22} />,
      href: "/pengaturan/dompet",
      color: "#f59e0b",
    },
    {
      id: "kategori",
      title: t("settings.cat_title"),
      description: "Atur kategori transaksi dan sub-kategori",
      icon: <Tags size={22} />,
      href: "/pengaturan/kategori",
      color: "#8b5cf6",
    },
    {
      id: "install",
      title: t("settings.install_title"),
      description: "Pasang aplikasi di layar utama HP",
      icon: <Smartphone size={22} />,
      href: "/pengaturan/install",
      color: "#06b6d4",
    },
  ];

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "var(--color-text)",
            letterSpacing: "-0.02em",
          }}
        >
          {t("settings.title")}
        </h2>
        <p
          style={{
            fontSize: "0.9375rem",
            color: "var(--color-text-muted)",
            marginTop: "0.5rem",
          }}
        >
          {t("settings.subtitle")}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        {SETTINGS_MENU.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
                padding: "1.25rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                border: "1px solid var(--color-border-subtle)",
                background: "var(--color-surface)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateX(6px)";
                e.currentTarget.style.borderColor =
                  "var(--color-primary-highlight)";
                e.currentTarget.style.background =
                  "var(--color-surface-offset)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateX(0)";
                e.currentTarget.style.borderColor =
                  "var(--color-border-subtle)";
                e.currentTarget.style.background = "var(--color-surface)";
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "14px",
                  background: `${item.color}15`,
                  color: item.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    margin: 0,
                    color: "var(--color-text)",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    margin: "0.25rem 0 0",
                    fontWeight: 500,
                  }}
                >
                  {item.description}
                </p>
              </div>
              <ChevronRight
                size={20}
                style={{ color: "var(--color-text-faint)" }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
