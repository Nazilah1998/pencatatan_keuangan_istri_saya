"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { settingsSchema, SettingsSchema } from "@/lib/validations";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, Palette } from "lucide-react";
import Link from "next/link";
import { AppSettings } from "@/types";

const PRESET_COLORS = [
  { name: "Pink Pastel", hex: "#ff85a2" },
  { name: "Emerald Green", hex: "#10b981" },
  { name: "Indigo Blue", hex: "#6366f1" },
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Amber Orange", hex: "#f59e0b" },
  { name: "Sky Blue", hex: "#0ea5e9" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Slate", hex: "#475569" },
];

export default function TemaPage() {
  const { settings, setSettings } = useAppStore();

  const { register, handleSubmit, reset, watch, setValue } =
    useForm<SettingsSchema>({
      resolver: zodResolver(settingsSchema),
      defaultValues: settings as SettingsSchema,
    });

  // eslint-disable-next-line react-hooks/incompatible-library
  const currentThemeColor = watch("tema_warna");

  useEffect(() => {
    reset(settings as SettingsSchema);
  }, [settings, reset]);

  const onSubmit = async (data: SettingsSchema) => {
    const updatedSettings: AppSettings = {
      ...settings,
      ...data,
      mata_uang: "IDR",
    };
    setSettings(updatedSettings);
    toast.success("Warna tema berhasil diperbarui");
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
        <ChevronLeft size={18} /> Kembali ke Pengaturan
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
              background: "rgba(236, 72, 153, 0.1)",
              color: "#ec4899",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Palette size={20} />
          </div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            Ubah Tema
          </h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          Sesuaikan suasana aplikasi dengan warna favorit Anda
        </p>
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
        >
          <div>
            <label className="form-label" style={{ marginBottom: "1rem" }}>
              Pilih Warna Utama
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "1rem",
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
                    aspectRatio: "1/1",
                    borderRadius: "16px",
                    backgroundColor: preset.hex,
                    border:
                      currentThemeColor === preset.hex
                        ? "4px solid var(--color-text)"
                        : "2px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform:
                      currentThemeColor === preset.hex
                        ? "scale(1.05)"
                        : "scale(1)",
                    boxShadow:
                      currentThemeColor === preset.hex
                        ? `0 8px 16px ${preset.hex}40`
                        : "var(--shadow-sm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title={preset.name}
                >
                  {currentThemeColor === preset.hex && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "white",
                        boxShadow: "0 0 4px rgba(0,0,0,0.5)",
                      }}
                    />
                  )}
                </button>
              ))}

              {/* Custom Color Picker */}
              <div
                style={{
                  position: "relative",
                  aspectRatio: "1/1",
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
                />
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "16px",
                    background: currentThemeColor,
                    border: "2px dashed var(--color-text-faint)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    color: "white",
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                    pointerEvents: "none",
                  }}
                >
                  +
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "var(--color-surface-offset)",
              padding: "1rem",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                color: "var(--color-text-muted)",
                fontSize: "0.8125rem",
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: currentThemeColor,
                }}
              />
              Warna terpilih: <strong>{currentThemeColor}</strong>
            </div>
          </div>

          <Button type="submit" fullWidth>
            Terapkan Tema Baru
          </Button>
        </form>
      </div>
    </div>
  );
}
