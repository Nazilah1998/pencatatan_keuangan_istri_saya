"use server";

import { db } from "@/db";
import { budgets } from "@/db/schema";
import { requireUserId, getCurrentUserId, parseNumeric } from "@/db/helpers";
import { BudgetEntry, BudgetFormData } from "@/types";
import { revalidatePath } from "next/cache";
import { eq, asc } from "drizzle-orm";

/**
 * Server Actions for Budgets (Drizzle ORM Version)
 */

function rowToBudget(row: typeof budgets.$inferSelect): BudgetEntry {
  return {
    id: row.id,
    kategori: row.kategori,
    batas_bulanan: parseNumeric(row.batasBulanan),
    periode: row.periode ?? "",
    catatan: row.catatan ?? undefined,
    created_at: row.createdAt?.toISOString() ?? "",
  };
}

export async function getBudgets() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: true, data: [] as BudgetEntry[] };

    const data = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, userId))
      .orderBy(asc(budgets.kategori));

    return { success: true, data: data.map(rowToBudget) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function addBudget(formData: BudgetFormData) {
  try {
    const userId = await requireUserId();

    const [row] = await db
      .insert(budgets)
      .values({
        userId,
        kategori: formData.kategori,
        batasBulanan: String(formData.batas_bulanan),
        periode: formData.periode,
        catatan: formData.catatan,
      })
      .returning();

    revalidatePath("/");
    revalidatePath("/anggaran");
    return { success: true, data: rowToBudget(row) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateBudget(id: string, formData: BudgetFormData) {
  try {
    const [row] = await db
      .update(budgets)
      .set({
        kategori: formData.kategori,
        batasBulanan: String(formData.batas_bulanan),
        periode: formData.periode,
        catatan: formData.catatan,
      })
      .where(eq(budgets.id, id))
      .returning();

    revalidatePath("/");
    revalidatePath("/anggaran");
    return { success: true, data: rowToBudget(row) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteBudget(id: string) {
  try {
    await db.delete(budgets).where(eq(budgets.id, id));
    revalidatePath("/");
    revalidatePath("/anggaran");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
