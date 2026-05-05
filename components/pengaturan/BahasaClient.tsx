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

import { AppSettings } from "@/types";
import { updateProfile } from "@/app/actions/profiles";
import { translations } from "@/lib/i18n/dictionaries";

const LANGUAGES = [
  { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "en", name: "English", flag: "🇺🇸" },
] as const;

interface BahasaClientProps {
  initialSettings: Partial<AppSettings>;
}

export function BahasaClient({}: BahasaClientProps) {
  const router = useRouter();
  const { settings: storeSettings, setSettings: setStoreSettings } =
    useAppStore();

  const { handleSubmit, setValue, control } = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      ...storeSettings,
      bahasa: (storeSettings.bahasa as keyof typeof translations) || "en",
    } as SettingsSchema,
  });
  const currentLang = useWatch({
    control,
    name: "bahasa",
  }) as keyof typeof translations;

  // Local translation function for preview
  const tp = (keyPath: string): string => {
    const dict = translations[currentLang] || translations["en"];
    const keys = keyPath.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = dict;
    for (const key of keys) {
      if (!current || current[key] === undefined) {
        // Fallback to ID for preview too
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let fallback: any = translations["id"];
        for (const fbKey of keys) {
          if (fallback && fallback[fbKey] !== undefined)
            fallback = fallback[fbKey];
          else return keyPath;
        }
        return fallback as string;
      }
      current = current[key];
    }
    return current as string;
  };

  const onSubmit = async (data: SettingsSchema) => {
    const updatedSettings = {
      ...storeSettings,
      ...data,
      mata_uang: "IDR" as const,
    };

    // Always update local store first for instant response (especially for Guests)
    setStoreSettings(updatedSettings);

    // Attempt to sync with cloud if logged in
    await updateProfile(updatedSettings);

    toast.success(tp("settings.lang.success"));

    // Redirect to previous page automatically
    setTimeout(() => {
      router.back();
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
        <ChevronLeft size={18} /> {tp("settings.back")}
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
            {tp("settings.lang.title")}
          </h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          {tp("settings.lang.subtitle")}
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
            {tp("settings.lang.save")}
          </Button>
        </form>
      </div>
    </div>
  );
}
