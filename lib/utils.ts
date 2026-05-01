// ============================================================
// Tyaaa Financee — Utility Functions
// ============================================================

import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

// -------------------- Currency --------------------
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseCurrency(value: string): number {
  return Number(value.replace(/[^0-9]/g, ''));
}

// -------------------- Dates --------------------
export function formatDate(dateStr: string, fmt = 'dd MMM yyyy'): string {
  try {
    return format(parseISO(dateStr), fmt, { locale: localeId });
  } catch {
    return dateStr;
  }
}

export function formatDateInput(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'yyyy-MM-dd');
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export function getCurrentPeriod(): string {
  return format(new Date(), 'yyyy-MM');
}

export function getPeriodLabel(period: string): string {
  try {
    const [year, month] = period.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return format(date, 'MMMM yyyy', { locale: localeId });
  } catch {
    return period;
  }
}

export function getMonthRange(period: string): { start: string; end: string } {
  const [year, month] = period.split('-');
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

// -------------------- Percentage --------------------
export function calcPercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
}

export function getBudgetStatus(percentage: number): 'aman' | 'waspada' | 'melebihi' {
  if (percentage < 70) return 'aman';
  if (percentage < 90) return 'waspada';
  return 'melebihi';
}

// -------------------- ID Generator --------------------
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// -------------------- Array/Object Helpers --------------------
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function sumBy<T>(arr: T[], key: keyof T): number {
  return arr.reduce((sum, item) => sum + Number(item[key] || 0), 0);
}

// -------------------- CSV Export --------------------
export function arrayToCSV(headers: string[], rows: string[][]): string {
  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const headerRow = headers.map(escape).join(',');
  const dataRows = rows.map((row) => row.map(escape).join(','));
  return [headerRow, ...dataRows].join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// -------------------- Color --------------------
export function hexToRgba(hex: string, alpha = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// -------------------- Class Names --------------------
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
