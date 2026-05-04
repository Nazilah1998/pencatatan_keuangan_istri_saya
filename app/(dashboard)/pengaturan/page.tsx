"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { settingsSchema, SettingsSchema } from "@/lib/validations";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { usePWA } from "@/components/providers/PWAProvider";
import {
  Smartphone,
  Download,
  CheckCircle2,
  Loader2,
  Palette,
  Fingerprint,
  ShieldAlert,
} from "lucide-react";
import { InstallModal } from "@/components/layout/InstallModal";
import { AppSettings } from "@/types";

const PRESET_COLORS = [
  { name: "Pink Pastel", hex: "#ff85a2" },
  { name: "Emerald Green", hex: "#10b981" },
  { name: "Indigo Blue", hex: "#6366f1" },
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Amber Orange", hex: "#f59e0b" },
];

export default function PengaturanPage() {
  const { settings, setSettings, isBiometricEnabled, setBiometricEnabled } =
    useAppStore();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isActuallyInstalled, setIsActuallyInstalled] = useState(false);
  const { isInstallable, isIOS, installApp } = usePWA();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings as SettingsSchema,
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const currentThemeColor = watch("tema_warna");

  // Check if the app is running in standalone mode (installed)
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ||
      document.referrer.includes("android-app://");

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
      mata_uang: "IDR", // Strictly enforce the literal type
    };
    setSettings(updatedSettings);
    toast.success("Pengaturan berhasil disimpan");
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
          Konfigurasi tampilan dan keamanan aplikasi
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* PWA Installation Card */}
        <div
          className="card"
          style={{
            padding: "1.5rem",
            background:
              "linear-gradient(135deg, var(--color-surface), var(--color-surface-offset))",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
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
              flexShrink: 0,
            }}
          >
            <Smartphone size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                marginBottom: "0.25rem",
              }}
            >
              Aplikasi Mobile
            </h3>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
                lineHeight: 1.4,
              }}
            >
              Pasang Tyaaa Financee di layar utama HP Anda agar akses lebih
              cepat dan mudah.
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
                borderRadius: "var(--radius-md)",
              }}
            >
              <CheckCircle2 size={16} />
              Terpasang
            </div>
          ) : isInstallable || isIOS ? (
            <Button
              onClick={handleInstallClick}
              variant="primary"
              size="sm"
              style={{ paddingLeft: "1rem", paddingRight: "1rem" }}
            >
              <Download size={16} style={{ marginRight: "0.5rem" }} />
              {isIOS ? "Cara Install" : "Install"}
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
                border: "1px solid var(--color-border)",
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

              {/* Theme Color Picker */}
              <div className="form-group" style={{ marginTop: "1.5rem" }}>
                <label
                  className="form-label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Palette size={16} /> Tema Warna Utama
                </label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() =>
                        setValue("tema_warna", preset.hex, {
                          shouldDirty: true,
                        })
                      }
                      style={{
                        width: "2.5rem",
                        height: "2.5rem",
                        borderRadius: "50%",
                        backgroundColor: preset.hex,
                        border:
                          currentThemeColor === preset.hex
                            ? "3px solid var(--color-text)"
                            : "2px solid transparent",
                        cursor: "pointer",
                        transition: "transform 0.2s, border 0.2s",
                        transform:
                          currentThemeColor === preset.hex
                            ? "scale(1.1)"
                            : "scale(1)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                      title={preset.name}
                      aria-label={`Pilih warna ${preset.name}`}
                    />
                  ))}

                  {/* Custom Color Input */}
                  <div
                    style={{
                      position: "relative",
                      width: "2.5rem",
                      height: "2.5rem",
                    }}
                  >
                    <input
                      type="color"
                      {...register("tema_warna")}
                      style={{
                        position: "absolute",
                        opacity: 0,
                        width: "100%",
                        height: "100%",
                        cursor: "pointer",
                      }}
                      title="Pilih Warna Kustom"
                    />
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        background: currentThemeColor || "#ff85a2",
                        border: "1px dashed var(--color-text-muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "1.2rem",
                          color: "white",
                          textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                        }}
                      >
                        +
                      </span>
                    </div>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    marginTop: "0.5rem",
                  }}
                >
                  Pilih warna preset atau klik tombol <b>+</b> untuk warna
                  kustom.
                </p>
              </div>
            </div>

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
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <ShieldAlert size={18} color="var(--color-primary)" /> Keamanan
              </h3>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "var(--color-surface-offset)",
                  padding: "1rem",
                  borderRadius: "16px",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <div
                  style={{ display: "flex", gap: "1rem", alignItems: "center" }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "12px",
                      background: isBiometricEnabled
                        ? "var(--color-primary-highlight)"
                        : "var(--color-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isBiometricEnabled
                        ? "var(--color-primary)"
                        : "var(--color-text-muted)",
                    }}
                  >
                    <Fingerprint size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                      Kunci Biometrik
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Gunakan Sidik Jari / FaceID
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBiometricEnabled(!isBiometricEnabled)}
                  style={{
                    width: "52px",
                    height: "28px",
                    borderRadius: "14px",
                    background: isBiometricEnabled
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                    position: "relative",
                    cursor: "pointer",
                    border: "none",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    padding: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: isBiometricEnabled ? "26px" : "2px",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "white",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                </button>
              </div>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  marginTop: "0.75rem",
                }}
              >
                Jika diaktifkan, Anda perlu melakukan verifikasi sidik jari
                setiap kali membuka aplikasi.
              </p>
            </div>

            <Button type="submit">Simpan Pengaturan</Button>
          </form>
        </div>
      </div>

      {/* Modern Install Modal */}
      <InstallModal
        isOpen={showInstallModal}
        isIOS={isIOS}
        onClose={() => setShowInstallModal(false)}
        onConfirm={handleConfirmInstall}
      />
    </div>
  );
}
