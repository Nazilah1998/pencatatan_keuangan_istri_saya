"use server";

import { createClient } from "@/lib/supabase/server";
import { SavingsGoal, SavingsFormData } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Server Actions for Savings (Supabase Version)
 * Supporting both singular and plural names for compatibility
 */

export async function getSavings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("savings")
    .select("*")
    .order("target_tanggal", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as SavingsGoal[] };
}

export async function addSaving(formData: SavingsFormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Silakan login" };

  const { data, error } = await supabase
    .from("savings")
    .insert([
      {
        user_id: user.id,
        nama_tujuan: formData.nama_tujuan,
        target_jumlah: formData.target_jumlah,
        jumlah_terkumpul: formData.jumlah_terkumpul,
        target_tanggal: formData.target_tanggal,
        ikon: formData.ikon,
        warna: formData.warna,
        deskripsi: formData.deskripsi,
        prioritas: formData.prioritas,
        status: formData.status,
      },
    ])
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/tabungan");
  return { success: true, data: data as SavingsGoal };
}

export async function updateSaving(id: string, formData: SavingsFormData) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("savings")
    .update({
      nama_tujuan: formData.nama_tujuan,
      target_jumlah: formData.target_jumlah,
      jumlah_terkumpul: formData.jumlah_terkumpul,
      target_tanggal: formData.target_tanggal,
      ikon: formData.ikon,
      warna: formData.warna,
      deskripsi: formData.deskripsi,
      prioritas: formData.prioritas,
      status: formData.status,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/tabungan");
  return { success: true, data: data as SavingsGoal };
}

export async function deleteSaving(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("savings").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/tabungan");
  return { success: true };
}

// Tambahkan dana ke tabungan tertentu
export async function addFundsToSavings(id: string, amount: number) {
  const supabase = await createClient();

  // Ambil data lama dulu
  const { data: current } = await supabase
    .from("savings")
    .select("jumlah_terkumpul")
    .eq("id", id)
    .single();

  if (!current) return { success: false, error: "Tabungan tidak ditemukan" };

  const newTotal = (current.jumlah_terkumpul || 0) + amount;

  const { error } = await supabase
    .from("savings")
    .update({ jumlah_terkumpul: newTotal })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/tabungan");
  return { success: true };
}

// Aliases for compatibility with plural names in UI components
export {
  addSaving as addSavings,
  updateSaving as updateSavings,
  deleteSaving as deleteSavings,
};
