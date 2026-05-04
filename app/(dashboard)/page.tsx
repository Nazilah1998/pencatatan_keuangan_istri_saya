import { getTransactions } from "@/app/actions/transactions";
import { getSavings } from "@/app/actions/savings";
import { getAssets, getDebts } from "@/app/actions/assets";
import { getBudgets } from "@/app/actions/budgets";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { DataSyncStoreInit } from "../../components/providers/DataSyncStoreInit";

export default async function DashboardPage() {
  // Fresh data fetch for initial load/SSR
  const [txRes, bRes, sRes, assetsRes, debtsRes] = await Promise.all([
    getTransactions(),
    getBudgets(),
    getSavings(),
    getAssets(),
    getDebts(),
  ]);

  const freshData = {
    transactions: txRes.data || [],
    budgets: bRes.data || [],
    savings: sRes.data || [],
    assets: assetsRes.data || [],
    debts: debtsRes.data || [],
  };

  return (
    <>
      {/* Initialize store with fresh data on load if possible */}
      <DataSyncStoreInit data={freshData} />
      <DashboardClient />
    </>
  );
}
