"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { settingsSchema, SettingsSchema } from "@/lib/validations";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, User2, Upload, Trash2, Camera } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppSettings } from "@/types";

export default function PreferensiPage() {
  const { settings, setSettings } = useAppStore();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings as SettingsSchema,
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const logoUrl = watch("logo_url");

  useEffect(() => {
    reset(settings as SettingsSchema);
  }, [settings, reset]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast.error("Ukuran file maksimal 1MB");
      return;
    }

    // Validate type
    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diperbolehkan");
      return;
    }

    const loadingToast = toast.loading("Mengunggah gambar...");

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Unauthorized");

      const fileExt = file.name.split(".").pop();
      const fileName = `${userData.user.id}-${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("user-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("user-assets").getPublicUrl(filePath);

      setValue("logo_url", publicUrl, { shouldDirty: true });
      toast.success("Logo berhasil diunggah", { id: loadingToast });
    } catch (error: unknown) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error("Gagal mengunggah gambar: " + message, { id: loadingToast });
    }
  };

  const removeLogo = () => {
    setValue("logo_url", "", { shouldDirty: true });
    toast.success("Logo dihapus");
  };

  const onSubmit = async (data: SettingsSchema) => {
    const updatedSettings: AppSettings = {
      ...settings,
      ...data,
      mata_uang: "IDR",
    };
    setSettings(updatedSettings);
    toast.success("Preferensi berhasil disimpan");
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
              background: "rgba(99, 102, 241, 0.1)",
              color: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <User2 size={20} />
          </div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            Preferensi Tampilan
          </h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          Sesuaikan cara aplikasi menyapa dan mengenali rumah tangga Anda
        </p>
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
        >
          {/* Logo Upload Section */}
          <div style={{ textAlign: "center" }}>
            <label
              className="form-label"
              style={{ marginBottom: "1rem", display: "block" }}
            >
              Logo Aplikasi (Sidebar)
            </label>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 100,
                  height: 100,
                  borderRadius: "24px",
                  background: "var(--color-surface-offset)",
                  border: "2px dashed var(--color-border)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="Logo"
                    fill
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      color: "var(--color-text-faint)",
                    }}
                  >
                    <Camera size={32} />
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div style={{ position: "relative" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      inset: 0,
                      cursor: "pointer",
                      width: "100%",
                    }}
                  />
                  <Button type="button" variant="secondary" size="sm">
                    <Upload size={16} style={{ marginRight: "0.5rem" }} />
                    Ganti Foto
                  </Button>
                </div>
                {logoUrl && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={removeLogo}
                    style={{
                      color: "var(--color-danger)",
                      borderColor: "rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                }}
              >
                Rekomendasi: Gambar persegi (1:1), Maks 1MB.
              </p>
            </div>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            <div className="form-group">
              <label className="form-label">Nama Panggilan (Greeting)</label>
              <input
                type="text"
                placeholder="Contoh: Tya"
                className={`input ${errors.nama_panggilan ? "input-error" : ""}`}
                {...register("nama_panggilan")}
              />
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  marginTop: "0.25rem",
                }}
              >
                Nama ini akan muncul di sapaan Dashboard.
              </p>
              {errors.nama_panggilan && (
                <span className="form-error">
                  {errors.nama_panggilan.message}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Nama Rumah Tangga</label>
              <input
                type="text"
                placeholder="Contoh: Rumah Tangga Bahagia"
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

          <div style={{ marginTop: "0.5rem" }}>
            <Button type="submit" fullWidth>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
