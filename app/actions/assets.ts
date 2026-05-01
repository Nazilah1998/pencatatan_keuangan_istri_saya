"use server";
// ============================================================
// Tyaaa Financee — Assets & Debts Server Actions
// ============================================================

import { revalidatePath } from "next/cache";
import {
  appendToSheet,
  readSheet,
  deleteRow,
  getSheetInternalId,
} from "@/lib/google-sheets";
import { assetSchema, debtSchema } from "@/lib/validations";
import { generateId } from "@/lib/utils";
import {
  Asset,
  Debt,
  ActionResult,
  AssetFormData,
  DebtFormData,
} from "@/types";

function getConfig() {
  const sheetId = process.env.DEFAULT_SHEET_ID || "";
  return {
    sheetId,
    asetTab: process.env.ASET_TAB || "Aset",
    hutangTab: process.env.HUTANG_TAB || "Hutang",
  };
}

// -------------------- Assets --------------------
function rowToAsset(row: string[]): Asset {
  return {
    id: row[0] || "",
    nama: row[1] || "",
    jenis: (row[2] as Asset["jenis"]) || "lainnya",
    nilai: Number(row[3]) || 0,
    tanggal_update: row[4] || "",
    institusi: row[5] || "",
    catatan: row[6] || "",
  };
}

export async function getAssets(
  sheetId?: string,
): Promise<ActionResult<Asset[]>> {
  try {
    const { sheetId: defaultId, asetTab } = getConfig();
    const id = sheetId || defaultId;
    if (!id) return { success: true, data: [] };

    const rows = await readSheet(id, asetTab);
    if (rows.length <= 1) return { success: true, data: [] };

    return { success: true, data: rows.slice(1).map(rowToAsset) };
  } catch {
    return { success: false, error: "Gagal memuat aset" };
  }
}

export async function addAsset(
  formData: AssetFormData,
  sheetId?: string,
): Promise<ActionResult<Asset>> {
  const parsed = assetSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data tidak valid",
    };
  }

  const { sheetId: defaultId, asetTab } = getConfig();
  const id = sheetId || defaultId;
  if (!id)
    return { success: false, error: "Google Sheet ID belum dikonfigurasi" };

  const asset: Asset = {
    id: generateId(),
    nama: parsed.data.nama,
    jenis: parsed.data.jenis,
    nilai: parsed.data.nilai,
    tanggal_update: parsed.data.tanggal_update,
    institusi: parsed.data.institusi || "",
    catatan: parsed.data.catatan || "",
  };

  const row = [
    asset.id,
    asset.nama,
    asset.jenis,
    String(asset.nilai),
    asset.tanggal_update,
    asset.institusi || "",
    asset.catatan || "",
  ];
  const result = await appendToSheet(id, asetTab, [row]);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/aset-hutang");
  return { success: true, data: asset };
}

export async function deleteAsset(
  assetId: string,
  rowIndex: number,
  sheetId?: string,
): Promise<ActionResult> {
  try {
    const { sheetId: defaultId, asetTab } = getConfig();
    const id = sheetId || defaultId;
    if (!id)
      return { success: false, error: "Google Sheet ID belum dikonfigurasi" };

    const sheetInternalId = await getSheetInternalId(id, asetTab);
    const result = await deleteRow(id, asetTab, sheetInternalId, rowIndex + 1);
    if (!result.success) return { success: false, error: result.error };

    revalidatePath("/aset-hutang");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus aset" };
  }
}

// -------------------- Debts --------------------
function rowToDebt(row: string[]): Debt {
  return {
    id: row[0] || "",
    nama_hutang: row[1] || "",
    jenis: (row[2] as Debt["jenis"]) || "lainnya",
    total_awal: Number(row[3]) || 0,
    sisa_hutang: Number(row[4]) || 0,
    cicilan_bulanan: Number(row[5]) || 0,
    tanggal_jatuh_tempo: row[6] || "",
    suku_bunga: Number(row[7]) || 0,
    kreditur: row[8] || "",
    catatan: row[9] || "",
  };
}

export async function getDebts(
  sheetId?: string,
): Promise<ActionResult<Debt[]>> {
  try {
    const { sheetId: defaultId, hutangTab } = getConfig();
    const id = sheetId || defaultId;
    if (!id) return { success: true, data: [] };

    const rows = await readSheet(id, hutangTab);
    if (rows.length <= 1) return { success: true, data: [] };

    return { success: true, data: rows.slice(1).map(rowToDebt) };
  } catch {
    return { success: false, error: "Gagal memuat hutang" };
  }
}

export async function addDebt(
  formData: DebtFormData,
  sheetId?: string,
): Promise<ActionResult<Debt>> {
  const parsed = debtSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data tidak valid",
    };
  }

  const { sheetId: defaultId, hutangTab } = getConfig();
  const id = sheetId || defaultId;
  if (!id)
    return { success: false, error: "Google Sheet ID belum dikonfigurasi" };

  const debt: Debt = {
    id: generateId(),
    nama_hutang: parsed.data.nama_hutang,
    jenis: parsed.data.jenis,
    total_awal: parsed.data.total_awal,
    sisa_hutang: parsed.data.sisa_hutang,
    cicilan_bulanan: parsed.data.cicilan_bulanan,
    tanggal_jatuh_tempo: parsed.data.tanggal_jatuh_tempo,
    suku_bunga: parsed.data.suku_bunga,
    kreditur: parsed.data.kreditur || "",
    catatan: parsed.data.catatan || "",
  };

  const row = [
    debt.id,
    debt.nama_hutang,
    debt.jenis,
    String(debt.total_awal),
    String(debt.sisa_hutang),
    String(debt.cicilan_bulanan),
    debt.tanggal_jatuh_tempo,
    String(debt.suku_bunga),
    debt.kreditur || "",
    debt.catatan || "",
  ];

  const result = await appendToSheet(id, hutangTab, [row]);
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/aset-hutang");
  return { success: true, data: debt };
}

export async function deleteDebt(
  debtId: string,
  rowIndex: number,
  sheetId?: string,
): Promise<ActionResult> {
  try {
    const { sheetId: defaultId, hutangTab } = getConfig();
    const id = sheetId || defaultId;
    if (!id)
      return { success: false, error: "Google Sheet ID belum dikonfigurasi" };

    const sheetInternalId = await getSheetInternalId(id, hutangTab);
    const result = await deleteRow(
      id,
      hutangTab,
      sheetInternalId,
      rowIndex + 1,
    );
    if (!result.success) return { success: false, error: result.error };

    revalidatePath("/aset-hutang");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus hutang" };
  }
}
