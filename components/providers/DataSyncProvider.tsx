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
          if (!silent) toast.success("Data berhasil disinkronkan");
        }
      } catch (error) {
        console.error("[DataSync] Sync failed:", error);
        if (!silent) toast.error("Gagal sinkronisasi data");
      }
    },
    [setAllData],
  );

  useEffect(() => {
    // Initial sync
    syncData(true);

    // Sync on focus
    window.addEventListener("focus", () => syncData(true));

    // Sync on back online
    window.addEventListener("online", () => {
      toast.success("Kembali online, menyinkronkan data...");
      syncData(false);
    });

    return () => {
      window.removeEventListener("focus", () => syncData(true));
      window.removeEventListener("online", () => syncData(true));
    };
  }, [syncData]);

  return <>{children}</>;
}
