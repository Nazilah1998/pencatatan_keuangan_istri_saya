"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  UserCog,
  Paintbrush,
  Globe,
  WalletCards,
  FolderTree,
  Smartphone,
  ChevronRight,
  Coins,
  Download,
  Upload,
  Trash2,
  Heart,
  X,
  Lock,
  Users,
} from "lucide-react";

import { RestoreModal } from "@/components/pengaturan/RestoreModal";
import { PinSetupModal } from "@/components/auth/PinSetupModal";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAppStore } from "@/store/useAppStore";
import toast from "react-hot-toast";

interface SettingItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  color: string;
}

interface SettingGroup {
  id: string;
  title: string;
  items: SettingItem[];
}

export default function PengaturanPage() {
  const { t } = useTranslation();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetWord, setResetWord] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const handleExportData = () => {
    try {
      const state = useAppStore.getState();
      const backupData = {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        transactions: state.transactions,
        budgets: state.budgets,
        savings: state.savings,
        assets: state.assets,
        debts: state.debts,
        settings: state.settings,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const dateStr = new Date().toISOString().split("T")[0];
      link.download = `sintya-finance-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        t("settings.backup_export_success") || "Data berhasil diekspor sebagai file JSON!"
      );
    } catch (err) {
      console.error("Gagal mengekspor data:", err);
      toast.error("Gagal mengekspor data keuangan.");
    }
  };


  const handleResetData = async () => {
    const confirmWord = t("settings.reset_modal_confirm_word");
    if (resetWord !== confirmWord) return;

    setIsResetting(true);

    // Capture user BEFORE resetStore to know whether to delete cloud data
    const state = useAppStore.getState();
    const userId = state.user?.id;

    // Try cloud delete first (best-effort, don't block local reset on failure)
    if (userId) {
      try {
        const { resetAllUserData } = await import("@/app/actions/profiles");
        const result = await resetAllUserData();
        if (!result.success) {
          console.error("Gagal menghapus data di cloud:", result.error);
        }
      } catch (err) {
        console.error("Gagal menghapus data cloud:", err);
      }
    }

    // Always reset local store even if cloud delete fails
    state.resetStore();

    setIsResetModalOpen(false);
    setResetWord("");
    setIsResetting(false);

    toast.success(t("settings.reset_success"));
  };

  const handleRestoreClick = () => {
    setIsRestoreModalOpen(true);
  };

  const handleItemClick = (id: string) => {
    if (id === "backup") {
      handleExportData();
    } else if (id === "restore") {
      handleRestoreClick();
    } else if (id === "reset") {
      setIsResetModalOpen(true);
    } else if (id === "pin") {
      setIsPinModalOpen(true);
    }
  };

  const SETTINGS_GROUPS: SettingGroup[] = [
    {
      id: "profil-finansial",
      title: t("settings.group_profile") || "Profil & Kustomisasi Finansial",
      items: [
        {
          id: "preferensi",
          title: t("settings.pref_title"),
          description: t("settings.pref_desc"),
          icon: <UserCog size={20} />,
          href: "/pengaturan/preferensi",
          color: "#6366f1",
        },
        {
          id: "dompet",
          title: t("settings.wallet_title"),
          description: t("settings.wallet_desc"),
          icon: <WalletCards size={20} />,
          href: "/pengaturan/dompet",
          color: "#f59e0b",
        },
        {
          id: "kategori",
          title: t("settings.cat_title"),
          description: t("settings.cat_desc"),
          icon: <FolderTree size={20} />,
          href: "/pengaturan/kategori",
          color: "#8b5cf6",
        },
        {
          id: "keluarga",
          title: "Dompet Keluarga",
          description: "Gabungkan transaksi dengan pasangan Anda",
          icon: <Users size={20} />,
          href: "/pengaturan/keluarga",
          color: "#ec4899",
        },
      ],
    },
    {
      id: "sistem-tampilan",
      title: t("settings.group_system") || "Sistem & Tampilan",
      items: [
        {
          id: "tema",
          title: t("settings.theme_title"),
          description: t("settings.theme_desc"),
          icon: <Paintbrush size={20} />,
          href: "/pengaturan/tema",
          color: "#ec4899",
        },
        {
          id: "bahasa",
          title: t("settings.lang_title"),
          description: t("settings.lang_desc"),
          icon: <Globe size={20} />,
          href: "/pengaturan/bahasa",
          color: "#10b981",
        },
        {
          id: "mata-uang",
          title: t("settings.currency_title") || "Mata Uang",
          description: t("settings.currency_desc") || "Sesuaikan mata uang",
          icon: <Coins size={20} />,
          href: "/pengaturan/mata-uang",
          color: "#059669",
        },
      ],
    },
    {
      id: "data-cadangan",
      title: t("settings.group_data") || "Cadangan & Pembersihan Data",
      items: [
        {
          id: "backup",
          title: t("settings.backup_title") || "Cadangkan Data (Backup)",
          description:
            t("settings.backup_desc") ||
            "Unduh semua transaksi, anggaran, & aset ke file JSON",
          icon: <Download size={20} />,
          color: "#0284c7",
        },
        {
          id: "restore",
          title: t("settings.restore_title") || "Pulihkan Data (Restore)",
          description:
            t("settings.restore_desc") || "Impor file JSON cadangan untuk memulihkan data Anda",
          icon: <Upload size={20} />,
          color: "#2563eb",
        },
        {
          id: "reset",
          title: t("settings.reset_title") || "Hapus Semua Data",
          description:
            t("settings.reset_desc") || "Kosongkan seluruh data keuangan untuk mulai mencatat baru",
          icon: <Trash2 size={20} />,
          color: "#dc2626",
        },
      ],
    },
    {
      id: "aplikasi",
      title: t("settings.group_app") || "Aplikasi",
      items: [
        {
          id: "install",
          title: t("settings.install_title"),
          description: t("settings.install_desc"),
          icon: <Smartphone size={20} />,
          href: "/pengaturan/install",
          color: "#0891b2",
        },
        {
          id: "pin",
          title: "Keamanan PIN",
          description: "Kunci layar aplikasi dengan PIN 4 angka",
          icon: <Lock size={20} />,
          color: "#8b5cf6",
        },
      ],
    },
  ];

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: "3rem" }}>

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
          gap: "1.75rem",
        }}
      >
        {SETTINGS_GROUPS.map((group) => (
          <div key={group.id} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <h3
              style={{
                fontSize: "0.8125rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-text-muted)",
                paddingLeft: "0.5rem",
                marginBottom: "0.25rem",
              }}
            >
              {group.title}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {group.items.map((item) => {
                const cardContent = (
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
                      textAlign: "left",
                      width: "100%",
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
                        width: 44,
                        height: 44,
                        borderRadius: "12px",
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
                      <h4
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: 700,
                          margin: 0,
                          color: "var(--color-text)",
                        }}
                      >
                        {item.title}
                      </h4>
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
                      size={18}
                      style={{ color: "var(--color-text-faint)", flexShrink: 0 }}
                    />
                  </div>
                );

                if (item.href) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {cardContent}
                    </Link>
                  );
                }

                const isDisabled = isResetting && item.id === "reset";

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    disabled={isDisabled}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      width: "100%",
                      fontFamily: "inherit",
                      opacity: isDisabled ? 0.5 : 1,
                      cursor: isDisabled ? "not-allowed" : "pointer",
                    }}
                  >
                    {cardContent}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Romantic Footer Signature */}
      <div
        style={{
          marginTop: "4rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
          opacity: 0.85,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
            Dibuat dengan
          </span>
          <Heart size={13} fill="var(--color-expense)" color="var(--color-expense)" className="animate-pulse-heart" />
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
            untuk Istri Tercinta
          </span>
        </div>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-faint)", fontWeight: 400 }}>
          Sintya Finance • v1.0.0
        </span>
      </div>

      {/* Double Confirmation Reset Modal */}
      {isResetModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "20px",
              padding: "1.75rem",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              position: "relative",
              animation: "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <button
              onClick={() => {
                if (!isResetting) {
                  setIsResetModalOpen(false);
                  setResetWord("");
                }
              }}
              disabled={isResetting}
              style={{
                position: "absolute",
                top: "1.25rem",
                right: "1.25rem",
                background: "none",
                border: "none",
                color: "var(--color-text-muted)",
                cursor: isResetting ? "not-allowed" : "pointer",
                opacity: isResetting ? 0.4 : 1,
              }}
            >
              <X size={18} />
            </button>

            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1.25rem",
              }}
            >
              <Trash2 size={24} />
            </div>

            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 800,
                color: "var(--color-text)",
                margin: "0 0 0.5rem 0",
              }}
            >
              {t("settings.reset_modal_title")}
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                lineHeight: "1.5",
                margin: "0 0 1.5rem 0",
              }}
            >
              {t("settings.reset_modal_desc")}
            </p>

            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  marginBottom: "0.375rem",
                }}
              >
                {(t("settings.reset_modal_confirm_label") || "Ketik {word} untuk konfirmasi").replace(
                  "{word}",
                  t("settings.reset_modal_confirm_word")
                )}
              </label>
              <input
                type="text"
                value={resetWord}
                onChange={(e) => setResetWord(e.target.value)}
                disabled={isResetting}
                placeholder={t("settings.reset_modal_confirm_word")}
                style={{
                  width: "100%",
                  padding: "0.625rem 0.75rem",
                  borderRadius: "10px",
                  border: `1px solid ${
                    resetWord && resetWord !== t("settings.reset_modal_confirm_word")
                      ? "#dc2626"
                      : "var(--color-border-subtle)"
                  }`,
                  background: "var(--color-surface-offset)",
                  color: "var(--color-text)",
                  fontSize: "0.875rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetWord("");
                }}
                disabled={isResetting}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "10px",
                  background: "var(--color-surface-offset)",
                  border: "1px solid var(--color-border-subtle)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  cursor: isResetting ? "not-allowed" : "pointer",
                  opacity: isResetting ? 0.5 : 1,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isResetting) e.currentTarget.style.background = "var(--color-border-subtle)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--color-surface-offset)";
                }}
              >
                {t("settings.reset_modal_cancel")}
              </button>
              <button
                onClick={handleResetData}
                disabled={isResetting || resetWord !== t("settings.reset_modal_confirm_word")}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "10px",
                  background: isResetting || resetWord !== t("settings.reset_modal_confirm_word") ? "#94a3b8" : "#dc2626",
                  border: "none",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#ffffff",
                  cursor: isResetting || resetWord !== t("settings.reset_modal_confirm_word") ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onMouseEnter={(e) => {
                  if (!isResetting && resetWord === t("settings.reset_modal_confirm_word")) {
                    e.currentTarget.style.background = "#b91c1c";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    isResetting || resetWord !== t("settings.reset_modal_confirm_word") ? "#94a3b8" : "#dc2626";
                }}
              >
                {isResetting && (
                  <span
                    style={{
                      width: "14px",
                      height: "14px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                      display: "inline-block",
                    }}
                  />
                )}
                {isResetting ? t("settings.reset_loading") : t("settings.reset_modal_confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      <RestoreModal 
        isOpen={isRestoreModalOpen} 
        onClose={() => setIsRestoreModalOpen(false)} 
      />

      <PinSetupModal 
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
