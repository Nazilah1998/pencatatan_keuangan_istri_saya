"use client";
import { useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getTransactions } from "@/app/actions/transactions";
import { getBudgets } from "@/app/actions/budgets";
import { getSavings } from "@/app/actions/savings";
import { getAssets, getDebts } from "@/app/actions/assets";
import toast from "react-hot-toast";

export function DataSyncProvider({ children }: { children: React.ReactNode }) {
  const { setAllData } = useAppStore();

  const syncData = useCallback(
    async (silent = true) => {
      try {
        if (!navigator.onLine) return;

        // Skip syncing if no user is authenticated to prevent redundant auth checks
        const { user } = useAppStore.getState();
        if (!user) return;

        const [txRes, bRes, sRes, aRes, dRes] = await Promise.all([
          getTransactions(),
          getBudgets(),
          getSavings(),
          getAssets(),
          getDebts(),
        ]);

        if (
          txRes.success &&
          bRes.success &&
          sRes.success &&
          aRes.success &&
          dRes.success
        ) {
          setAllData({
            transactions: txRes.data || [],
            budgets: bRes.data || [],
            savings: sRes.data || [],
            assets: aRes.data || [],
            debts: dRes.data || [],
          });
          if (!silent) toast.success("✅ Data synced");
        }
      } catch (error) {
        console.error("[DataSync] Sync failed:", error);
        if (!silent) toast.error("Sync failed");
      }
    },
    [setAllData],
  );

  useEffect(() => {
    // Initial sync
    syncData(true);

    // Stable references for proper cleanup (fixes memory leak)
    const handleFocus = () => syncData(true);
    const handleOnline = () => {
      toast.success("Back online, syncing...");
      syncData(false);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, [syncData]);

  return <>{children}</>;
}
