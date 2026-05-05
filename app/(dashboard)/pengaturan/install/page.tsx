"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { usePWA } from "@/components/providers/PWAProvider";
import {
  Smartphone,
  Download,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  Info,
} from "lucide-react";
import { InstallModal } from "@/components/layout/InstallModal";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function InstallPage() {
  const { t } = useTranslation();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isActuallyInstalled, setIsActuallyInstalled] = useState(false);
  const { isInstallable, isIOS, installApp } = usePWA();

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ||
      document.referrer.includes("android-app://");

    requestAnimationFrame(() => {
      setIsActuallyInstalled(!!isStandalone);
    });
  }, []);

  const handleInstallClick = () => {
    setShowInstallModal(true);
  };

  const handleConfirmInstall = () => {
    setShowInstallModal(false);
    installApp();
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
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
              background: "rgba(6, 182, 212, 0.1)",
              color: "#06b6d4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Smartphone size={20} />
          </div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            {t("settings.install.title")}
          </h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          {t("settings.install.subtitle")}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div
          className="card"
          style={{
            padding: "2rem",
            textAlign: "center",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "24px",
              background:
                "linear-gradient(135deg, var(--color-primary), #ec4899)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.5rem",
              margin: "0 auto 1.5rem",
              boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
            }}
          >
            💎
          </div>

          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              marginBottom: "0.75rem",
            }}
          >
            {t("settings.install.pro_title")}
          </h3>

          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--color-text-muted)",
              lineHeight: 1.6,
              marginBottom: "2rem",
            }}
          >
            {t("settings.install.pro_desc")}
          </p>

          {isActuallyInstalled ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
                padding: "1.5rem",
                background: "var(--color-income-bg)",
                borderRadius: "var(--radius-xl)",
                color: "var(--color-income)",
              }}
            >
              <CheckCircle2 size={32} />
              <span style={{ fontWeight: 700 }}>
                {t("settings.install.installed_title")}
              </span>
              <p style={{ fontSize: "0.8125rem", opacity: 0.8 }}>
                {t("settings.install.installed_desc")}
              </p>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <Button
                onClick={handleInstallClick}
                variant="primary"
                fullWidth
                size="lg"
                style={{ height: "3.5rem", borderRadius: "16px" }}
              >
                <Download size={20} style={{ marginRight: "0.75rem" }} />
                {isIOS
                  ? t("settings.install.button_ios")
                  : t("settings.install.button_android")}
              </Button>

              {!isInstallable && !isIOS && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <Loader2 size={14} className="animate-spin" />
                  {t("settings.install.searching")}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            padding: "1.25rem",
            background: "var(--color-surface-offset)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--color-border)",
            display: "flex",
            gap: "1rem",
          }}
        >
          <Info
            size={20}
            style={{ color: "var(--color-primary)", flexShrink: 0 }}
          />
          <div style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}>
            <strong>{t("settings.install.why_title")}</strong>
            <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
              <li>{t("settings.install.reason_1")}</li>
              <li>{t("settings.install.reason_2")}</li>
              <li>{t("settings.install.reason_3")}</li>
            </ul>
          </div>
        </div>
      </div>

      <InstallModal
        isOpen={showInstallModal}
        isIOS={isIOS}
        onClose={() => setShowInstallModal(false)}
        onConfirm={handleConfirmInstall}
      />
    </div>
  );
}
