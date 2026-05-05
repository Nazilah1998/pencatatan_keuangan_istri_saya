import { z } from "zod";

export const assetSchema = z.object({
  nama: z.string().min(1, "Nama aset harus diisi"),
  jenis: z.enum([
    "kas",
    "rekening",
    "investasi",
    "emas",
    "properti",
    "kendaraan",
    "lainnya",
  ]),
  nilai: z.coerce.number().min(0, "Nilai tidak boleh negatif"),
  tanggal_update: z.string().min(1, "Tanggal update harus diisi"),
  catatan: z.string().optional(),
});

export const debtSchema = z.object({
  nama_hutang: z.string().min(1, "Nama hutang harus diisi"),
  jenis: z.enum(["kpr", "kendaraan", "kartu_kredit", "pinjaman_pribadi", "lainnya"]),
  total_awal: z.coerce.number().min(0, "Total awal tidak boleh negatif"),
  sisa_hutang: z.coerce.number().min(0, "Sisa hutang tidak boleh negatif"),
  cicilan_bulanan: z.coerce.number().min(0, "Cicilan tidak boleh negatif"),
  tanggal_jatuh_tempo: z.string().min(1, "Tanggal jatuh tempo harus diisi"),
  suku_bunga: z.coerce.number().min(0, "Bunga tidak boleh negatif"),
  catatan: z.string().optional(),
});

export type AssetSchema = z.infer<typeof assetSchema>;
export type DebtSchema = z.infer<typeof debtSchema>;
