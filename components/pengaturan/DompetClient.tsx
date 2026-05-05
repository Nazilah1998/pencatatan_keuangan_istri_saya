"use client";
import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { WALLET_PRESETS } from "@/lib/constants";
import { AppSettings } from "@/types";
import { updateProfile } from "@/app/actions/profiles";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface DompetClientProps {
  initialSettings: Partial<AppSettings>;
}

export function DompetClient({}: DompetClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { settings: storeSettings, setSettings: setStoreSettings } =
    useAppStore();

  // Prefer store settings (which might have Guest data) over server initialSettings
  const settings = storeSettings;
  const custom_wallets = settings.custom_wallets || [];

  const [isManual, setIsManual] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletIcon, setNewWalletIcon] = useState("💳");

  const syncSettings = async (newSettings: Partial<AppSettings>) => {
    setStoreSettings(newSettings);
    await updateProfile(newSettings);
  };

  const handleAddWallet = (name: string, icon: string) => {
    if (
      custom_wallets.some((w) => w.name.toLowerCase() === name.toLowerCase())
    ) {
      toast.error(t("settings.wallet.error_exists"));
      return;
    }
    const newWallet = {
      id: crypto.randomUUID(),
      name: name.trim(),
      icon: icon,
    };
    const updated = {
      ...settings,
      custom_wallets: [...custom_wallets, newWallet],
    };
    syncSettings(updated);
    setNewWalletName("");
    setIsManual(false);
    toast.success(`${name} ${t("settings.wallet.success_added")}`);
  };

  const handleDeleteWallet = (id: string) => {
    if (custom_wallets.length <= 1) {
      toast.error(t("settings.wallet.error_min"));
      return;
    }
    const updated = {
      ...settings,
      custom_wallets: custom_wallets.filter((w) => w.id !== id),
    };
    syncSettings(updated);
    toast.success(t("settings.wallet.success_deleted"));
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: "2rem" }}>
      <button
        onClick={() => router.back()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "none",
          border: "none",
          color: "var(--color-primary)",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: "1rem",
        }}
      >
        <ArrowLeft size={18} /> {t("common.back")}
      </button>

      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
          {t("settings.wallet.title")}
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          {t("settings.wallet.subtitle")}
        </p>
      </div>

      <div
        className="card"
        style={{ padding: "1.5rem", marginBottom: "1.5rem" }}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
          {t("settings.wallet.add_title")}
        </h3>

        {!isManual ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {WALLET_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => handleAddWallet(p.name, p.icon)}
                style={{
                  padding: "0.75rem",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface-offset)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                }}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
            <button
              onClick={() => setIsManual(true)}
              style={{
                padding: "0.75rem",
                borderRadius: "12px",
                border: "1px dashed var(--color-primary)",
                background: "var(--color-primary-highlight)",
                color: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                cursor: "pointer",
                fontSize: "0.8125rem",
                fontWeight: 700,
              }}
            >
              <Plus size={16} /> {t("settings.wallet.others")}
            </button>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input
                type="text"
                className="input"
                placeholder={t("settings.wallet.custom_placeholder")}
                value={newWalletName}
                onChange={(e) => setNewWalletName(e.target.value)}
                autoFocus
              />
              <input
                type="text"
                className="input"
                style={{ width: "60px", textAlign: "center" }}
                value={newWalletIcon}
                onChange={(e) => setNewWalletIcon(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button
                variant="primary"
                style={{ flex: 1 }}
                onClick={() => handleAddWallet(newWalletName, newWalletIcon)}
              >
                {t("settings.wallet.save")}
              </Button>
              <Button variant="ghost" onClick={() => setIsManual(false)}>
                {t("settings.wallet.cancel")}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <h3
          style={{
            fontSize: "0.875rem",
            fontWeight: 700,
            color: "var(--color-text-muted)",
            marginBottom: "0.75rem",
          }}
        >
          {t("settings.wallet.active_title")} ({custom_wallets.length})
        </h3>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          {custom_wallets.map((wallet) => (
            <div
              key={wallet.id}
              className="card"
              style={{
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "var(--color-surface-offset)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                  }}
                >
                  {wallet.icon}
                </div>
                <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                  {wallet.name}
                </span>
              </div>
              <button
                onClick={() => handleDeleteWallet(wallet.id)}
                style={{
                  color: "#ef4444",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "none",
                  padding: "0.5rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
