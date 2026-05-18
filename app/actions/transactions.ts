"use server";

import { db } from "@/db";
import { transactions } from "@/db/schema";
import { getCurrentUserId, requireUserId, parseNumeric } from "@/db/helpers";
import { Transaction, TransactionFormData } from "@/types";
import { revalidatePath } from "next/cache";
import { updateAssetBalance } from "./assets";
import { eq, desc } from "drizzle-orm";

/**
 * Server Actions for Transactions (Drizzle ORM Version)
 */

function rowToTransaction(
  row: typeof transactions.$inferSelect,
): Transaction {
  return {
    id: row.id,
    tanggal: row.tanggal,
    jenis: row.jenis as Transaction["jenis"],
    jumlah: parseNumeric(row.jumlah),
    kategori: row.kategori ?? "",
    sub_kategori: row.subKategori,
    dompet: row.dompet ?? "",
    deskripsi: row.deskripsi ?? undefined,
    created_at: row.createdAt?.toISOString() ?? "",
  };
}

export async function getTransactions() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const data = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.tanggal));

    return { success: true, data: data.map(rowToTransaction) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function addTransaction(formData: TransactionFormData) {
  try {
    const userId = await requireUserId();

    const [row] = await db
      .insert(transactions)
      .values({
        userId,
        tanggal: formData.tanggal,
        jenis: formData.jenis,
        jumlah: String(formData.jumlah),
        kategori: formData.kategori,
        subKategori: formData.sub_kategori,
        dompet: formData.dompet,
        deskripsi: formData.deskripsi,
      })
      .returning();

    const amountChange =
      formData.jenis === "pemasukan" ? formData.jumlah : -formData.jumlah;
    await updateAssetBalance("", formData.dompet, amountChange);

    revalidatePath("/");
    revalidatePath("/transaksi");
    revalidatePath("/aset-hutang");
    return { success: true, data: rowToTransaction(row) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateTransaction(
  id: string,
  formData: TransactionFormData,
  oldData: Transaction,
) {
  try {
    const [row] = await db
      .update(transactions)
      .set({
        tanggal: formData.tanggal,
        jenis: formData.jenis,
        jumlah: String(formData.jumlah),
        kategori: formData.kategori,
        subKategori: formData.sub_kategori,
        dompet: formData.dompet,
        deskripsi: formData.deskripsi,
      })
      .where(eq(transactions.id, id))
      .returning();

    const reverseOld =
      oldData.jenis === "pemasukan" ? -oldData.jumlah : oldData.jumlah;
    await updateAssetBalance("", oldData.dompet, reverseOld);

    const applyNew =
      formData.jenis === "pemasukan" ? formData.jumlah : -formData.jumlah;
    await updateAssetBalance("", formData.dompet, applyNew);

    revalidatePath("/");
    revalidatePath("/transaksi");
    revalidatePath("/aset-hutang");
    return { success: true, data: rowToTransaction(row) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteTransaction(id: string, transaction: Transaction) {
  try {
    await db.delete(transactions).where(eq(transactions.id, id));

    const amountChange =
      transaction.jenis === "pemasukan"
        ? -transaction.jumlah
        : transaction.jumlah;
    await updateAssetBalance("", transaction.dompet, amountChange);

    revalidatePath("/");
    revalidatePath("/transaksi");
    revalidatePath("/aset-hutang");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
