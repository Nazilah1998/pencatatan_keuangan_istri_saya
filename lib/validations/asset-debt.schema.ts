import { z } from "zod";

export const assetSchema = z.object({
  nama: z.string().min(2, "Nama aset minimal 2 karakter"),
  tipe: z.string().min(1, "Tipe aset harus dipilih"),
  nilai: z.number().min(0, "Nilai tidak boleh negatif"),
  institusi: z.string().optional(),
  catatan: z.string().optional(),
});

export const debtSchema = z.object({
  nama: z.string().min(2, "Nama hutang minimal 2 karakter"),
  tipe: z.string().min(1, "Tipe hutang harus dipilih"),
  jumlah: z.number().min(0, "Jumlah tidak boleh negatif"),
  bunga: z.number().optional(),
  jatuh_tempo: z.string().optional(),
  pemberi_pinjaman: z.string().optional(),
  catatan: z.string().optional(),
});

export type AssetSchema = z.infer<typeof assetSchema>;
export type DebtSchema = z.infer<typeof debtSchema>;
