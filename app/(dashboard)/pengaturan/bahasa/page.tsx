"use client";
import React from "react";
import { ChevronLeft, Languages, Check } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAppStore } from "@/store/useAppStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { LANGUAGES } from "@/lib/i18n/dictionaries";

export default function BahasaPage() {
  const { settings, setSettings } = useAppStore();
  const { t, currentLang } = useTranslation();

  const handleSave = (langId: string) => {
    setSettings({ ...settings, bahasa: langId, mata_uang: "IDR" });

    // Slight delay to allow Google Translate to apply globally via LanguageSyncProvider
    setTimeout(() => {
      toast.success(
        LANGUAGES.find((l) => l.id === langId)?.id === "id"
          ? "Bahasa berhasil diperbarui"
          : "Language updated successfully",
      );
    }, 300);
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: "3rem" }}>
      <Link
        href="/pengaturan"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--color-text-muted)",
          textDecoration: "none",
          fontSize: "0.875rem",
          fontWeight: 600,
          marginBottom: "1.5rem",
          width: "fit-content",
        }}
      >
        <ChevronLeft size={18} /> {t("settings.back")}
      </Link>

      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.5rem",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.1)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Languages size={20} />
          </div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            {t("settings.language.title")}
          </h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          {t("settings.language.subtitle")}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {LANGUAGES.map((lang) => (
          <div
            key={lang.id}
            className="card"
            onClick={() => handleSave(lang.id)}
            style={{
              padding: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
              cursor: "pointer",
              border:
                currentLang === lang.id
                  ? "2px solid var(--color-primary)"
                  : "1px solid var(--color-border-subtle)",
              background:
                currentLang === lang.id
                  ? "var(--color-primary-highlight)"
                  : "var(--color-surface)",
              transition: "all 0.2s",
            }}
          >
            <div style={{ fontSize: "2rem" }}>{lang.flag}</div>
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  margin: 0,
                  color: "var(--color-text)",
                }}
              >
                {lang.name}
              </h3>
            </div>
            {currentLang === lang.id && (
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--color-primary)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Check size={14} strokeWidth={3} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
