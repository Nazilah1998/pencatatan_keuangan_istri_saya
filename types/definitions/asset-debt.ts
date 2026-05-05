export type AssetType =
  | "kas"
  | "rekening"
  | "investasi"
  | "emas"
  | "properti"
  | "kendaraan"
  | "lainnya";

export interface Asset {
  id: string;
  user_id: string;
  nama: string;
  jenis: AssetType;
  nilai: number;
  tanggal_update: string;
  catatan?: string;
  created_at?: string;
}

export interface AssetFormData {
  nama: string;
  jenis: AssetType;
  nilai: number;
  tanggal_update: string;
  catatan?: string;
  institusi?: string;
}

export type DebtType =
  | "kpr"
  | "kendaraan"
  | "kartu_kredit"
  | "pinjaman_pribadi"
  | "lainnya";

export interface Debt {
  id: string;
  user_id: string;
  nama_hutang: string;
  jenis: DebtType;
  total_awal: number;
  sisa_hutang: number;
  cicilan_bulanan: number;
  tanggal_jatuh_tempo: string;
  suku_bunga: number;
  catatan?: string;
  created_at?: string;
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
