import { createClient } from "@/lib/supabase/server";

/**
 * Get the current authenticated user's ID from Supabase Auth session.
 * This is the only remaining usage of Supabase server client — purely for auth.
 * Returns null if not authenticated.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // SHARED FAMILY MODE: Always return "Tyaaa" user ID so husband & wife share the same data
  return "fc4ebe72-da3c-415e-899c-796d79ccdb72";
}

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
