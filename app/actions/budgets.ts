"use server";

import { createClient } from "@/lib/supabase/server";
import { BudgetEntry, BudgetFormData } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Server Actions for Budgets (Supabase Version)
 */

export async function getBudgets() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .order("kategori", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as BudgetEntry[] };
}

export async function addBudget(formData: BudgetFormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Silakan login" };

  const { data, error } = await supabase
    .from("budgets")
    .insert([
      {
        user_id: user.id,
        kategori: formData.kategori,
        batas_bulanan: formData.batas_bulanan,
        periode: formData.periode,
        catatan: formData.catatan,
      },
    ])
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/anggaran");
  return { success: true, data: data as BudgetEntry };
}

export async function updateBudget(id: string, formData: BudgetFormData) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("budgets")
    .update({
      kategori: formData.kategori,
      batas_bulanan: formData.batas_bulanan,
      periode: formData.periode,
      catatan: formData.catatan,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/anggaran");
  return { success: true, data: data as BudgetEntry };
}

export async function deleteBudget(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/anggaran");
  return { success: true };
}
