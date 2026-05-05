"use server";

import { createClient } from "@/lib/supabase/server";
import { Asset, Debt, AssetFormData, DebtFormData } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * Server Actions for Supabase (SSR Version)
 */

export async function getAssets() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Asset[] };
}

export async function addAsset(formData: AssetFormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Silakan login terlebih dahulu" };

  const { data, error } = await supabase
    .from("assets")
    .insert([
      {
        user_id: user.id,
        nama: formData.nama,
        jenis: formData.jenis,
        nilai: formData.nilai,
        tanggal_update: formData.tanggal_update,
        catatan: formData.catatan,
      },
    ])
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/aset-hutang");
  return { success: true, data: data as Asset };
}

export async function updateAsset(assetId: string, formData: AssetFormData) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assets")
    .update({
      nama: formData.nama,
      jenis: formData.jenis,
      nilai: formData.nilai,
      tanggal_update: formData.tanggal_update,
      catatan: formData.catatan,
    })
    .eq("id", assetId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/aset-hutang");
  return { success: true, data: data as Asset };
}

export async function deleteAsset(assetId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("assets").delete().eq("id", assetId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/aset-hutang");
  return { success: true };
}

// --- DEBT ACTIONS ---

export async function getDebts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Debt[] };
}

export async function addDebt(formData: DebtFormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Silakan login terlebih dahulu" };

  const { data, error } = await supabase
    .from("debts")
    .insert([
      {
        user_id: user.id,
        nama_hutang: formData.nama_hutang,
        jenis: formData.jenis,
        total_awal: formData.total_awal,
        sisa_hutang: formData.sisa_hutang,
        cicilan_bulanan: formData.cicilan_bulanan,
        tanggal_jatuh_tempo: formData.tanggal_jatuh_tempo,
        suku_bunga: formData.suku_bunga,
        catatan: formData.catatan,
      },

    ])
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/aset-hutang");
  return { success: true, data: data as Debt };
}

export async function updateDebt(debtId: string, formData: DebtFormData) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("debts")
    .update({
      nama_hutang: formData.nama_hutang,
      jenis: formData.jenis,
      total_awal: formData.total_awal,
      sisa_hutang: formData.sisa_hutang,
      cicilan_bulanan: formData.cicilan_bulanan,
      tanggal_jatuh_tempo: formData.tanggal_jatuh_tempo,
      suku_bunga: formData.suku_bunga,
      catatan: formData.catatan,
    })

    .eq("id", debtId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/aset-hutang");
  return { success: true, data: data as Debt };
}

export async function deleteDebt(debtId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("debts").delete().eq("id", debtId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/aset-hutang");
  return { success: true };
}

/**
 * Update Asset Balance based on transaction
 * Used by transaction actions
 */
export async function updateAssetBalance(
  _sheetId: string, // Kept for compatibility with old transaction calls
  assetName: string,
  amountChange: number,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Silakan login" };

  // Cari aset berdasarkan nama untuk user ini
  const { data: asset, error: findError } = await supabase
    .from("assets")
    .select("*")
    .eq("user_id", user.id)
    .eq("nama", assetName)
    .single();

  if (findError || !asset) {
    console.error("Asset not found for sync:", assetName);
    return { success: false, error: "Aset tidak ditemukan" };
  }

  // Update nilai aset
  const newNilai = (asset.nilai || 0) + amountChange;
  const { error: updateError } = await supabase
    .from("assets")
    .update({
      nilai: newNilai,
      tanggal_update: new Date().toISOString().split("T")[0],
    })
    .eq("id", asset.id);

  if (updateError) return { success: false, error: updateError.message };

  revalidatePath("/aset-hutang");
  return { success: true };
}
