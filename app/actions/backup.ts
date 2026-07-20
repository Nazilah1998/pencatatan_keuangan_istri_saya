"use server";

import { db } from "@/db";
import { transactions, budgets, savings, assets, debts, profiles } from "@/db/schema";
import { requireUserId } from "@/db/helpers";
import { ActionResult, Transaction, BudgetEntry, SavingsGoal, Asset, Debt } from "@/types";

interface BackupData {
  transactions?: Transaction[];
  budgets?: BudgetEntry[];
  savings?: SavingsGoal[];
  assets?: Asset[];
  debts?: Debt[];
  settings?: Record<string, unknown>;
}
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { settingsSchema } from "@/lib/validations";

export async function restoreBackupData(backupData: BackupData): Promise<ActionResult> {
  try {
    const userId = await requireUserId();

    if (!backupData || typeof backupData !== "object") {
      return { success: false, error: "Data backup tidak valid." };
    }

    await db.transaction(async (tx) => {
      // 1. Delete all existing data except profile settings/logo
      await tx.delete(transactions).where(eq(transactions.userId, userId));
      await tx.delete(budgets).where(eq(budgets.userId, userId));
      await tx.delete(savings).where(eq(savings.userId, userId));
      await tx.delete(assets).where(eq(assets.userId, userId));
      await tx.delete(debts).where(eq(debts.userId, userId));

      // 2. Insert new data mapping JSON keys (snake_case) to Schema keys (camelCase)
      if (backupData.transactions && backupData.transactions.length > 0) {
        const txsToInsert = backupData.transactions.map((t: Transaction) => ({
          id: t.id,
          userId,
          tanggal: t.tanggal,
          jenis: t.jenis,
          jumlah: t.jumlah.toString(),
          kategori: t.kategori,
          subKategori: t.sub_kategori || null,
          dompet: t.dompet,
          deskripsi: t.deskripsi || null,
          createdAt: t.created_at ? new Date(t.created_at) : undefined,
        }));
        await tx.insert(transactions).values(txsToInsert);
      }

      if (backupData.budgets && backupData.budgets.length > 0) {
        const budgetsToInsert = backupData.budgets.map((b: BudgetEntry) => ({
          id: b.id,
          userId,
          kategori: b.kategori,
          batasBulanan: b.batas_bulanan.toString(),
          periode: b.periode || null,
          catatan: b.catatan || null,
          createdAt: b.created_at ? new Date(b.created_at) : undefined,
        }));
        await tx.insert(budgets).values(budgetsToInsert);
      }

      if (backupData.savings && backupData.savings.length > 0) {
        const savingsToInsert = backupData.savings.map((s: SavingsGoal) => ({
          id: s.id,
          userId,
          namaTujuan: s.nama_tujuan,
          targetJumlah: s.target_jumlah.toString(),
          jumlahTerkumpul: s.jumlah_terkumpul.toString(),
          targetTanggal: s.target_tanggal || null,
          ikon: s.ikon || null,
          warna: s.warna || null,
          deskripsi: s.deskripsi || null,
          prioritas: s.prioritas || "sedang",
          status: s.status || "aktif",
        }));
        await tx.insert(savings).values(savingsToInsert);
      }

      if (backupData.assets && backupData.assets.length > 0) {
        const assetsToInsert = backupData.assets.map((a: Asset) => ({
          id: a.id,
          userId,
          nama: a.nama,
          jenis: a.jenis,
          nilai: a.nilai.toString(),
          tanggalUpdate: a.tanggal_update || null,
          catatan: a.catatan || null,
          createdAt: a.created_at ? new Date(a.created_at) : undefined,
        }));
        await tx.insert(assets).values(assetsToInsert);
      }

      if (backupData.debts && backupData.debts.length > 0) {
        const debtsToInsert = backupData.debts.map((d: Debt) => ({
          id: d.id,
          userId,
          namaHutang: d.nama_hutang,
          jenis: d.jenis,
          totalAwal: d.total_awal.toString(),
          sisaHutang: d.sisa_hutang.toString(),
          cicilanBulanan: d.cicilan_bulanan.toString(),
          tanggalJatuhTempo: d.tanggal_jatuh_tempo || null,
          catatan: d.catatan || null,
          createdAt: d.created_at ? new Date(d.created_at) : undefined,
        }));
        await tx.insert(debts).values(debtsToInsert);
      }

      // 3. Update Profile Settings if available
      if (backupData.settings) {
        const parsed = settingsSchema.partial().safeParse(backupData.settings);
        if (parsed.success) {
          const validData = parsed.data;
          await tx
            .update(profiles)
            .set({
              bahasa: validData.bahasa,
              matauang: validData.mata_uang,
              formatTanggal: validData.format_tanggal,
              namaPengguna: validData.nama_pengguna,
              namaPanggilan: validData.nama_panggilan,
              namaRumahTangga: validData.nama_rumah_tangga,
              temaWarna: validData.tema_warna,
              logoUrl: validData.logo_url,
              customCategories: validData.custom_categories ?? null,
              customWallets: validData.custom_wallets ?? null,
              anggota: validData.anggota ?? null,
              updatedAt: new Date(),
            })
            .where(eq(profiles.id, userId));
        }
      }
    });

    revalidatePath("/");
    revalidatePath("/pengaturan");
    return { success: true };
  } catch (e: unknown) {
    console.error("Backup restore error:", e);
    return { success: false, error: e instanceof Error ? e.message : "Terjadi kesalahan sistem saat memulihkan data" };
  }
}
