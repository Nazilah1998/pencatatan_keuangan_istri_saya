export interface BudgetEntry {
  id: string;
  kategori: string;
  batas_bulanan: number;
  periode: string; // "2025-01"
  catatan?: string;
  created_at: string;
}

export interface BudgetFormData {
  kategori: string;
  batas_bulanan: number;
  periode: string;
  catatan?: string;
}
