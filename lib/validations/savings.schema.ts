import { z } from "zod";

export const savingsSchema = z.object({
  nama_tujuan: z.string().min(2, "Nama tujuan minimal 2 karakter"),
  target_jumlah: z.coerce.number().min(1, "Target tabungan harus lebih dari 0"),
  jumlah_terkumpul: z.coerce.number().min(0).default(0),
  target_tanggal: z.string().min(1, "Tanggal target harus diisi"),
  ikon: z.string().default("💰"),
  warna: z.string().default("#22c55e"),
  prioritas: z.enum(["rendah", "sedang", "tinggi"]).default("sedang"),
  status: z.enum(["aktif", "tercapai", "dibatalkan"]).default("aktif"),
  deskripsi: z.string().optional(),
});

export type SavingsSchema = z.infer<typeof savingsSchema>;
