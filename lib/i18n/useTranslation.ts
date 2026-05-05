import { useAppStore } from "@/store/useAppStore";
import { translations } from "./dictionaries";

export function useTranslation() {
  const { settings } = useAppStore();

  // Default to 'en' if no language is selected or settings is undefined
  const currentLang = settings?.bahasa || "en";
  const dict = translations[currentLang] || translations["en"];

  const t = (keyPath: string): string => {
    const keys = keyPath.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: Record<string, any> = dict;

    for (const key of keys) {
      if (current[key] === undefined) {
        // Fallback to Indonesian if key doesn't exist in current language
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let fallback: Record<string, any> | string = translations["id"];
        for (const fbKey of keys) {
          if (
            typeof fallback === "object" &&
            fallback !== null &&
            fallback[fbKey] !== undefined
          ) {
            fallback = fallback[fbKey];
          } else {
            return keyPath; // Return key path if even fallback fails
          }
        }
        return fallback as string;
      }
      current = current[key];
    }

    return current as unknown as string;
  };

  return { t, currentLang };
}
