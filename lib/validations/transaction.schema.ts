import { z } from "zod";

export const transactionSchema = z.object({
  jenis: z.enum(["pemasukan", "pengeluaran"]),
  jumlah: z.number().min(1, "Jumlah harus lebih dari 0"),
  kategori: z.string().min(1, "Kategori harus dipilih"),
  sub_kategori: z.string().optional().nullable(),
  tanggal: z.string().min(1, "Tanggal harus diisi"),
  dompet: z.string().min(1, "Dompet harus dipilih"),
  deskripsi: z.string().optional(),
  penerima: z.string().optional(),
});

export type TransactionSchema = z.infer<typeof transactionSchema>;
