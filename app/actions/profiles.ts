"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { getCurrentUserId, requireUserId } from "@/db/helpers";
import { AppSettings, ActionResult } from "@/types";
import { revalidatePath } from "next/cache";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { eq } from "drizzle-orm";

/**
 * Server Actions for Profiles (Drizzle ORM Version)
 */

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

    // Simplify database storage: if custom categories or wallets are identical to defaults, store null instead of a huge redundant JSON
    const customCategoriesVal = settings.custom_categories && 
      JSON.stringify(settings.custom_categories) !== JSON.stringify(DEFAULT_SETTINGS.custom_categories)
        ? settings.custom_categories
        : null;

    const customWalletsVal = settings.custom_wallets && 
      JSON.stringify(settings.custom_wallets) !== JSON.stringify(DEFAULT_SETTINGS.custom_wallets)
        ? settings.custom_wallets
        : null;

    await db
      .insert(profiles)
      .values({
        id: userId,
        bahasa: settings.bahasa,
        matauang: settings.mata_uang,
        formatTanggal: settings.format_tanggal,
        namaPengguna: settings.nama_pengguna,
        namaPanggilan: settings.nama_panggilan,
        namaRumahTangga: settings.nama_rumah_tangga,
        temaWarna: settings.tema_warna,
        logoUrl: settings.logo_url,
        customCategories: customCategoriesVal,
        customWallets: customWalletsVal,
        anggota: settings.anggota,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          bahasa: settings.bahasa,
          matauang: settings.mata_uang,
          formatTanggal: settings.format_tanggal,
          namaPengguna: settings.nama_pengguna,
          namaPanggilan: settings.nama_panggilan,
          namaRumahTangga: settings.nama_rumah_tangga,
          temaWarna: settings.tema_warna,
          logoUrl: settings.logo_url,
          customCategories: customCategoriesVal,
          customWallets: customWalletsVal,
          anggota: settings.anggota,
          updatedAt: new Date(),
        },
      });

    revalidatePath("/pengaturan");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
