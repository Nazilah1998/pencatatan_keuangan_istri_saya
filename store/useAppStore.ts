import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Transaction,
  BudgetEntry,
  SavingsGoal,
  Asset,
  Debt,
  AppSettings,
  Profile,
} from "@/types";

interface AppState {
  user: Profile | null;
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

  // Actions
  togglePrivateMode: () => void;
  setUser: (user: Profile | null) => void;
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
  syncSettingsWithCloud: () => Promise<void>;
}

import {
  INITIAL_CUSTOM_CATEGORIES,
  INITIAL_CUSTOM_WALLETS,
  DEFAULT_SETTINGS,
} from "@/lib/defaults";

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
        set((state) => {
          const newSettings = { ...state.settings, ...partial };
          // Safety fallback for old users
          if (!newSettings.custom_categories)
            newSettings.custom_categories = INITIAL_CUSTOM_CATEGORIES;
          if (!newSettings.custom_wallets)
            newSettings.custom_wallets = INITIAL_CUSTOM_WALLETS;

          return { settings: newSettings };
        }),

      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      setSidebarOpen: (open) => set({ isSidebarOpen: open }),

      toggleFAB: () => set((state) => ({ isFABOpen: !state.isFABOpen })),

      setFABOpen: (open) => set({ isFABOpen: open }),

      // Data Sync
      isPrivateMode: true,
      togglePrivateMode: () =>
        set((state) => ({ isPrivateMode: !state.isPrivateMode })),
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

      syncSettingsWithCloud: async () => {
        const { settings } = useAppStore.getState();
        const { updateProfile } = await import("@/app/actions/profiles");
        await updateProfile(settings);
      },
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
      }),
    },
  ),
);
