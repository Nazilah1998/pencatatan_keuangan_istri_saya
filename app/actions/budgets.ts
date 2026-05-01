"use server";
// ============================================================
// Tyaaa Financee — Budget Server Actions
// ============================================================

import { revalidatePath } from "next/cache";
import {
  appendToSheet,
  readSheet,
  deleteRow,
  getSheetInternalId,
} from "@/lib/google-sheets";
import { budgetSchema } from "@/lib/validations";
import { generateId } from "@/lib/utils";
import { BudgetEntry, ActionResult, BudgetFormData } from "@/types";

function getConfig() {
  const sheetId = process.env.DEFAULT_SHEET_ID || "";
  const tab = process.env.ANGGARAN_TAB || "Anggaran";
  return { sheetId, tab };
}

function rowToBudget(row: string[]): BudgetEntry {
  return {
    id: row[0] || "",
    periode: row[1] || "",
    kategori: row[2] || "",
    batas_bulanan: Number(row[3]) || 0,
    catatan: row[4] || "",
    created_at: row[5] || "",
  };
}

export async function getBudgets(
  sheetId?: string,
  tabName?: string,
): Promise<ActionResult<BudgetEntry[]>> {
  try {
    const { sheetId: defaultSheetId, tab: defaultTab } = getConfig();
    const id = sheetId || defaultSheetId;
    const tab = tabName || defaultTab;

    if (!id) return { success: true, data: [] };

    const rows = await readSheet(id, tab);
    if (rows.length <= 1) return { success: true, data: [] };

    const budgets = rows.slice(1).map(rowToBudget);
    return { success: true, data: budgets };
  } catch {
    return { success: false, error: "Gagal memuat anggaran" };
  }
}

export async function addBudget(
  formData: BudgetFormData,
  sheetId?: string,
  tabName?: string,
): Promise<ActionResult<BudgetEntry>> {
  const parsed = budgetSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data tidak valid",
    };
  }

  const { sheetId: defaultSheetId, tab: defaultTab } = getConfig();
  const id = sheetId || defaultSheetId;
  const tab = tabName || defaultTab;

  if (!id)
    return { success: false, error: "Google Sheet ID belum dikonfigurasi" };

  const budget: BudgetEntry = {
    id: generateId(),
    periode: parsed.data.periode,
    kategori: parsed.data.kategori,
    batas_bulanan: parsed.data.batas_bulanan,
    catatan: parsed.data.catatan || "",
    created_at: new Date().toISOString(),
  };

  const row = [
    budget.id,
    budget.periode,
    budget.kategori,
    String(budget.batas_bulanan),
    budget.catatan || "",
    budget.created_at,
  ];

  const result = await appendToSheet(id, tab, [row]);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/anggaran");
  return { success: true, data: budget };
}

export async function deleteBudget(
  budgetId: string,
  rowIndex: number,
  sheetId?: string,
  tabName?: string,
): Promise<ActionResult> {
  try {
    const { sheetId: defaultSheetId, tab: defaultTab } = getConfig();
    const id = sheetId || defaultSheetId;
    const tab = tabName || defaultTab;

    if (!id)
      return { success: false, error: "Google Sheet ID belum dikonfigurasi" };

    const sheetInternalId = await getSheetInternalId(id, tab);
    const result = await deleteRow(id, tab, sheetInternalId, rowIndex + 1);

    if (!result.success) return { success: false, error: result.error };

    revalidatePath("/anggaran");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus anggaran" };
  }
}
