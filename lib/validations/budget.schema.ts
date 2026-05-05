import { z } from "zod";

export const budgetSchema = z.object({
  kategori: z.string().min(1, "Kategori harus dipilih"),
  batas_bulanan: z.number().min(1, "Batas anggaran harus lebih dari 0"),
  periode: z.string().min(1, "Periode harus diisi (YYYY-MM)"),
  catatan: z.string().optional(),
});

export type BudgetSchema = z.infer<typeof budgetSchema>;
