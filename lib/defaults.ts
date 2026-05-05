import {
  PEMASUKAN_CATEGORIES,
  PENGELUARAN_CATEGORIES,
  SUB_CATEGORIES,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  SUB_CATEGORY_ICONS,
  DOMPET_OPTIONS,
  DOMPET_ICONS,
} from "@/lib/constants";
import { AppSettings, CustomCategory, CustomWallet } from "@/types";

export const INITIAL_CUSTOM_CATEGORIES: CustomCategory[] = [
  ...PEMASUKAN_CATEGORIES.map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    type: "pemasukan" as const,
    icon: CATEGORY_ICONS[name] || "💰",
    color: CATEGORY_COLORS[name] || "#10b981",
    sub_categories: [],
  })),
  ...PENGELUARAN_CATEGORIES.map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    type: "pengeluaran" as const,
    icon: CATEGORY_ICONS[name] || "💸",
    color: CATEGORY_COLORS[name] || "#ef4444",
    sub_categories: (SUB_CATEGORIES[name] || []).map((sub) => ({
      id: sub.toLowerCase().replace(/\s+/g, "-"),
      name: sub,
      icon: SUB_CATEGORY_ICONS[sub] || "🔹",
    })),
  })),
];

export const INITIAL_CUSTOM_WALLETS: CustomWallet[] = DOMPET_OPTIONS.map(
  (name) => ({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    icon: DOMPET_ICONS[name] || "💳",
  }),
);

export const DEFAULT_SETTINGS: AppSettings = {
  mata_uang: "IDR",
  format_tanggal: "DD/MM/YYYY",
  bahasa: "en",
  nama_pengguna: "",
  nama_panggilan: "",
  nama_rumah_tangga: "Rumah Tangga Saya",
  anggota: [],
  tema_warna: "#ff85a2",
  custom_categories: INITIAL_CUSTOM_CATEGORIES,
  custom_wallets: INITIAL_CUSTOM_WALLETS,
};
