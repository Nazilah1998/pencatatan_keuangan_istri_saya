"use server";

import { createClient } from "@/lib/supabase/server";
import { Transaction, TransactionFormData } from "@/types";
import { revalidatePath } from "next/cache";
import { updateAssetBalance } from "./assets";

/**
 * Server Actions for Transactions (Supabase Version)
 */

export async function getTransactions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("tanggal", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Transaction[] };
}

export async function addTransaction(formData: TransactionFormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Silakan login" };

  const { data, error } = await supabase
    .from("transactions")
    .insert([
      {
        user_id: user.id,
        tanggal: formData.tanggal,
        jenis: formData.jenis,
        jumlah: formData.jumlah,
        kategori: formData.kategori,
        sub_kategori: formData.sub_kategori,
        dompet: formData.dompet,
        deskripsi: formData.deskripsi,
        penerima: formData.penerima,
      },
    ])
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Sync Asset Balance
  const amountChange =
    formData.jenis === "pemasukan" ? formData.jumlah : -formData.jumlah;
  await updateAssetBalance("", formData.dompet, amountChange);

  revalidatePath("/");
  revalidatePath("/transaksi");
  revalidatePath("/aset-hutang");
  return { success: true, data: data as Transaction };
}

export async function updateTransaction(
  id: string,
  formData: TransactionFormData,
  oldData: Transaction,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .update({
      tanggal: formData.tanggal,
      jenis: formData.jenis,
      jumlah: formData.jumlah,
      kategori: formData.kategori,
      sub_kategori: formData.sub_kategori,
      dompet: formData.dompet,
      deskripsi: formData.deskripsi,
      penerima: formData.penerima,
    })

    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Sync Asset Balance (Reverse old, Apply new)
  const reverseOld =
    oldData.jenis === "pemasukan" ? -oldData.jumlah : oldData.jumlah;
  await updateAssetBalance("", oldData.dompet, reverseOld);

  const applyNew =
    formData.jenis === "pemasukan" ? formData.jumlah : -formData.jumlah;
  await updateAssetBalance("", formData.dompet, applyNew);

  revalidatePath("/");
  revalidatePath("/transaksi");
  revalidatePath("/aset-hutang");
  return { success: true, data: data as Transaction };
}

export async function deleteTransaction(id: string, transaction: Transaction) {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  // Sync Asset Balance (Reverse deleted transaction)
  const amountChange =
    transaction.jenis === "pemasukan"
      ? -transaction.jumlah
      : transaction.jumlah;
  await updateAssetBalance("", transaction.dompet, amountChange);

  revalidatePath("/");
  revalidatePath("/transaksi");
  revalidatePath("/aset-hutang");
  return { success: true };
}
