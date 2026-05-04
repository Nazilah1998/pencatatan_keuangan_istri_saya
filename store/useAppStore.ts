import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Transaction,
  BudgetEntry,
  SavingsGoal,
  Asset,
  Debt,
  AppSettings,
  UserProfile,
} from "@/types";

import { DEFAULT_SHEET_TABS } from "@/lib/constants";

interface AppState {
  user: UserProfile | null;
  settings: AppSettings;
  isSidebarOpen: boolean;
  isFABOpen: boolean;

  // Cached Data for Offline View
  transactions: Transaction[];
  budgets: BudgetEntry[];
  savings: SavingsGoal[];
  assets: Asset[];
  debts: Debt[];
  lastSynced: string | null;
  isPrivateMode: boolean;
  isBiometricEnabled: boolean;
  isAppLocked: boolean;

  // Actions
  togglePrivateMode: () => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setAppLocked: (locked: boolean) => void;
  setUser: (user: UserProfile | null) => void;
  setSettings: (settings: Partial<AppSettings>) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setFABOpen: (open: boolean) => void;

  // Data Sync Actions
  setTransactions: (data: Transaction[]) => void;
  setBudgets: (data: BudgetEntry[]) => void;
  setSavings: (data: SavingsGoal[]) => void;
  setAssets: (data: Asset[]) => void;
  setDebts: (data: Debt[]) => void;
  setAllData: (data: {
    transactions: Transaction[];
    budgets: BudgetEntry[];
    savings: SavingsGoal[];
    assets: Asset[];
    debts: Debt[];
  }) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  google_sheet_id: "",
  sheet_tabs: DEFAULT_SHEET_TABS,
  mata_uang: "IDR",
  format_tanggal: "DD/MM/YYYY",
  nama_pengguna: "",
  nama_rumah_tangga: "Rumah Tangga Saya",
  anggota: [],
  tema_warna: "#ff85a2",
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      settings: DEFAULT_SETTINGS,
      isSidebarOpen: false,
      isFABOpen: false,

      // Initial Data
      transactions: [],
      budgets: [],
      savings: [],
      assets: [],
      debts: [],
      lastSynced: null,

      setUser: (user) => set({ user }),

      setSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),

      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      setSidebarOpen: (open) => set({ isSidebarOpen: open }),

      toggleFAB: () => set((state) => ({ isFABOpen: !state.isFABOpen })),

      setFABOpen: (open) => set({ isFABOpen: open }),

      // Data Sync
      isPrivateMode: true,
      togglePrivateMode: () =>
        set((state) => ({ isPrivateMode: !state.isPrivateMode })),
      isBiometricEnabled: false,
      isAppLocked: false,
      setBiometricEnabled: (enabled) => set({ isBiometricEnabled: enabled }),
      setAppLocked: (locked) => set({ isAppLocked: locked }),
      setTransactions: (transactions) => set({ transactions }),
      setBudgets: (budgets) => set({ budgets }),
      setSavings: (savings) => set({ savings }),
      setAssets: (assets) => set({ assets }),
      setDebts: (debts) => set({ debts }),
      setAllData: (data) =>
        set({
          ...data,
          lastSynced: new Date().toISOString(),
        }),
    }),
    {
      name: "rumah-catat-store",
      partialize: (state) => ({
        settings: state.settings,
        user: state.user,
        transactions: state.transactions,
        budgets: state.budgets,
        savings: state.savings,
        assets: state.assets,
        debts: state.debts,
        lastSynced: state.lastSynced,
        isPrivateMode: state.isPrivateMode,
        isBiometricEnabled: state.isBiometricEnabled,
      }),
    },
  ),
);
