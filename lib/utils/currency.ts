import { useAppStore } from "@/store/useAppStore";

export const CURRENCIES = [
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
];

export function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES.find((c) => c.code === code);
  return currency ? currency.symbol : code;
}

export function formatCurrency(amount: number, lang = "id"): string {
  // Accept both short codes ('en') and full locale strings ('en-US')
  const isEnglish = lang === "en" || lang.startsWith("en");
  const locale = isEnglish ? "en-US" : "id-ID";

  let currency = "IDR";
  try {
    const state = useAppStore.getState();
    if (state?.settings?.mata_uang) {
      currency = state.settings.mata_uang;
    }
  } catch {
    // Ignore error if used outside React/Zustand context
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseCurrency(value: string): number {
  return Number(value.replace(/[^0-9]/g, ""));
}
