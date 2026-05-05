import { TransactionType } from "./common";

export interface Transaction {
  id: string;
  tanggal: string; // ISO string
  jenis: TransactionType;
  jumlah: number;
  kategori: string;
  sub_kategori?: string | null;
  dompet: string;
  deskripsi?: string;
  penerima?: string;
  created_at: string;
}

export interface TransactionFormData {
  tanggal: string;
  jenis: TransactionType;
  jumlah: number;
  kategori: string;
  sub_kategori?: string | null;
  dompet: string;
  deskripsi?: string;
  penerima?: string;
}
