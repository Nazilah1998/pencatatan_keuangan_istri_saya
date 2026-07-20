import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get the current authenticated user's ID from Supabase Auth session.
 * This is the only remaining usage of Supabase server client — purely for auth.
 * Returns null if not authenticated.
 */
export const getCurrentUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  try {
    // Ambil profile user untuk mengecek apakah ada household_id
    const [profile] = await db
      .select({ householdId: profiles.householdId })
      .from(profiles)
      .where(eq(profiles.id, user.id));

    // Jika user tergabung dalam sebuah household, kembalikan householdId.
    // Jika tidak, kembalikan user.id (default per akun)
    return profile?.householdId || user.id;
  } catch (error) {
    console.error("Error fetching user profile for householdId:", error);
    return user.id; // Fallback jika query gagal
  }
});

/**
 * Get the current authenticated user's ID, or throw an error if not authenticated.
 * Use this in mutation actions (add, update, delete) where auth is required.
 */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Silakan login terlebih dahulu");
  }
  return userId;
}

/**
 * Parse a numeric string value from Postgres to a JavaScript number.
 * Drizzle returns `numeric` columns as strings to preserve precision.
 */
export function parseNumeric(value: string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}
