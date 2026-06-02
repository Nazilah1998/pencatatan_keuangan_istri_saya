"use client";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { settingsSchema, SettingsSchema } from "@/lib/validations";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Check, ChevronLeft, Banknote } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { updateProfile } from "@/app/actions/profiles";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { CURRENCIES } from "@/lib/utils/currency";
import { AppSettings } from "@/types";

interface MataUangClientProps {
  initialSettings?: Partial<AppSettings>;
}

export function MataUangClient({}: MataUangClientProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { settings: storeSettings, setSettings: setStoreSettings, fetchExchangeRates, setLastManualSyncStr, user } =
    useAppStore();

  const { handleSubmit, setValue, control } = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      ...storeSettings,
      mata_uang: storeSettings.mata_uang || "IDR",
    } as SettingsSchema,
  });
  const currentCurrency = useWatch({
    control,
    name: "mata_uang",
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
        console.error("Failed to sync currency settings:", err);
      });
    }

    // Fetch exchange rates for the new currency
    try {
      await fetchExchangeRates(true);
    } catch {
      toast.error("Gagal memperbarui nilai tukar, data mungkin tidak akurat");
    }

    toast.success(
      t("settings.currency.success") || "Mata uang berhasil diperbarui",
    );

    setTimeout(() => {
      router.push("/pengaturan");
    }, 500);
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: "2rem" }}>
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
              background: "rgba(245, 158, 11, 0.1)",
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Banknote size={20} />
          </div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            {t("settings.currency.title") || "Pilih Mata Uang"}
          </h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          {t("settings.currency.subtitle") ||
            "Sesuaikan mata uang yang akan ditampilkan"}
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
            {CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                type="button"
                onClick={() =>
                  setValue("mata_uang", currency.code, { shouldDirty: true })
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1.25rem",
                  borderRadius: "16px",
                  border:
                    currentCurrency === currency.code
                      ? "2px solid var(--color-primary)"
                      : "1px solid var(--color-border)",
                  background:
                    currentCurrency === currency.code
                      ? "var(--color-primary-highlight)"
                      : "var(--color-surface)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <span
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "var(--color-text-muted)",
                      width: "32px",
                      textAlign: "center",
                    }}
                  >
                    {currency.symbol}
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        currentCurrency === currency.code
                          ? "var(--color-primary)"
                          : "var(--color-text)",
                    }}
                  >
                    {currency.name} ({currency.code})
                  </span>
                </div>
                {currentCurrency === currency.code && (
                  <Check size={20} color="var(--color-primary)" />
                )}
              </button>
            ))}
          </div>
          <Button type="submit" fullWidth>
            {t("settings.currency.save") || "Simpan Mata Uang"}
          </Button>
        </form>
      </div>
    </div>
  );
}
