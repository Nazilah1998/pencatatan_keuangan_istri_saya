"use client";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { settingsSchema, SettingsSchema } from "@/lib/validations";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, User2, Upload, Trash2, Camera } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { AppSettings } from "@/types";
import { updateProfile } from "@/app/actions/profiles";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface PreferensiClientProps {
  initialSettings: Partial<AppSettings>;
}

export function PreferensiClient({ initialSettings }: PreferensiClientProps) {
  const { t } = useTranslation();
  const {
    user,
    settings: storeSettings,
    setSettings: setStoreSettings,
  } = useAppStore();
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialSettings as SettingsSchema,
  });

  const logoUrl = useWatch({
    control,
    name: "logo_url",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error(t("settings.preference.auth_error"));
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error(t("settings.preference.size_error"));
      return;
    }

    const loadingToast = toast.loading(t("settings.preference.uploading"));
    try {
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
      toast.success(t("settings.preference.upload_success"), {
        id: loadingToast,
      });
    } catch (err: unknown) {
      console.error("Upload error:", err);
      toast.error(t("settings.preference.upload_error"), { id: loadingToast });
    }

  };


  const onSubmit = async (data: SettingsSchema) => {
    const updatedSettings = {
      ...storeSettings,
      ...data,
      bahasa: storeSettings.bahasa, // Tetapkan bahasa dari store
    };

    // Update local store first
    setStoreSettings(updatedSettings);

    // Sync with cloud if logged in
    const result = await updateProfile(updatedSettings);

    if (result.success) {
      toast.success(t("settings.preference.success"));
    } else if (!user) {
      // If no user, it's Guest Mode, show success anyway for local change
      toast.success(t("settings.preference.success"));
    } else {
      toast.error(t("settings.preference.error"));
      return;
    }

    setTimeout(() => {
      router.back();
    }, 500);
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
            {t("settings.preference.title")}
          </h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          {t("settings.preference.subtitle")}
        </p>
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
        >
          <div style={{ textAlign: "center" }}>
            <label
              className="form-label"
              style={{ marginBottom: "1rem", display: "block" }}
            >
              {t("settings.preference.logo_label")}
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
                  <Camera size={32} color="var(--color-text-faint)" />
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
                    {t("settings.preference.change_photo")}
                  </Button>
                </div>
                {logoUrl && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setValue("logo_url", "")}
                    style={{ color: "var(--color-danger)" }}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            <div className="form-group">
              <label className="form-label">
                {t("settings.preference.nickname_label")}
              </label>
              <input
                type="text"
                className={`input ${errors.nama_panggilan ? "input-error" : ""}`}
                {...register("nama_panggilan")}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                {t("settings.preference.household_label")}
              </label>
              <input
                type="text"
                className={`input ${errors.nama_rumah_tangga ? "input-error" : ""}`}
                {...register("nama_rumah_tangga")}
              />
            </div>
          </div>
          <Button type="submit" fullWidth>
            {t("settings.preference.save")}
          </Button>
        </form>
      </div>
    </div>
  );
}
