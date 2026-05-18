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

  const allSuccess =
    txRes.success &&
    bRes.success &&
    sRes.success &&
    assetsRes.success &&
    debtsRes.success;

  const freshData = allSuccess
    ? {
        transactions: txRes.data || [],
        budgets: bRes.data || [],
        savings: sRes.data || [],
        assets: assetsRes.data || [],
        debts: debtsRes.data || [],
      }
    : null;

  return (
    <>
      {/* Initialize store with fresh data on load if possible */}
      {freshData && <DataSyncStoreInit data={freshData} />}
      <DashboardClient />
    </>
  );
}
