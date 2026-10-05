export const DOMPET_OPTIONS = [
  "Cash",
  "Bank BRI",
  "Bank BSI",
  "GoPay",
  "Dana",
  "ShopeePay",
] as const;

export const DOMPET_ICONS: Record<string, string> = {
  Cash: "💵",
  "Bank BRI": "🏦",
  "Bank BSI": "🕌",
  GoPay: "📱",
  Dana: "💙",
  ShopeePay: "🧡",
};

export const WALLET_PRESETS = [
  { name: "Cash", icon: "💵" },
  { name: "Bank BCA", icon: "🏦" },
  { name: "Bank Mandiri", icon: "🏦" },
  { name: "Bank BNI", icon: "🏦" },
  { name: "Bank BRI", icon: "🏦" },
  { name: "Bank BSI", icon: "🏦" },
  { name: "GoPay", icon: "📱" },
  { name: "OVO", icon: "📱" },
  { name: "Dana", icon: "📱" },
  { name: "ShopeePay", icon: "🧡" },
  { name: "LinkAja", icon: "❤️" },
];

/** Nilai `wallets.type` di PocketBase; label diambil dari kamus i18n. */
export const WALLET_TYPES = [
  { value: "cash", labelKey: "assets.type_cash" },
  { value: "bank", labelKey: "assets.type_bank" },
  { value: "ewallet", labelKey: "assets.type_other" },
  { value: "savings", labelKey: "savings.title" },
  { value: "credit_card", labelKey: "assets.type_credit_card" },
  { value: "investment", labelKey: "assets.type_investment" },
] as const;

export type WalletTypeValue = (typeof WALLET_TYPES)[number]["value"];
