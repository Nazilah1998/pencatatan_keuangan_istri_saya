"use client";
import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { WALLET_PRESETS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { AppSettings } from "@/types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { ICON_CATEGORIES, IconCategory } from "@/lib/constants/icons";

export function DompetClient() {
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
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [activeIconTab, setActiveIconTab] = useState(ICON_CATEGORIES[0].id);

  const syncSettings = (newSettings: Partial<AppSettings>) => {
    // Update local UI state immediately (Synchronous)
    // The global ProfileSyncProvider will automatically detect this and sync it to the cloud in the background
    setStoreSettings(newSettings);
  };

  const handleAddWallet = (name: string, icon: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Nama dompet tidak boleh kosong");
      return;
    }
    if (
      custom_wallets.some((w) => w.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      toast.error(t("settings.wallet.error_exists"));
      return;
    }
    const newWallet = {
      id: crypto.randomUUID(),
      name: trimmed,
      icon: icon,
    };
    const updated = {
      ...settings,
      custom_wallets: [...custom_wallets, newWallet],
    };
    syncSettings(updated);
    setNewWalletName("");
    setIsManual(false);
    toast.success(`${trimmed} ${t("settings.wallet.success_added")}`);
  };

  const handleDeleteWallet = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

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
        onClick={() => router.push("/pengaturan")}
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
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-end",
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--color-text-muted)",
                    marginBottom: "0.5rem",
                    display: "block",
                    textTransform: "uppercase",
                  }}
                >
                  {t("settings.wallet.name_label") || "Nama Dompet"}
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder={t("settings.wallet.custom_placeholder")}
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  autoFocus
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ position: "relative" }}>
                <label
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--color-text-muted)",
                    marginBottom: "0.5rem",
                    display: "block",
                    textTransform: "uppercase",
                  }}
                >
                  Icon
                </label>
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    border: "1px solid var(--color-border)",
                    background: "white",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}
                >
                  {newWalletIcon}
                </button>
                {showIconPicker && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "60px",
                      right: 0,
                      width: "280px",
                      background: "white",
                      border: "1px solid var(--color-border)",
                      borderRadius: "16px",
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                      zIndex: 100,
                    }}
                  >
                    {/* Category Tabs */}
                    <div
                      style={{
                        display: "flex",
                        gap: "0.25rem",
                        overflowX: "auto",
                        paddingBottom: "0.5rem",
                        borderBottom: "1px solid var(--color-border-subtle)",
                        scrollbarWidth: "none",
                      }}
                    >
                      {ICON_CATEGORIES.map((cat: IconCategory) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setActiveIconTab(cat.id)}
                          style={{
                            padding: "0.375rem 0.75rem",
                            borderRadius: "8px",
                            border: "none",
                            background:
                              activeIconTab === cat.id
                                ? "var(--color-primary-highlight)"
                                : "transparent",
                            color:
                              activeIconTab === cat.id
                                ? "var(--color-primary)"
                                : "var(--color-text-muted)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                          }}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Icons Grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(6, 1fr)",
                        gap: "0.5rem",
                        maxHeight: "180px",
                        overflowY: "auto",
                      }}
                    >
                      {ICON_CATEGORIES.find(
                        (c: IconCategory) => c.id === activeIconTab,
                      )?.icons.map((emoji: string) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setNewWalletIcon(emoji);
                            setShowIconPicker(false);
                          }}
                          style={{
                            fontSize: "1.5rem",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "0.375rem",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "var(--color-surface-offset)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "none")
                          }
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Button
                variant="primary"
                style={{
                  flex: 1,
                  height: "48px",
                  borderRadius: "12px",
                  fontWeight: 800,
                }}
                onClick={() => handleAddWallet(newWalletName, newWalletIcon)}
              >
                {t("settings.wallet.save")}
              </Button>
              <Button
                variant="ghost"
                style={{ height: "48px", borderRadius: "12px" }}
                onClick={() => setIsManual(false)}
              >
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
                type="button"
                onClick={(e) => handleDeleteWallet(e, wallet.id)}
                style={{
                  color: "#ef4444",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "none",
                  padding: "0.625rem",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
