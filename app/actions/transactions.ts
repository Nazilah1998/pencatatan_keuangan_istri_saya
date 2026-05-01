"use server";
// ============================================================
// Tyaaa Financee — Transaction Server Actions
// ============================================================

import { revalidatePath } from "next/cache";
import {
  appendToSheet,
  readSheet,
  deleteRow,
  getSheetInternalId,
} from "@/lib/google-sheets";
import { transactionSchema } from "@/lib/validations";
import { generateId } from "@/lib/utils";
import { Transaction, ActionResult, TransactionFormData } from "@/types";

function getConfig() {
  const sheetId = process.env.DEFAULT_SHEET_ID || "";
  const tab = process.env.TRANSAKSI_TAB || "Transaksi";
  return { sheetId, tab };
}

function rowToTransaction(row: string[]): Transaction {
  return {
    id: row[0] || "",
    tanggal: row[1] || "",
    jenis: (row[2] as Transaction["jenis"]) || "pengeluaran",
    jumlah: Number(row[3]) || 0,
    kategori: row[4] || "",
    sub_kategori: row[5] || "",
    dompet: row[6] || "",
    deskripsi: row[7] || "",
    created_at: row[8] || "",
  };
}

export async function getTransactions(
  sheetId?: string,
  tabName?: string,
): Promise<ActionResult<Transaction[]>> {
  try {
    const { sheetId: defaultSheetId, tab: defaultTab } = getConfig();
    const id = sheetId || defaultSheetId;
    const tab = tabName || defaultTab;

    if (!id) return { success: true, data: [] };

    const rows = await readSheet(id, tab);
    if (rows.length <= 1) return { success: true, data: [] };

    const transactions = rows.slice(1).map(rowToTransaction);
    return { success: true, data: transactions };
  } catch {
    return { success: false, error: "Gagal memuat transaksi" };
  }
}

export async function addTransaction(
  formData: TransactionFormData,
  sheetId?: string,
  tabName?: string,
): Promise<ActionResult<Transaction>> {
  const parsed = transactionSchema.safeParse(formData);
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

  const transaction: Transaction = {
    id: generateId(),
    tanggal: parsed.data.tanggal,
    jenis: parsed.data.jenis,
    jumlah: parsed.data.jumlah,
    kategori: parsed.data.kategori,
    sub_kategori: parsed.data.sub_kategori,
    dompet: parsed.data.dompet,
    deskripsi: parsed.data.deskripsi,
    created_at: new Date().toISOString(),
  };

  const row = [
    transaction.id,
    transaction.tanggal,
    transaction.jenis,
    String(transaction.jumlah),
    transaction.kategori,
    transaction.sub_kategori || "",
    transaction.dompet,
    transaction.deskripsi,
    transaction.created_at,
  ];

  const result = await appendToSheet(id, tab, [row]);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/");
  revalidatePath("/transaksi");
  return { success: true, data: transaction };
}

export async function deleteTransaction(
  transactionId: string,
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
    const result = await deleteRow(id, tab, sheetInternalId, rowIndex + 1); // +1 for header

    if (!result.success) return { success: false, error: result.error };

    revalidatePath("/");
    revalidatePath("/transaksi");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus transaksi" };
  }
}
