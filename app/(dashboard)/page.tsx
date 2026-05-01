import { getTransactions } from "@/app/actions/transactions";
import { getSavings } from "@/app/actions/savings";
import { KPICard } from "@/components/dashboard/KPICard";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { format, parseISO, isSameMonth } from "date-fns";
import { id } from "date-fns/locale";

export default async function DashboardPage() {
  const [txRes, savingsRes] = await Promise.all([
    getTransactions(),
    getSavings(),
  ]);

  const transactions = txRes.data || [];
  const savings = savingsRes.data || [];

  const now = new Date();

  let totalSaldo = 0;
  let totalPemasukan = 0;
  let totalPengeluaran = 0;
  let totalTabungan = 0;

  const weeklyDataMap = new Map<
    string,
    { pemasukan: number; pengeluaran: number }
  >();
  const categoryDataMap = new Map<string, number>();

  transactions.forEach((tx) => {
    const isThisMonth = isSameMonth(parseISO(tx.tanggal), now);

    if (tx.jenis === "pemasukan") {
      totalSaldo += tx.jumlah;
      if (isThisMonth) totalPemasukan += tx.jumlah;
    } else if (tx.jenis === "pengeluaran") {
      totalSaldo -= tx.jumlah;
      if (isThisMonth) totalPengeluaran += tx.jumlah;
    }

    if (isThisMonth) {
      if (tx.jenis === "pemasukan" || tx.jenis === "pengeluaran") {
        const week = format(parseISO(tx.tanggal), "wo", { locale: id });
        const label = `Minggu ${week}`;
        const current = weeklyDataMap.get(label) || {
          pemasukan: 0,
          pengeluaran: 0,
        };
        current[tx.jenis] += tx.jumlah;
        weeklyDataMap.set(label, current);
      }

      if (tx.jenis === "pengeluaran") {
        categoryDataMap.set(
          tx.kategori,
          (categoryDataMap.get(tx.kategori) || 0) + tx.jumlah,
        );
      }
    }
  });

  savings.forEach((s) => {
    if (s.status === "aktif") totalTabungan += s.jumlah_terkumpul;
  });

  const weeklyData = Array.from(weeklyDataMap.entries())
    .map(([week, data]) => ({ week, ...data }))
    .sort((a, b) => a.week.localeCompare(b.week));

  const colors = [
    "#f97316",
    "#3b82f6",
    "#a855f7",
    "#ef4444",
    "#10b981",
    "#06b6d4",
    "#f59e0b",
    "#ec4899",
  ];
  const categoryData = Array.from(categoryDataMap.entries())
    .map(([kategori, total], i) => ({
      kategori,
      total,
      fill: colors[i % colors.length],
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem",
        }}
      >
        <KPICard title="Total Saldo" amount={totalSaldo} icon="💰" />
        <KPICard
          title="Pemasukan Bulan Ini"
          amount={totalPemasukan}
          type="income"
          icon="📈"
        />
        <KPICard
          title="Pengeluaran Bulan Ini"
          amount={totalPengeluaran}
          type="expense"
          icon="📉"
        />
        <KPICard
          title="Tabungan Berjalan"
          amount={totalTabungan}
          type="saving"
          icon="🏦"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <SpendingChart data={weeklyData} />
        <CategoryPieChart data={categoryData} />
      </div>

      <RecentTransactions transactions={transactions} />
    </div>
  );
}
