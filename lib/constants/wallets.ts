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
