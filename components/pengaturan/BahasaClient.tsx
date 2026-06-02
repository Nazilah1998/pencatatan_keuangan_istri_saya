"use client";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { settingsSchema, SettingsSchema } from "@/lib/validations";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Check, ChevronLeft, Languages } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { updateProfile } from "@/app/actions/profiles";
import {
  LANGUAGES as ALL_LANGUAGES,
} from "@/lib/i18n/dictionaries";
import { useTranslation } from "@/lib/i18n/useTranslation";

const LANGUAGES = ALL_LANGUAGES.map((l) => ({
  code: l.id,
  name: l.name,
  flag: l.flag,
}));

export function BahasaClient() {
  const router = useRouter();
  const { t } = useTranslation();
  const { settings: storeSettings, setSettings: setStoreSettings, setLastManualSyncStr, user } =
    useAppStore();

  const { handleSubmit, setValue, control } = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      ...storeSettings,
    } as SettingsSchema,
  });
  const currentLang = useWatch({
    control,
    name: "bahasa",
  });

  const onSubmit = async (data: SettingsSchema) => {
    const updatedSettings = {
      ...storeSettings,
      ...data,
    };

    setStoreSettings(updatedSettings);

    const syncStr = JSON.stringify(updatedSettings);
    setLastManualSyncStr(syncStr);

    if (user) {
      updateProfile(updatedSettings).catch((err) => {
        console.error("Failed to sync language settings:", err);
      });
    }

    toast.success(t("settings.lang.success"));

    setTimeout(() => {
      router.push("/pengaturan");
    }, 500);
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
              background: "rgba(16, 185, 129, 0.1)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Languages size={20} />
          </div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            {t("settings.lang.title")}
          </h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          {t("settings.lang.subtitle")}
        </p>
      </div>

      <div className="card" style={{ padding: "1.5rem" }}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() =>
                  setValue("bahasa", lang.code, { shouldDirty: true })
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1.25rem",
                  borderRadius: "16px",
                  border:
                    currentLang === lang.code
                      ? "2px solid var(--color-primary)"
                      : "1px solid var(--color-border)",
                  background:
                    currentLang === lang.code
                      ? "var(--color-primary-highlight)"
                      : "var(--color-surface)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{lang.flag}</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        currentLang === lang.code
                          ? "var(--color-primary)"
                          : "var(--color-text)",
                    }}
                  >
                    {lang.name}
                  </span>
                </div>
                {currentLang === lang.code && (
                  <Check size={20} color="var(--color-primary)" />
                )}
              </button>
            ))}
          </div>
          <Button type="submit" fullWidth>
            {t("settings.lang.save")}
          </Button>
        </form>
      </div>
    </div>
  );
}
