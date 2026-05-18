"use server";

import { db } from "@/db";
import { savings, transactions, assets } from "@/db/schema";
import { requireUserId, getCurrentUserId, parseNumeric } from "@/db/helpers";
import { SavingsGoal, SavingsFormData } from "@/types";
import { revalidatePath } from "next/cache";
import { eq, asc, and } from "drizzle-orm";

/**
 * Server Actions for Savings (Drizzle ORM Version)
 */

function rowToSavingsGoal(row: typeof savings.$inferSelect): SavingsGoal {
  return {
    id: row.id,
    nama_tujuan: row.namaTujuan,
    target_jumlah: parseNumeric(row.targetJumlah),
    jumlah_terkumpul: parseNumeric(row.jumlahTerkumpul),
    target_tanggal: row.targetTanggal ?? "",
    ikon: row.ikon ?? "",
    warna: row.warna ?? "",
    deskripsi: row.deskripsi ?? undefined,
    prioritas: (row.prioritas ?? "sedang") as SavingsGoal["prioritas"],
    status: (row.status ?? "aktif") as SavingsGoal["status"],
  };
}

export async function getSavings() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const data = await db
      .select()
      .from(savings)
      .where(eq(savings.userId, userId))
      .orderBy(asc(savings.targetTanggal));

    return { success: true, data: data.map(rowToSavingsGoal) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function addSaving(formData: SavingsFormData) {
  try {
    const userId = await requireUserId();

    const [row] = await db
      .insert(savings)
      .values({
        userId,
        namaTujuan: formData.nama_tujuan,
        targetJumlah: String(formData.target_jumlah),
        jumlahTerkumpul: String(formData.jumlah_terkumpul),
        targetTanggal: formData.target_tanggal,
        ikon: formData.ikon,
        warna: formData.warna,
        deskripsi: formData.deskripsi,
        prioritas: formData.prioritas,
        status: formData.status,
      })
      .returning();

    revalidatePath("/");
    revalidatePath("/tabungan");
    return { success: true, data: rowToSavingsGoal(row) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateSaving(id: string, formData: SavingsFormData) {
  try {
    const [row] = await db
      .update(savings)
      .set({
        namaTujuan: formData.nama_tujuan,
        targetJumlah: String(formData.target_jumlah),
        jumlahTerkumpul: String(formData.jumlah_terkumpul),
        targetTanggal: formData.target_tanggal,
        ikon: formData.ikon,
        warna: formData.warna,
        deskripsi: formData.deskripsi,
        prioritas: formData.prioritas,
        status: formData.status,
      })
      .where(eq(savings.id, id))
      .returning();

    revalidatePath("/");
    revalidatePath("/tabungan");
    return { success: true, data: rowToSavingsGoal(row) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteSaving(id: string) {
  try {
    await db.delete(savings).where(eq(savings.id, id));
    revalidatePath("/");
    revalidatePath("/tabungan");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function addFundsToSavings(id: string, amount: number, walletName?: string) {
  try {
    const userId = await requireUserId();

    const result = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({
          jumlahTerkumpul: savings.jumlahTerkumpul,
          namaTujuan: savings.namaTujuan,
        })
        .from(savings)
        .where(eq(savings.id, id));

      if (!current) {
        throw new Error("Tabungan tidak ditemukan");
      }

      const newTotal = parseNumeric(current.jumlahTerkumpul) + amount;
      await tx
        .update(savings)
        .set({ jumlahTerkumpul: String(newTotal) })
        .where(eq(savings.id, id));

      if (walletName) {
        const today = new Date().toISOString().split("T")[0];
        await tx.insert(transactions).values({
          userId,
          tanggal: today,
          jenis: "pengeluaran",
          jumlah: String(amount),
          kategori: "Tabungan",
          subKategori: current.namaTujuan,
          dompet: walletName,
          deskripsi: `Menabung untuk ${current.namaTujuan}`,
        });

        // Deduct the savings amount from the associated wallet/asset balance
        const [asset] = await tx
          .select()
          .from(assets)
          .where(and(eq(assets.userId, userId), eq(assets.nama, walletName)));

        if (asset) {
          const newNilai = parseNumeric(asset.nilai) - amount;
          await tx
            .update(assets)
            .set({
              nilai: String(newNilai),
              tanggalUpdate: today,
            })
            .where(eq(assets.id, asset.id));
        } else {
          console.error("Asset not found for savings sync:", walletName);
        }
      }

      return { success: true };
    });

    revalidatePath("/");
    revalidatePath("/tabungan");
    revalidatePath("/transaksi");
    revalidatePath("/aset-hutang");
    return result;
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// Aliases for compatibility with plural names in UI components
export {
  addSaving as addSavings,
  updateSaving as updateSavings,
  deleteSaving as deleteSavings,
};
