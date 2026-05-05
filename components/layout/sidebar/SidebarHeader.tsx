"use client";
import React from "react";
import Image from "next/image";

import { useTranslation } from "@/lib/i18n/useTranslation";

interface SidebarHeaderProps {
  logoUrl?: string;
  householdName: string;
}

export function SidebarHeader({ logoUrl, householdName }: SidebarHeaderProps) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        padding: "1.75rem 1.25rem 1.25rem",
        borderBottom: "1px solid var(--color-divider)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
        <div
          style={{
            width: 42,
            height: 42,
            background: logoUrl
              ? "var(--color-surface)"
              : "linear-gradient(135deg, var(--color-primary), #ec4899)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            position: "relative",
            overflow: "hidden",
            border: logoUrl ? "1px solid var(--color-border)" : "none",
          }}
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="App Logo"
              fill
              style={{ objectFit: "cover" }}
            />
          ) : (
            "💎"
          )}
        </div>
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: "1.0625rem",
              color: "var(--color-text)",
              letterSpacing: "-0.025em",
            }}
          >
            Sintya Finance
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              fontWeight: 500,
            }}
          >
            {householdName || t("settings.preference.household_name")}
          </div>
        </div>
      </div>
    </div>
  );
}
