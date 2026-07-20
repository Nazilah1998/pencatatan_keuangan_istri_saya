"use client";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { settingsSchema, SettingsSchema } from "@/lib/validations";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, Palette, Moon, Sun } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppSettings } from "@/types";
import { updateProfile } from "@/app/actions/profiles";

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

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((ch) => ch + ch).join("");
  const num = parseInt(c, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function getBrightness(r: number, g: number, b: number): number {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function getAdjustAmount(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const brightness = getBrightness(r, g, b);
  // Darker colors need larger adjustment for visible hover effect
  if (brightness < 60) return -50;
  if (brightness < 128) return -35;
  return -20;
}

function adjustColor(hex: string): string {
  const amount = getAdjustAmount(hex);
  let color = hex.replace("#", "");
  if (color.length === 3)
    color = color.split("").map((c) => c + c).join("");
  const num = parseInt(color, 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00ff) + amount;
  let b = (num & 0x0000ff) + amount;
  r = Math.max(Math.min(255, r), 0);
  g = Math.max(Math.min(255, g), 0);
  b = Math.max(Math.min(255, b), 0);
  return `#${(b | (g << 8) | (r << 16)).toString(16).padStart(6, "0")}`;
}

interface TemaClientProps {
  initialSettings: Partial<AppSettings>;
}

export function TemaClient({ initialSettings }: TemaClientProps) {
  const { t } = useTranslation();
  const { settings: storeSettings, setSettings: setStoreSettings, setLastManualSyncStr, user } =
    useAppStore();
  const router = useRouter();

  const { register, handleSubmit, setValue, control } = useForm<SettingsSchema>(
    {
      resolver: zodResolver(settingsSchema),
      defaultValues: initialSettings as SettingsSchema,
    },
  );

  const currentThemeColor = useWatch({
    control,
    name: "tema_warna",
  });

  const currentModeGelap = useWatch({
    control,
    name: "mode_gelap",
  });

  // Real-time preview effect
  React.useEffect(() => {
    if (currentThemeColor) {
      const root = document.documentElement;
      root.style.setProperty("--color-primary", currentThemeColor);
      root.style.setProperty(
        "--color-primary-hover",
        adjustColor(currentThemeColor),
      );
      root.style.setProperty(
        "--color-primary-highlight",
        `${currentThemeColor}26`,
      );
    }
  }, [currentThemeColor]);

  const onSubmit = async (data: SettingsSchema) => {
    const updatedSettings = {
      ...storeSettings,
      ...data,
      bahasa: storeSettings.bahasa,
    };

    setStoreSettings(updatedSettings);

    const syncStr = JSON.stringify(updatedSettings);
    setLastManualSyncStr(syncStr);

    if (user) {
      updateProfile(updatedSettings).catch((err) => {
        console.error("Failed to sync theme settings:", err);
      });
    }

    toast.success(t("settings.theme.success"));

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
            {t("settings.theme.title")}
          </h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          {t("settings.theme.subtitle")}
        </p>
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
        >
          <div>
            <label className="form-label" style={{ marginBottom: "1rem" }}>
              {t("settings.theme.label")}
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
                    setValue("tema_warna", preset.hex, { shouldDirty: true })
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
                    transition: "all 0.2s",
                  }}
                />
              ))}
              <div style={{ position: "relative", aspectRatio: "1/1" }}>
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
                  }}
                >
                  +
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <label className="form-label" style={{ marginBottom: "1rem" }}>
              Mode Tampilan
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
              {[
                { id: "light", label: "Terang", icon: <Sun size={20} /> },
                { id: "dark", label: "Gelap", icon: <Moon size={20} /> },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setValue("mode_gelap", mode.id as "light" | "dark", { shouldDirty: true })}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "1rem",
                    borderRadius: "12px",
                    border: currentModeGelap === mode.id 
                      ? "2px solid var(--color-primary)" 
                      : "1px solid var(--color-border-subtle)",
                    background: currentModeGelap === mode.id 
                      ? "var(--color-primary-highlight)" 
                      : "var(--color-surface)",
                    color: currentModeGelap === mode.id 
                      ? "var(--color-primary)" 
                      : "var(--color-text-muted)",
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                >
                  {mode.icon}
                  <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" fullWidth>
            {t("settings.theme.save")}
          </Button>
        </form>
      </div>
    </div>
  );
}
