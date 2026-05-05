export function formatCurrency(amount: number, lang = "id"): string {
  const locale = lang === "en" ? "en-US" : "id-ID";
  const currency = lang === "en" ? "USD" : "IDR";
  
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
