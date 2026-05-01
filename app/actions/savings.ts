"use server";
// ============================================================
// Tyaaa Financee — Savings Server Actions
// ============================================================

import { revalidatePath } from "next/cache";
import {
  appendToSheet,
  readSheet,
  updateRow,
  deleteRow,
  getSheetInternalId,
} from "@/lib/google-sheets";
import { savingsSchema } from "@/lib/validations";
import { generateId } from "@/lib/utils";
import { SavingsGoal, ActionResult, SavingsFormData } from "@/types";

function getConfig() {
  const sheetId = process.env.DEFAULT_SHEET_ID || "";
  const tab = process.env.TABUNGAN_TAB || "Tabungan";
  return { sheetId, tab };
}

function rowToSavings(row: string[]): SavingsGoal {
  return {
    id: row[0] || "",
    nama_tujuan: row[1] || "",
    target_jumlah: Number(row[2]) || 0,
    jumlah_terkumpul: Number(row[3]) || 0,
    target_tanggal: row[4] || "",
    ikon: row[5] || "💰",
    warna: row[6] || "#01696f",
    prioritas: (row[7] as SavingsGoal["prioritas"]) || "sedang",
    status: (row[8] as SavingsGoal["status"]) || "aktif",
    deskripsi: row[9] || "",
  };
}

export async function getSavings(
  sheetId?: string,
  tabName?: string,
): Promise<ActionResult<SavingsGoal[]>> {
  try {
    const { sheetId: defaultSheetId, tab: defaultTab } = getConfig();
    const id = sheetId || defaultSheetId;
    const tab = tabName || defaultTab;

    if (!id) return { success: true, data: [] };

    const rows = await readSheet(id, tab);
    if (rows.length <= 1) return { success: true, data: [] };

    const savings = rows.slice(1).map(rowToSavings);
    return { success: true, data: savings };
  } catch {
    return { success: false, error: "Gagal memuat tabungan" };
  }
}

export async function addSavings(
  formData: SavingsFormData,
  sheetId?: string,
  tabName?: string,
): Promise<ActionResult<SavingsGoal>> {
  const parsed = savingsSchema.safeParse(formData);
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

  const goal: SavingsGoal = {
    id: generateId(),
    nama_tujuan: parsed.data.nama_tujuan,
    target_jumlah: parsed.data.target_jumlah,
    jumlah_terkumpul: parsed.data.jumlah_terkumpul,
    target_tanggal: parsed.data.target_tanggal,
    ikon: parsed.data.ikon,
    warna: parsed.data.warna,
    deskripsi: parsed.data.deskripsi || "",
    prioritas: parsed.data.prioritas,
    status: parsed.data.status,
  };

  const row = [
    goal.id,
    goal.nama_tujuan,
    String(goal.target_jumlah),
    String(goal.jumlah_terkumpul),
    goal.target_tanggal,
    goal.ikon,
    goal.warna,
    goal.prioritas,
    goal.status,
    goal.deskripsi || "",
  ];

  const result = await appendToSheet(id, tab, [row]);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/tabungan");
  return { success: true, data: goal };
}

export async function addFundsToSavings(
  savingsId: string,
  rowIndex: number,
  currentAmount: number,
  additionalAmount: number,
  sheetId?: string,
  tabName?: string,
): Promise<ActionResult> {
  try {
    const { sheetId: defaultSheetId, tab: defaultTab } = getConfig();
    const id = sheetId || defaultSheetId;
    const tab = tabName || defaultTab;

    if (!id)
      return { success: false, error: "Google Sheet ID belum dikonfigurasi" };

    const rows = await readSheet(id, tab);
    const targetRow = rows[rowIndex + 1]; // +1 for header
    if (!targetRow) return { success: false, error: "Data tidak ditemukan" };

    targetRow[3] = String(currentAmount + additionalAmount);

    const result = await updateRow(id, tab, rowIndex + 2, [targetRow]); // +2 for header + 1-based
    if (!result.success) return { success: false, error: result.error };

    revalidatePath("/tabungan");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menambah dana" };
  }
}

export async function deleteSavings(
  savingsId: string,
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

    revalidatePath("/tabungan");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus tabungan" };
  }
}
