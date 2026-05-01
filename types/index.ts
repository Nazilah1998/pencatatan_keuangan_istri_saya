// ============================================================
// Tyaaa Financee — Centralized TypeScript Types
// ============================================================

export type TransactionType = "pemasukan" | "pengeluaran";
export type RecurringInterval = "harian" | "mingguan" | "bulanan";
export type Priority = "rendah" | "sedang" | "tinggi";
export type SavingsStatus = "aktif" | "tercapai" | "ditunda";
export type DateFormat = "DD/MM/YYYY" | "YYYY-MM-DD";

// -------------------- Transaction --------------------
export interface Transaction {
  id: string;
  tanggal: string; // ISO string
  jenis: TransactionType;
  jumlah: number;
  kategori: string;
  sub_kategori?: string;
  dompet: string;
  deskripsi: string;
  created_at: string;
}

export interface TransactionFormData {
  tanggal: string;
  jenis: TransactionType;
  jumlah: number;
  kategori: string;
  sub_kategori?: string;
  dompet: string;
  deskripsi: string;
}

// -------------------- Budget --------------------
export interface BudgetEntry {
  id: string;
  kategori: string;
  batas_bulanan: number;
  periode: string; // "2025-01"
  catatan?: string;
  created_at: string;
}

export interface BudgetFormData {
  kategori: string;
  batas_bulanan: number;
  periode: string;
  catatan?: string;
}

// -------------------- Savings --------------------
export interface SavingsGoal {
  id: string;
  nama_tujuan: string;
  target_jumlah: number;
  jumlah_terkumpul: number;
  target_tanggal: string; // ISO string
  ikon: string;
  warna: string;
  deskripsi?: string;
  prioritas: Priority;
  status: SavingsStatus;
}

export interface SavingsFormData {
  nama_tujuan: string;
  target_jumlah: number;
  jumlah_terkumpul: number;
  target_tanggal: string;
  ikon: string;
  warna: string;
  deskripsi?: string;
  prioritas: Priority;
  status: SavingsStatus;
}

// -------------------- Asset --------------------
export type AssetType =
  | "kas"
  | "rekening"
  | "investasi"
  | "properti"
  | "kendaraan"
  | "lainnya";

export interface Asset {
  id: string;
  nama: string;
  jenis: AssetType;
  nilai: number;
  tanggal_update: string;
  catatan?: string;
  institusi?: string;
}

export interface AssetFormData {
  nama: string;
  jenis: AssetType;
  nilai: number;
  tanggal_update: string;
  catatan?: string;
  institusi?: string;
}

// -------------------- Debt --------------------
export type DebtType =
  | "kpr"
  | "kendaraan"
  | "kartu_kredit"
  | "pinjaman_pribadi"
  | "lainnya";

export interface Debt {
  id: string;
  nama_hutang: string;
  jenis: DebtType;
  total_awal: number;
  sisa_hutang: number;
  cicilan_bulanan: number;
  tanggal_jatuh_tempo: string;
  suku_bunga: number;
  catatan?: string;
  kreditur?: string;
}

export interface DebtFormData {
  nama_hutang: string;
  jenis: DebtType;
  total_awal: number;
  sisa_hutang: number;
  cicilan_bulanan: number;
  tanggal_jatuh_tempo: string;
  suku_bunga: number;
  catatan?: string;
  kreditur?: string;
}

// -------------------- Settings --------------------
export interface SheetTabs {
  transaksi: string;
  anggaran: string;
  tabungan: string;
  aset: string;
  hutang: string;
}

export interface AppSettings {
  google_sheet_id: string;
  sheet_tabs: SheetTabs;
  mata_uang: "IDR";
  format_tanggal: DateFormat;
  nama_pengguna: string;
  nama_rumah_tangga: string;
  anggota?: string[];
}

// -------------------- API Responses --------------------
export interface ActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

// -------------------- Dashboard --------------------
export interface DashboardKPI {
  total_saldo: number;
  total_pemasukan: number;
  total_pengeluaran: number;
  total_tabungan: number;
}

export interface WeeklyChartData {
  week: string;
  pemasukan: number;
  pengeluaran: number;
}

export interface CategoryChartData {
  kategori: string;
  total: number;
  fill: string;
}

// -------------------- Auth --------------------
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
}
