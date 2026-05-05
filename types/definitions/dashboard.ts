export interface DashboardKPI {
  total_saldo: number;
  total_pemasukan: number;
  total_pengeluaran: number;
  total_tabungan: number;
}

export interface WeeklyChartData {
  week: string;
  pemasukan: number;
  pengeluaran: number;
}

export interface CategoryChartData {
  kategori: string;
  total: number;
  fill: string;
}
