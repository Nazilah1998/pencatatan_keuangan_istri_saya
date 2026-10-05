import { id } from "./languages/id";
import { en } from "./languages/en";
import { zh } from "./languages/zh";
import { es } from "./languages/es";
import { ar } from "./languages/ar";
import { hi } from "./languages/hi";
import { fr } from "./languages/fr";
import { ja } from "./languages/ja";
import { ru } from "./languages/ru";
import { pt } from "./languages/pt";

export const LANGUAGES = [
  { id: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
  { id: "en", name: "English", flag: "🇺🇸" },
  { id: "zh", name: "中文 (Mandarin)", flag: "🇨🇳" },
  { id: "es", name: "Español", flag: "🇪🇸" },
  { id: "ar", name: "العربية", flag: "🇸🇦" },
  { id: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { id: "fr", name: "Français", flag: "🇫🇷" },
  { id: "ja", name: "日本語", flag: "🇯🇵" },
  { id: "ru", name: "Русский", flag: "🇷🇺" },
  { id: "pt", name: "Português", flag: "🇵🇹" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const translations: Record<string, Record<string, any>> = {
  id,
  en,
  zh,
  es,
  ar,
  hi,
  fr,
  ja,
  ru,
  pt,
};
