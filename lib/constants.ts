// ============================================================
// Tyaaa Financee — Application Constants
// ============================================================

export const APP_NAME = "Tyaaa Financee";
export const APP_DESCRIPTION =
  "Smart personal financial tracking integrated with Google Sheets";

// -------------------- Transaction Categories --------------------
export const PEMASUKAN_CATEGORIES = [
  "Gaji",
  "Bonus",
  "Freelance",
  "Investasi",
  "Hadiah",
  "Lainnya",
] as const;

export const PENGELUARAN_CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Belanja",
  "Tagihan & Utilitas",
  "Kesehatan",
  "Pendidikan",
  "Hiburan",
  "Perawatan Rumah",
  "Pakaian",
  "Asuransi",
  "Cicilan",
  "Sosial & Donasi",
  "Lainnya",
] as const;

export const ALL_CATEGORIES = [
  ...PEMASUKAN_CATEGORIES,
  ...PENGELUARAN_CATEGORIES,
] as const;

// -------------------- Wallets --------------------
export const DOMPET_OPTIONS = [
  "Kas",
  "BCA",
  "Mandiri",
  "BRI",
  "BNI",
  "CIMB",
  "GoPay",
  "OVO",
  "Dana",
  "ShopeePay",
  "LinkAja",
  "Lainnya",
] as const;

// -------------------- Category Colors --------------------
export const CATEGORY_COLORS: Record<string, string> = {
  "Makanan & Minuman": "#f97316",
  Transportasi: "#3b82f6",
  Belanja: "#a855f7",
  "Tagihan & Utilitas": "#ef4444",
  Kesehatan: "#10b981",
  Pendidikan: "#06b6d4",
  Hiburan: "#f59e0b",
  "Perawatan Rumah": "#84cc16",
  Pakaian: "#ec4899",
  Asuransi: "#6366f1",
  Cicilan: "#dc2626",
  "Sosial & Donasi": "#14b8a6",
  Gaji: "#22c55e",
  Bonus: "#16a34a",
  Freelance: "#4ade80",
  Investasi: "#2563eb",
  Hadiah: "#e879f9",
  Lainnya: "#94a3b8",
};

// -------------------- Default Sheet Tabs --------------------
export const DEFAULT_SHEET_TABS = {
  transaksi: "Transaksi",
  anggaran: "Anggaran",
  tabungan: "Tabungan",
  aset: "Aset",
  hutang: "Hutang",
};

// -------------------- Sheet Headers --------------------
export const SHEET_HEADERS = {
  transaksi: [
    "id",
    "tanggal",
    "jenis",
    "jumlah",
    "kategori",
    "dompet",
    "deskripsi",
    "catatan",
    "tags",
    "is_recurring",
    "recurring_interval",
    "created_at",
  ],
  anggaran: [
    "id",
    "periode",
    "kategori",
    "batas_bulanan",
    "catatan",
    "created_at",
  ],
  tabungan: [
    "id",
    "nama_tujuan",
    "target_jumlah",
    "jumlah_terkumpul",
    "target_tanggal",
    "ikon",
    "warna",
    "prioritas",
    "status",
    "deskripsi",
  ],
  aset: [
    "id",
    "nama",
    "jenis",
    "nilai",
    "tanggal_update",
    "institusi",
    "catatan",
  ],
  hutang: [
    "id",
    "nama_hutang",
    "jenis",
    "total_awal",
    "sisa_hutang",
    "cicilan_bulanan",
    "tanggal_jatuh_tempo",
    "suku_bunga",
    "kreditur",
    "catatan",
  ],
};

// -------------------- Navigation --------------------
export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/transaksi", label: "Transaksi", icon: "ArrowLeftRight" },
  { href: "/anggaran", label: "Anggaran", icon: "Wallet" },
  { href: "/tabungan", label: "Tabungan", icon: "PiggyBank" },
  { href: "/aset-hutang", label: "Aset & Hutang", icon: "Building2" },
  { href: "/laporan", label: "Laporan", icon: "BarChart3" },
  { href: "/pengaturan", label: "Pengaturan", icon: "Settings" },
] as const;

// -------------------- Savings Goal Icons --------------------
export const SAVINGS_ICONS = [
  "🏠",
  "✈️",
  "🎓",
  "🚗",
  "💍",
  "🏥",
  "📱",
  "💻",
  "🛍️",
  "🌴",
  "💰",
  "🎯",
] as const;

export const SAVINGS_COLORS = [
  "#01696f",
  "#437a22",
  "#006494",
  "#a12c7b",
  "#d19900",
  "#e74c3c",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
  "#3498db",
] as const;
