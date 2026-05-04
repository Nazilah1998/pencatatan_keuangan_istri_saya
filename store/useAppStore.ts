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
  CustomCategory,
  CustomWallet,
} from "@/types";

import {
  PEMASUKAN_CATEGORIES,
  PENGELUARAN_CATEGORIES,
  SUB_CATEGORIES,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  SUB_CATEGORY_ICONS,
  DOMPET_OPTIONS,
  DOMPET_ICONS,
} from "@/lib/constants";

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

const INITIAL_CUSTOM_CATEGORIES: CustomCategory[] = [
  ...PEMASUKAN_CATEGORIES.map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    type: "pemasukan" as const,
    icon: CATEGORY_ICONS[name] || "💰",
    color: CATEGORY_COLORS[name] || "#10b981",
    sub_categories: [],
  })),
  ...PENGELUARAN_CATEGORIES.map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    type: "pengeluaran" as const,
    icon: CATEGORY_ICONS[name] || "💸",
    color: CATEGORY_COLORS[name] || "#ef4444",
    sub_categories: (SUB_CATEGORIES[name] || []).map((sub) => ({
      id: sub.toLowerCase().replace(/\s+/g, "-"),
      name: sub,
      icon: SUB_CATEGORY_ICONS[sub] || "🔹",
    })),
  })),
];

const INITIAL_CUSTOM_WALLETS: CustomWallet[] = DOMPET_OPTIONS.map((name) => ({
  id: name.toLowerCase().replace(/\s+/g, "-"),
  name,
  icon: DOMPET_ICONS[name] || "💳",
}));

const DEFAULT_SETTINGS: AppSettings = {
  mata_uang: "IDR",
  format_tanggal: "DD/MM/YYYY",
  nama_pengguna: "",
  nama_panggilan: "",
  nama_rumah_tangga: "Rumah Tangga Saya",
  anggota: [],
  tema_warna: "#ff85a2",
  custom_categories: INITIAL_CUSTOM_CATEGORIES,
  custom_wallets: INITIAL_CUSTOM_WALLETS,
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
