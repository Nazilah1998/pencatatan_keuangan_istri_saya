"use server";

import { db } from "@/db";
import { assets, debts } from "@/db/schema";
import { getCurrentUserId, requireUserId, parseNumeric } from "@/db/helpers";
import { Asset, Debt, AssetFormData, DebtFormData } from "@/types";
import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";

/**
 * Server Actions for Assets & Debts (Drizzle ORM Version)
 */

function rowToAsset(row: typeof assets.$inferSelect): Asset {
  return {
    id: row.id,
    user_id: row.userId,
    nama: row.nama,
    jenis: row.jenis as Asset["jenis"],
    nilai: parseNumeric(row.nilai),
    tanggal_update: row.tanggalUpdate ?? "",
    catatan: row.catatan ?? undefined,
    created_at: row.createdAt?.toISOString(),
  };
}

function rowToDebt(row: typeof debts.$inferSelect): Debt {
  return {
    id: row.id,
    user_id: row.userId,
    nama_hutang: row.namaHutang,
    jenis: row.jenis as Debt["jenis"],
    total_awal: parseNumeric(row.totalAwal),
    sisa_hutang: parseNumeric(row.sisaHutang),
    cicilan_bulanan: parseNumeric(row.cicilanBulanan),
    tanggal_jatuh_tempo: row.tanggalJatuhTempo ?? "",
    suku_bunga: 0,
    catatan: row.catatan ?? undefined,
    created_at: row.createdAt?.toISOString(),
  };
}

// --- ASSET ACTIONS ---

export async function getAssets() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const data = await db
      .select()
      .from(assets)
      .where(eq(assets.userId, userId))
      .orderBy(desc(assets.createdAt));

    return { success: true, data: data.map(rowToAsset) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function addAsset(formData: AssetFormData) {
  try {
    const userId = await requireUserId();

    const [row] = await db
      .insert(assets)
      .values({
        userId,
        nama: formData.nama,
        jenis: formData.jenis,
        nilai: String(formData.nilai),
        tanggalUpdate: formData.tanggal_update,
        catatan: formData.catatan,
      })
      .returning();

    revalidatePath("/aset-hutang");
    return { success: true, data: rowToAsset(row) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateAsset(assetId: string, formData: AssetFormData) {
  try {
    const [row] = await db
      .update(assets)
      .set({
        nama: formData.nama,
        jenis: formData.jenis,
        nilai: String(formData.nilai),
        tanggalUpdate: formData.tanggal_update,
        catatan: formData.catatan,
      })
      .where(eq(assets.id, assetId))
      .returning();

    revalidatePath("/aset-hutang");
    return { success: true, data: rowToAsset(row) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteAsset(assetId: string) {
  try {
    await db.delete(assets).where(eq(assets.id, assetId));
    revalidatePath("/aset-hutang");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// --- DEBT ACTIONS ---

export async function getDebts() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const data = await db
      .select()
      .from(debts)
      .where(eq(debts.userId, userId))
      .orderBy(desc(debts.createdAt));

    return { success: true, data: data.map(rowToDebt) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function addDebt(formData: DebtFormData) {
  try {
    const userId = await requireUserId();

    const [row] = await db
      .insert(debts)
      .values({
        userId,
        namaHutang: formData.nama_hutang,
        jenis: formData.jenis,
        totalAwal: String(formData.total_awal),
        sisaHutang: String(formData.sisa_hutang),
        cicilanBulanan: String(formData.cicilan_bulanan),
        tanggalJatuhTempo: formData.tanggal_jatuh_tempo,
        catatan: formData.catatan,
      })
      .returning();

    revalidatePath("/aset-hutang");
    return { success: true, data: rowToDebt(row) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateDebt(debtId: string, formData: DebtFormData) {
  try {
    const [row] = await db
      .update(debts)
      .set({
        namaHutang: formData.nama_hutang,
        jenis: formData.jenis,
        totalAwal: String(formData.total_awal),
        sisaHutang: String(formData.sisa_hutang),
        cicilanBulanan: String(formData.cicilan_bulanan),
        tanggalJatuhTempo: formData.tanggal_jatuh_tempo,
        catatan: formData.catatan,
      })
      .where(eq(debts.id, debtId))
      .returning();

    revalidatePath("/aset-hutang");
    return { success: true, data: rowToDebt(row) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteDebt(debtId: string) {
  try {
    await db.delete(debts).where(eq(debts.id, debtId));
    revalidatePath("/aset-hutang");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// --- ASSET BALANCE SYNC ---

export async function updateAssetBalance(
  _sheetId: string,
  assetName: string,
  amountChange: number,
) {
  try {
    const userId = await requireUserId();

    const [asset] = await db
      .select()
      .from(assets)
      .where(and(eq(assets.userId, userId), eq(assets.nama, assetName)));

    if (!asset) {
      console.error("Asset not found for sync:", assetName);
      return { success: false, error: "Aset tidak ditemukan" };
    }

    const newNilai = parseNumeric(asset.nilai) + amountChange;
    await db
      .update(assets)
      .set({
        nilai: String(newNilai),
        tanggalUpdate: new Date().toISOString().split("T")[0],
      })
      .where(eq(assets.id, asset.id));

    revalidatePath("/aset-hutang");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
