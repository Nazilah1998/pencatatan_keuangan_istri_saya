import { Priority, SavingsStatus } from "./common";

export interface SavingsGoal {
  id: string;
  nama_tujuan: string;
  target_jumlah: number;
  jumlah_terkumpul: number;
  target_tanggal: string; // ISO string
  ikon: string;
  warna: string;
  deskripsi?: string;
  prioritas: Priority;
  status: SavingsStatus;
}

export interface SavingsFormData {
  nama_tujuan: string;
  target_jumlah: number;
  jumlah_terkumpul: number;
  target_tanggal: string;
  ikon: string;
  warna: string;
  deskripsi?: string;
  prioritas: Priority;
  status: SavingsStatus;
}
