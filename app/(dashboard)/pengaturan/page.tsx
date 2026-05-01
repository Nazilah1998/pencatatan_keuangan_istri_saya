"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { settingsSchema, SettingsSchema } from "@/lib/validations";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { initializeSheet } from "@/lib/google-sheets";

export default function PengaturanPage() {
  const { settings, setSettings } = useAppStore();
  const [isSyncing, setIsSyncing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  const onSubmit = async (data: SettingsSchema) => {
    setSettings(data);
    toast.success("Pengaturan berhasil disimpan");
  };

  const handleSyncSheets = async () => {
    if (!settings.google_sheet_id) {
      toast.error("Google Sheet ID belum diisi");
      return;
    }
    setIsSyncing(true);
    const result = await initializeSheet(settings.google_sheet_id);
    setIsSyncing(false);
    if (result.success) {
      toast.success("Berhasil sinkronisasi dan membuat tab di Google Sheets");
    } else {
      toast.error(result.error || "Gagal sinkronisasi");
    }
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
  );
}
