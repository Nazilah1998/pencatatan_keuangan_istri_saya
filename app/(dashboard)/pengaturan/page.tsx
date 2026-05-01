"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { settingsSchema, SettingsSchema } from "@/lib/validations";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { initializeSheet } from "@/lib/google-sheets";
import { usePWA } from "@/components/providers/PWAProvider";
import { Smartphone, Download, CheckCircle2, Loader2 } from "lucide-react";
import { InstallModal } from "@/components/layout/InstallModal";
import { AppSettings } from "@/types";

export default function PengaturanPage() {
  const { settings, setSettings } = useAppStore();
  const [isSyncing, setIsLoading] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isActuallyInstalled, setIsActuallyInstalled] = useState(false);
  const { isInstallable, installApp } = usePWA();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings as SettingsSchema,
  });

  // Check if the app is running in standalone mode (installed)
  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as Navigator & { standalone?: boolean }).standalone
      || document.referrer.includes("android-app://");
    
    const timer = requestAnimationFrame(() => {
      setIsActuallyInstalled(isStandalone);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  // Sync form with settings when they change
  useEffect(() => {
    reset(settings as SettingsSchema);
  }, [settings, reset]);

  const onSubmit = async (data: SettingsSchema) => {
    // Merge existing settings with form data to ensure all required fields are present
    const updatedSettings: AppSettings = {
      ...settings,
      ...data,
      mata_uang: "IDR" // Strictly enforce the literal type
    };
    setSettings(updatedSettings);
    toast.success("Pengaturan berhasil disimpan");
  };

  const handleSyncSheets = async () => {
    if (!settings.google_sheet_id) {
      toast.error("Google Sheet ID belum diisi");
      return;
    }
    setIsLoading(true);
    const result = await initializeSheet(settings.google_sheet_id);
    setIsLoading(false);
    if (result.success) {
      toast.success("Berhasil sinkronisasi dan membuat tab di Google Sheets");
    } else {
      toast.error(result.error || "Gagal sinkronisasi");
    }
  };

  const handleInstallClick = () => {
    setShowInstallModal(true);
  };

  const handleConfirmInstall = () => {
    setShowInstallModal(false);
    installApp();
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--color-text)",
          }}
        >
          Pengaturan
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          Konfigurasi aplikasi dan Google Sheets
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* PWA Installation Card */}
        <div 
          className="card" 
          style={{ 
            padding: "1.5rem", 
            background: "linear-gradient(135deg, var(--color-surface), var(--color-surface-offset))",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: "1.25rem"
          }}
        >
          <div 
            style={{ 
              width: 54, 
              height: 54, 
              background: "var(--color-primary-highlight)", 
              borderRadius: "var(--radius-lg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary)",
              flexShrink: 0
            }}
          >
            <Smartphone size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>
              Aplikasi Mobile
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", lineHeight: 1.4 }}>
              Pasang Tyaaa Financee di layar utama HP Anda agar akses lebih cepat dan mudah.
            </p>
          </div>
          
          {isActuallyInstalled ? (
            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.375rem", 
                color: "#10b981", 
                fontSize: "0.8125rem", 
                fontWeight: 600,
                background: "rgba(16, 185, 129, 0.1)",
                padding: "0.5rem 0.75rem",
                borderRadius: "var(--radius-md)"
              }}
            >
              <CheckCircle2 size={16} />
              Terpasang
            </div>
          ) : isInstallable ? (
            <Button 
              onClick={handleInstallClick} 
              variant="primary" 
              size="sm"
              style={{ paddingLeft: "1rem", paddingRight: "1rem" }}
            >
              <Download size={16} style={{ marginRight: "0.5rem" }} />
              Install
            </Button>
          ) : (
            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.375rem", 
                color: "var(--color-text-muted)", 
                fontSize: "0.75rem", 
                fontWeight: 500,
                background: "var(--color-surface-offset)",
                padding: "0.5rem 0.75rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)"
              }}
            >
              <Loader2 size={14} className="animate-spin" />
              Menunggu...
            </div>
          )}
        </div>

        {/* Main Settings Card */}
        <div className="card" style={{ padding: "2rem" }}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            <div
              style={{
                borderBottom: "1px solid var(--color-divider)",
                paddingBottom: "1.5rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                Preferensi Aplikasi
              </h3>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Nama Rumah Tangga</label>
                <input
                  type="text"
                  className={`input ${errors.nama_rumah_tangga ? "input-error" : ""}`}
                  {...register("nama_rumah_tangga")}
                />
                {errors.nama_rumah_tangga && (
                  <span className="form-error">
                    {errors.nama_rumah_tangga.message}
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                borderBottom: "1px solid var(--color-divider)",
                paddingBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>
                  Koneksi Google Sheets
                </h3>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSyncSheets}
                  loading={isSyncing}
                >
                  Sync & Buat Tab
                </Button>
              </div>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Spreadsheet ID</label>
                <input
                  type="text"
                  placeholder="ID dari URL Google Sheets..."
                  className={`input ${errors.google_sheet_id ? "input-error" : ""}`}
                  {...register("google_sheet_id")}
                />
                {errors.google_sheet_id && (
                  <span className="form-error">
                    {errors.google_sheet_id.message}
                  </span>
                )}
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    marginTop: "0.25rem",
                  }}
                >
                  Contoh: https://docs.google.com/spreadsheets/d/
                  <strong>1A2b3C...</strong>/edit
                </p>
              </div>
            </div>

            <Button type="submit">Simpan Pengaturan</Button>
          </form>
        </div>
      </div>

      {/* Modern Install Modal */}
      <InstallModal 
        isOpen={showInstallModal} 
        onClose={() => setShowInstallModal(false)} 
        onConfirm={handleConfirmInstall} 
      />
    </div>
  );
}
