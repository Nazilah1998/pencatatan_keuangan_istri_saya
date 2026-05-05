"use client";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
export function LanguageSyncProvider() {
  const { settings } = useAppStore();

  useEffect(() => {
    // Update HTML lang attribute to match user preference
    if (settings?.bahasa) {
      document.documentElement.lang = settings.bahasa;
    }
  }, [settings?.bahasa]);

  return null;
}
