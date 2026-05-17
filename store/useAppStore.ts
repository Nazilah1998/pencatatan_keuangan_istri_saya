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

  // Live Exchange Rates
  exchangeRates: Record<string, number> | null;
  lastRatesFetch: string | null;

  // Actions
  togglePrivateMode: () => void;
  setUser: (user: Profile | null) => void;
  setSettings: (settings: Partial<AppSettings>) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setFABOpen: (open: boolean) => void;
  toggleFAB: () => void;
  resetStore: () => void;
  fetchExchangeRates: (force?: boolean) => Promise<void>;

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
      exchangeRates: null,
      lastRatesFetch: null,

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

      resetStore: () =>
        set({
          user: null,
          settings: DEFAULT_SETTINGS,
          transactions: [],
          budgets: [],
          savings: [],
          assets: [],
          debts: [],
          lastSynced: null,
          isPrivateMode: true,
          exchangeRates: null,
          lastRatesFetch: null,
        }),

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

      fetchExchangeRates: async (force = false) => {
        const { lastRatesFetch, exchangeRates } = useAppStore.getState();
        
        // Fetch only if forced, or no rates, or rates older than 4 hours
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
        const isExpired = !lastRatesFetch || new Date(lastRatesFetch) < fourHoursAgo;
        
        if (!force && exchangeRates && !isExpired) {
          return;
        }

        try {
          const res = await fetch("https://open.er-api.com/v6/latest/IDR");
          if (!res.ok) throw new Error("Failed to fetch exchange rates");
          const data = await res.json();
          if (data && data.result === "success" && data.rates) {
            set({
              exchangeRates: data.rates,
              lastRatesFetch: new Date().toISOString(),
            });
            console.log("Successfully updated live exchange rates:", data.rates);
          }
        } catch (error) {
          console.error("Failed to fetch live exchange rates, keeping previous rates or using fallback:", error);
          if (!exchangeRates) {
            set({
              exchangeRates: {
                IDR: 1,
                USD: 0.000062,
                EUR: 0.000057,
                GBP: 0.000049,
                JPY: 0.0097,
                SGD: 0.000084,
                AUD: 0.000094,
                MYR: 0.00029,
                CNY: 0.00045,
                KRW: 0.084,
              },
              lastRatesFetch: new Date().toISOString(),
            });
          }
        }
      },

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
        isPrivateMode: state.isPrivateMode,
        lastSynced: state.lastSynced,
        exchangeRates: state.exchangeRates,
        lastRatesFetch: state.lastRatesFetch,
      }),
    },
  ),
);
