// ============================================================
// Tyaaa Financee — Zustand Global Store
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppSettings, UserProfile } from "@/types";
import { DEFAULT_SHEET_TABS } from "@/lib/constants";

interface AppState {
  user: UserProfile | null;
  settings: AppSettings;
  isSidebarOpen: boolean;
  isFABOpen: boolean;

  // Actions
  setUser: (user: UserProfile | null) => void;
  setSettings: (settings: Partial<AppSettings>) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setFABOpen: (open: boolean) => void;
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
    }),
    {
      name: "rumah-catat-store",
      partialize: (state) => ({
        settings: state.settings,
        user: state.user,
      }),
    },
  ),
);
