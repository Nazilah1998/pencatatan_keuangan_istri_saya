"use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { TransactionForm } from "@/components/transaksi/TransactionForm";
import { Button } from "@/components/ui/Button";
import { getProfile } from "@/app/actions/profiles";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { AppSettings } from "@/types";

export default function TambahTransaksiPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Partial<AppSettings> | undefined>(
    undefined,
  );

  useEffect(() => {
    const fetchSettings = async () => {
      const profileRes = await getProfile();
      if (profileRes.success) {
        setSettings(profileRes.data);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <Link href="/transaksi">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--color-text)",
            }}
          >
            {t("transactions.form.add_title")}
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            {t("transactions.subtitle")}
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        <TransactionForm initialSettings={settings} />
      </div>
    </div>
  );
}
