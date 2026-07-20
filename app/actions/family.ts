"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getFamilyCode() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const [profile] = await db
      .select({ householdId: profiles.householdId })
      .from(profiles)
      .where(eq(profiles.id, user.id));

    // Kode keluarga adalah householdId jika ada, atau userId sendiri jika tidak ada
    const familyCode = profile?.householdId || user.id;
    
    // Hitung ada berapa orang yang menggunakan kode ini
    const members = await db
      .select({ id: profiles.id, fullName: profiles.fullName, email: profiles.email })
      .from(profiles)
      .where(
        sql`${profiles.householdId} = ${familyCode} OR ${profiles.id} = ${familyCode}`
      );

    return { 
      success: true, 
      code: familyCode, 
      members,
      isOwner: !profile?.householdId || profile.householdId === user.id
    };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function joinFamily(inviteCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(inviteCode)) {
    return { success: false, error: "Kode undangan tidak valid." };
  }

  if (inviteCode === user.id) {
    return { success: false, error: "Tidak dapat bergabung dengan diri sendiri." };
  }

  try {
    // Check if target user exists
    const [targetProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, inviteCode));
      
    if (!targetProfile) {
      return { success: false, error: "Kode undangan tidak ditemukan." };
    }

    // Join household
    await db
      .update(profiles)
      .set({ householdId: inviteCode })
      .where(eq(profiles.id, user.id));

    revalidatePath("/");
    revalidatePath("/pengaturan");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function leaveFamily() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // Keluar dari keluarga = reset householdId ke null
    await db
      .update(profiles)
      .set({ householdId: null })
      .where(eq(profiles.id, user.id));

    revalidatePath("/");
    revalidatePath("/pengaturan");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
