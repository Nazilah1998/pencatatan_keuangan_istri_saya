import { TransactionType, DateFormat } from "./common";

export interface CustomSubCategory {
  id: string;
  name: string;
  icon: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  sub_categories: CustomSubCategory[];
}

export interface CustomWallet {
  id: string;
  name: string;
  icon: string;
}

export interface AppSettings {
  mata_uang: "IDR";
  format_tanggal: DateFormat;
  bahasa?: string;
  nama_pengguna: string;
  nama_panggilan: string;
  nama_rumah_tangga: string;
  anggota?: string[];
  tema_warna?: string;
  logo_url?: string;
  custom_categories: CustomCategory[];
  custom_wallets: CustomWallet[];
}
