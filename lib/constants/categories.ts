export const PEMASUKAN_CATEGORIES = [
  "Gaji",
  "Bonus Kantor",
  "Freelance",
  "Investasi",
  "Hadiah",
  "Lainnya",
] as const;

export const PENGELUARAN_CATEGORIES = [
  "Jajan Comel",
  "Transportasi",
  "Belanja Online",
  "Belanja Offline",
  "Tagihan & Utilitas",
  "Kesehatan",
  "Pendidikan",
  "Biaya Perjalanan",
  "Cicilan",
  "Sosial & Donasi",
] as const;

export const SUB_CATEGORIES: Record<string, string[]> = {
  "Jajan Comel": ["Makan Diluar", "Jajan Kecil", "Rokok Suami"],
  "Tagihan & Utilitas": ["Listrik", "Wifi", "PDAM", "Kost", "Paket Data"],
  "Belanja Online": ["Pakaian", "Skincare", "Perabotan Rumah", "Peliharaan"],
  "Belanja Offline": ["Mini Market", "Pasar", "Peliharaan"],
  Transportasi: ["Mobil", "Motor"],
  "Biaya Perjalanan": ["Bensin", "Konsumsi", "Penginapan"],
  Cicilan: ["SpayLater", "TikTok PayLater", "Cicilan Bank"],
};

export const CATEGORY_ICONS: Record<string, string> = {
  "Jajan Comel": "🍿",
  Transportasi: "🚗",
  "Belanja Online": "🛍️",
  "Belanja Offline": "🧺",
  "Tagihan & Utilitas": "⚡",
  Kesehatan: "🏥",
  Pendidikan: "🎓",
  "Biaya Perjalanan": "🧳",
  Cicilan: "💸",
  "Sosial & Donasi": "🤝",
  Gaji: "💰",
  "Bonus Kantor": "✨",
  Freelance: "💻",
  Investasi: "📈",
  Hadiah: "🎁",
};

export const SUB_CATEGORY_ICONS: Record<string, string> = {
  Listrik: "💡",
  Wifi: "🌐",
  PDAM: "💧",
  Kost: "🏢",
  "Paket Data": "📱",
  Pakaian: "👕",
  Skincare: "✨",
  "Perabotan Rumah": "🏠",
  Peliharaan: "🐾",
  Mobil: "🚘",
  Motor: "🏍️",
  "Mini Market": "🏪",
  Pasar: "🧺",
  "Makan Diluar": "🍔",
  "Jajan Kecil": "🍬",
  "Rokok Suami": "🚬",
  Bensin: "⛽",
  Konsumsi: "🍽️",
  Penginapan: "🏨",
  SpayLater: "🧡",
  "TikTok PayLater": "🖤",
  "Cicilan Bank": "🏦",
};

export const ALL_CATEGORIES = [
  ...PEMASUKAN_CATEGORIES,
  ...PENGELUARAN_CATEGORIES,
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  "Jajan Comel": "#f97316",
  Transportasi: "#3b82f6",
  "Belanja Online": "#a855f7",
  "Belanja Offline": "#84cc16",
  "Tagihan & Utilitas": "#ef4444",
  Kesehatan: "#10b981",
  Pendidikan: "#06b6d4",
  "Biaya Perjalanan": "#f59e0b",
  Cicilan: "#dc2626",
  "Sosial & Donasi": "#14b8a6",
  Gaji: "#22c55e",
  "Bonus Kantor": "#16a34a",
  Freelance: "#4ade80",
  Investasi: "#2563eb",
  Hadiah: "#e879f9",
};

export const CATEGORY_PRESETS = {
  pengeluaran: [
    { name: "Jajan Comel", icon: "🍿" },
    { name: "Transportasi", icon: "🚗" },
    { name: "Belanja Online", icon: "🛍️" },
    { name: "Belanja Offline", icon: "🧺" },
    { name: "Tagihan & Utilitas", icon: "⚡" },
    { name: "Kesehatan", icon: "🏥" },
    { name: "Pendidikan", icon: "🎓" },
    { name: "Biaya Perjalanan", icon: "🧳" },
    { name: "Hiburan", icon: "🎬" },
    { name: "Sosial & Donasi", icon: "🤝" },
    { name: "Cicilan", icon: "💸" },
    { name: "Tabungan", icon: "🐷" },
  ],
  pemasukan: [
    { name: "Gaji", icon: "💰" },
    { name: "Bonus Kantor", icon: "✨" },
    { name: "Freelance", icon: "💻" },
    { name: "Investasi", icon: "📈" },
    { name: "Hadiah", icon: "🎁" },
    { name: "Penjualan", icon: "🏷️" },
  ],
};
