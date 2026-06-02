"use server";

import { db } from "@/db";
import { profiles, transactions, assets, debts, budgets, savings } from "@/db/schema";
import { getCurrentUserId, requireUserId } from "@/db/helpers";
import { AppSettings, ActionResult } from "@/types";
import { revalidatePath } from "next/cache";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { eq, and } from "drizzle-orm";
import { settingsSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";

export async function getProfile(): Promise<
  ActionResult<Partial<AppSettings>>
> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: true, data: DEFAULT_SETTINGS };

    const [data] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId));

    if (!data) {
      return { success: true, data: DEFAULT_SETTINGS };
    }

    const settings = {
      ...DEFAULT_SETTINGS,
      bahasa: data.bahasa ?? DEFAULT_SETTINGS.bahasa,
      mata_uang: data.matauang ?? DEFAULT_SETTINGS.mata_uang,
      format_tanggal:
        (data.formatTanggal as AppSettings["format_tanggal"]) ??
        DEFAULT_SETTINGS.format_tanggal,
      nama_pengguna: data.namaPengguna ?? DEFAULT_SETTINGS.nama_pengguna,
      nama_panggilan: data.namaPanggilan ?? DEFAULT_SETTINGS.nama_panggilan,
      nama_rumah_tangga:
        data.namaRumahTangga ?? DEFAULT_SETTINGS.nama_rumah_tangga,
      tema_warna: data.temaWarna ?? DEFAULT_SETTINGS.tema_warna,
      logo_url: data.logoUrl ?? undefined,
      custom_categories:
        (data.customCategories as AppSettings["custom_categories"]) ??
        DEFAULT_SETTINGS.custom_categories,
      custom_wallets:
        (data.customWallets as AppSettings["custom_wallets"]) ??
        DEFAULT_SETTINGS.custom_wallets,
      anggota:
        (data.anggota as AppSettings["anggota"]) ?? DEFAULT_SETTINGS.anggota,
    };

    return { success: true, data: settings as Partial<AppSettings> };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateProfile(
  settings: Partial<AppSettings>,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();

    const parsed = settingsSchema.partial().safeParse(settings);
    if (!parsed.success) {
      return { success: false, error: "Data tidak valid: " + parsed.error.message };
    }

    const validData = parsed.data;

    await db
      .insert(profiles)
      .values({
        id: userId,
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
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
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
        },
      });

    revalidatePath("/pengaturan");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function resetAllUserData(): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();

    // Fetch logo_url before deleting profile so we can remove the file from storage
    const [profile] = await db
      .select({ logoUrl: profiles.logoUrl })
      .from(profiles)
      .where(eq(profiles.id, userId));

    await db.delete(transactions).where(eq(transactions.userId, userId));
    await db.delete(assets).where(eq(assets.userId, userId));
    await db.delete(debts).where(eq(debts.userId, userId));
    await db.delete(budgets).where(eq(budgets.userId, userId));
    await db.delete(savings).where(eq(savings.userId, userId));

    // Delete logo from Supabase Storage to avoid orphaned files
    if (profile?.logoUrl) {
      const prefix = "/storage/v1/object/public/user-assets/";
      const idx = profile.logoUrl.indexOf(prefix);
      if (idx !== -1) {
        const filePath = profile.logoUrl.substring(idx + prefix.length);
        if (filePath.startsWith("logos/")) {
          await supabase.storage.from("user-assets").remove([filePath]);
        }
      }
    }

    await db.delete(profiles).where(eq(profiles.id, userId));

    revalidatePath("/pengaturan");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
