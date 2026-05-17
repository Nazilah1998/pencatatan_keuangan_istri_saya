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

export const FALLBACK_RATES: Record<string, number> = {
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
};

export function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES.find((c) => c.code === code);
  return currency ? currency.symbol : code;
}

export function getConvertedAmount(amount: number, targetCurrency: string): number {
  if (targetCurrency === "IDR") return amount;
  
  let rate = FALLBACK_RATES[targetCurrency] || 1;
  try {
    const store = useAppStore.getState();
    if (store && store.exchangeRates && store.exchangeRates[targetCurrency]) {
      rate = store.exchangeRates[targetCurrency];
    }
  } catch {
    // Ignore error
  }
  
  return amount * rate;
}

export function getOriginalAmount(amount: number, targetCurrency: string): number {
  if (targetCurrency === "IDR") return amount;
  
  let rate = FALLBACK_RATES[targetCurrency] || 1;
  try {
    const store = useAppStore.getState();
    if (store && store.exchangeRates && store.exchangeRates[targetCurrency]) {
      rate = store.exchangeRates[targetCurrency];
    }
  } catch {
    // Ignore error
  }
  
  return Math.round(amount / rate);
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

  const convertedAmount = getConvertedAmount(amount, currency);
  const isNoDecimalCurrency = ["IDR", "JPY", "KRW"].includes(currency);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: isNoDecimalCurrency ? 0 : 2,
    maximumFractionDigits: isNoDecimalCurrency ? 0 : 2,
  }).format(convertedAmount);
}

export function parseCurrency(value: string): number {
  return Number(value.replace(/[^0-9]/g, ""));
}
