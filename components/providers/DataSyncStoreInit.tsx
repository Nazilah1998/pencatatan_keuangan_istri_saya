"use client";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Transaction, BudgetEntry, SavingsGoal, Asset } from "@/types";

interface DataSyncStoreInitProps {
  data: {
    transactions: Transaction[];
    budgets: BudgetEntry[];
    savings: SavingsGoal[];
    assets: Asset[];
  };
}

export function DataSyncStoreInit({ data }: DataSyncStoreInitProps) {
  const { setAllData } = useAppStore();

  useEffect(() => {
    // This will update the store with fresh data from SSR on the client side
    setAllData(data);
  }, [data, setAllData]);

  return null;
}
