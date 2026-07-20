import { z } from "zod";

const customSubCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  icon: z.string(),
});

const customCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(["pemasukan", "pengeluaran"]),
  icon: z.string(),
  color: z.string(),
  sub_categories: z.array(customSubCategorySchema),
});

const customWalletSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  icon: z.string(),
});

export const settingsSchema = z.object({
  mata_uang: z.string(),
  format_tanggal: z.enum(["DD/MM/YYYY", "YYYY-MM-DD"]),
  bahasa: z.string().optional(),
  nama_pengguna: z.string().optional(),
  nama_panggilan: z.string().optional(),
  nama_rumah_tangga: z.string().min(2, "Nama rumah tangga minimal 2 karakter"),
  tema_warna: z.string().optional(),
  mode_gelap: z.enum(["light", "dark"]).optional(),
  logo_url: z.string().optional(),
  custom_categories: z.array(customCategorySchema).optional(),
  custom_wallets: z.array(customWalletSchema).optional(),
  anggota: z.array(z.string()).optional(),
});

export type SettingsSchema = z.infer<typeof settingsSchema>;
