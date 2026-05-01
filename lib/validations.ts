// ============================================================
// Tyaaa Financee — Zod Validation Schemas
// ============================================================

import { z } from "zod";

export const transactionSchema = z.object({
  tanggal: z.string().min(1, "Tanggal harus diisi"),
  jenis: z.enum(["pemasukan", "pengeluaran"], {
    message: "Pilih jenis transaksi",
  }),
  jumlah: z
    .number({ message: "Jumlah harus berupa angka" })
    .positive("Jumlah harus lebih dari 0"),
  kategori: z.string().min(1, "Pilih kategori"),
  sub_kategori: z.string().optional(),
  dompet: z.string().min(1, "Pilih dompet"),
  deskripsi: z.string().max(200, "Maksimal 200 karakter"),
});

export const budgetSchema = z.object({
  kategori: z.string().min(1, "Pilih kategori"),
  batas_bulanan: z
    .number({ message: "Nominal harus berupa angka" })
    .positive("Batas harus lebih dari 0"),
  periode: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Format periode tidak valid (YYYY-MM)"),
  catatan: z.string().max(200).optional(),
});

export const savingsSchema = z.object({
  nama_tujuan: z.string().min(2, "Nama tujuan minimal 2 karakter").max(100),
  target_jumlah: z
    .number({ message: "Target harus berupa angka" })
    .positive("Target harus lebih dari 0"),
  jumlah_terkumpul: z
    .number({ message: "Jumlah harus berupa angka" })
    .min(0, "Jumlah tidak boleh negatif"),
  target_tanggal: z.string().min(1, "Tanggal target harus diisi"),
  ikon: z.string().min(1, "Pilih ikon"),
  warna: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Pilih warna"),
  deskripsi: z.string().max(300).optional(),
  prioritas: z.enum(["rendah", "sedang", "tinggi"]),
  status: z.enum(["aktif", "tercapai", "ditunda"]),
});

export const assetSchema = z.object({
  nama: z.string().min(2, "Nama aset minimal 2 karakter").max(100),
  jenis: z.enum([
    "kas",
    "rekening",
    "investasi",
    "properti",
    "kendaraan",
    "lainnya",
  ]),
  nilai: z
    .number({ message: "Nilai harus berupa angka" })
    .min(0, "Nilai tidak boleh negatif"),
  tanggal_update: z.string().min(1, "Tanggal harus diisi"),
  catatan: z.string().max(200).optional(),
  institusi: z.string().max(100).optional(),
});

export const debtSchema = z.object({
  nama_hutang: z.string().min(2, "Nama hutang minimal 2 karakter").max(100),
  jenis: z.enum([
    "kpr",
    "kendaraan",
    "kartu_kredit",
    "pinjaman_pribadi",
    "lainnya",
  ]),
  total_awal: z
    .number({ message: "Total harus berupa angka" })
    .positive("Total harus lebih dari 0"),
  sisa_hutang: z
    .number({ message: "Sisa harus berupa angka" })
    .min(0, "Sisa tidak boleh negatif"),
  cicilan_bulanan: z
    .number({ message: "Cicilan harus berupa angka" })
    .min(0, "Cicilan tidak boleh negatif"),
  tanggal_jatuh_tempo: z.string().min(1, "Tanggal jatuh tempo harus diisi"),
  suku_bunga: z
    .number({ message: "Suku bunga harus berupa angka" })
    .min(0)
    .max(100),
  catatan: z.string().max(200).optional(),
  kreditur: z.string().max(100).optional(),
});

export const settingsSchema = z.object({
  google_sheet_id: z.string(),
  sheet_tabs: z.object({
    transaksi: z.string(),
    anggaran: z.string(),
    tabungan: z.string(),
    aset: z.string(),
    hutang: z.string(),
  }),
  mata_uang: z.literal("IDR"),
  format_tanggal: z.enum(["DD/MM/YYYY", "YYYY-MM-DD"]),
  nama_pengguna: z.string(),
  nama_rumah_tangga: z.string().min(1, "Nama rumah tangga harus diisi"),
  tema_warna: z.string().optional(),
});

export type TransactionSchema = z.infer<typeof transactionSchema>;
export type BudgetSchema = z.infer<typeof budgetSchema>;
export type SavingsSchema = z.infer<typeof savingsSchema>;
export type AssetSchema = z.infer<typeof assetSchema>;
export type DebtSchema = z.infer<typeof debtSchema>;
export type SettingsSchema = z.infer<typeof settingsSchema>;
