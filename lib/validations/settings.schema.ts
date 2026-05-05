import { z } from "zod";

export const settingsSchema = z.object({
  mata_uang: z.literal("IDR"),
  format_tanggal: z.enum(["DD/MM/YYYY", "YYYY-MM-DD"]),
  bahasa: z.string().optional(),
  nama_pengguna: z.string().optional(),
  nama_panggilan: z.string().optional(),
  nama_rumah_tangga: z.string().min(2, "Nama rumah tangga minimal 2 karakter"),
  tema_warna: z.string().optional(),
  logo_url: z.string().optional(),
});

export type SettingsSchema = z.infer<typeof settingsSchema>;
