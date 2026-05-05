import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { id as localeId, type Locale } from "date-fns/locale";


export function formatDate(
  dateStr: string,
  fmt = "dd MMM yyyy",
  customLocale?: Locale,
): string {
  try {
    const locale = customLocale || localeId;
    return format(parseISO(dateStr), fmt, { locale });
  } catch {
    return dateStr;
  }
}



export function formatDateInput(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "yyyy-MM-dd");
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

export function getCurrentPeriod(): string {
  return format(new Date(), "yyyy-MM");
}

export function getPeriodLabel(period: string, customLocale?: Locale): string {
  try {
    const [year, month] = period.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    const locale = customLocale || localeId;
    return format(date, "MMMM yyyy", { locale });
  } catch {
    return period;
  }
}



export function getMonthRange(period: string): { start: string; end: string } {
  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return {
    start: startOfMonth(date).toISOString(),
    end: endOfMonth(date).toISOString(),
  };
}

export function daysUntil(dateStr: string): number {
  const target = parseISO(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
