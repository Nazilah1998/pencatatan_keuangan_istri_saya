"use client";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { usePathname } from "next/navigation";

export function LanguageSyncProvider() {
  const { settings } = useAppStore();
  const pathname = usePathname();

  useEffect(() => {
    const triggerGoogleTranslate = (langId: string) => {
      const googleCodeMap: Record<string, string> = {
        id: "id",
        en: "en",
        zh: "zh-CN",
        es: "es",
        ar: "ar",
        hi: "hi",
        fr: "fr",
        ja: "ja",
        ru: "ru",
        pt: "pt",
      };

      const targetCode = googleCodeMap[langId] || "id";
      const selectEl = document.querySelector(
        ".goog-te-combo",
      ) as HTMLSelectElement;

      if (selectEl && selectEl.value !== targetCode) {
        selectEl.value = targetCode;
        selectEl.dispatchEvent(new Event("change"));
      }
    };

    if (settings?.bahasa && settings.bahasa !== "id") {
      // Small delay to let React render and Google script to load
      const timer = setTimeout(() => {
        if (settings.bahasa) {
          triggerGoogleTranslate(settings.bahasa);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [settings?.bahasa, pathname]); // Re-sync on route change to ensure translated state

  return null;
}
