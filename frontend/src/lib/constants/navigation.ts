/**
 * Navigasi utama. `label` berisi path kunci kamus, bukan teks hasil translate,
 * supaya 10 bahasa tetap konsisten.
 */
export const NAV_ITEMS = [
  { href: "/", label: "sidebar.dashboard", icon: "LayoutDashboard" },
  { href: "/transaksi", label: "sidebar.transactions", icon: "ArrowLeftRight" },
  { href: "/anggaran", label: "sidebar.budget", icon: "Wallet" },
  { href: "/tabungan", label: "sidebar.savings", icon: "PiggyBank" },
  { href: "/aset-hutang", label: "sidebar.assets", icon: "Building2" },
  { href: "/laporan", label: "sidebar.reports", icon: "BarChart3" },
  { href: "/pengaturan", label: "sidebar.settings", icon: "Settings" },
] as const

export type NavItem = (typeof NAV_ITEMS)[number]