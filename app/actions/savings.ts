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
import { addTransaction } from "./transactions";

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

async function findRowIndexById(
  sheetId: string,
  tab: string,
  id: string,
): Promise<number> {
  const rows = await readSheet(sheetId, tab, "A:A");
  return rows.findIndex((row) => row[0] === id);
}

export async function addFundsToSavings(
  savingsId: string,
  _unused_rowIndex: number,
  currentAmount: number,
  additionalAmount: number,
  walletName: string, // New parameter
  sheetId?: string,
  tabName?: string,
): Promise<ActionResult> {
  try {
    const { sheetId: defaultSheetId, tab: defaultTab } = getConfig();
    const id = sheetId || defaultSheetId;
    const tab = tabName || defaultTab;

    if (!id)
      return { success: false, error: "Google Sheet ID belum dikonfigurasi" };

    // 1. Record a transaction (Expense)
    const txResult = await addTransaction(
      {
        tanggal: new Date().toISOString().split("T")[0],
        jenis: "pengeluaran",
        jumlah: additionalAmount,
        kategori: "Tabungan",
        dompet: walletName,
        deskripsi: `Tabungan: Penambahan dana`,
      },
      id,
    );

    if (!txResult.success) {
      return {
        success: false,
        error: `Gagal mencatat transaksi: ${txResult.error}`,
      };
    }

    // 2. Update Savings Goal Row
    const rows = await readSheet(id, tab);
    const realRowIndex = rows.findIndex((row) => row[0] === savingsId);

    if (realRowIndex === -1) {
      return { success: false, error: "Data tidak ditemukan" };
    }

    const targetRow = rows[realRowIndex];
    targetRow[3] = String(currentAmount + additionalAmount);

    const result = await updateRow(id, tab, realRowIndex + 1, [targetRow]);
    if (!result.success) return { success: false, error: result.error };

    revalidatePath("/tabungan");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[addFundsToSavings] Error:", error);
    return { success: false, error: "Gagal menambah dana" };
  }
}

export async function deleteSavings(
  savingsId: string,
  _unused_rowIndex: number,
  sheetId?: string,
  tabName?: string,
): Promise<ActionResult> {
  try {
    const { sheetId: defaultSheetId, tab: defaultTab } = getConfig();
    const id = sheetId || defaultSheetId;
    const tab = tabName || defaultTab;

    if (!id)
      return { success: false, error: "Google Sheet ID belum dikonfigurasi" };

    const realRowIndex = await findRowIndexById(id, tab, savingsId);
    if (realRowIndex === -1) {
      return { success: false, error: "Tabungan tidak ditemukan" };
    }

    const sheetInternalId = await getSheetInternalId(id, tab);
    const result = await deleteRow(id, tab, sheetInternalId, realRowIndex);

    if (!result.success) return { success: false, error: result.error };

    revalidatePath("/tabungan");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus tabungan" };
  }
}

export async function updateSavings(
  savingsId: string,
  _unused_rowIndex: number,
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

  const realRowIndex = await findRowIndexById(id, tab, savingsId);
  if (realRowIndex === -1) {
    return { success: false, error: "Tabungan tidak ditemukan" };
  }

  const updatedGoal: SavingsGoal = {
    id: savingsId,
    ...parsed.data,
    deskripsi: parsed.data.deskripsi || "",
  };

  const row = [
    updatedGoal.id,
    updatedGoal.nama_tujuan,
    String(updatedGoal.target_jumlah),
    String(updatedGoal.jumlah_terkumpul),
    updatedGoal.target_tanggal,
    updatedGoal.ikon,
    updatedGoal.warna,
    updatedGoal.prioritas,
    updatedGoal.status,
    updatedGoal.deskripsi || "",
  ];

  const result = await updateRow(id, tab, realRowIndex + 1, [row]);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/tabungan");
  return { success: true, data: updatedGoal };
}
