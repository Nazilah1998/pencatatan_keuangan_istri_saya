"use server";

import { createClient } from "@/lib/supabase/server";
import { AppSettings, ActionResult } from "@/types";
import { revalidatePath } from "next/cache";
import { DEFAULT_SETTINGS } from "@/lib/defaults";

export async function getProfile(): Promise<
  ActionResult<Partial<AppSettings>>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: true, data: DEFAULT_SETTINGS };

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    // If profile doesn't exist yet, return defaults
    return { success: true, data: DEFAULT_SETTINGS };
  }

  // Ensure categories and wallets have fallbacks if null in DB
  const settings = {
    ...DEFAULT_SETTINGS,
    ...data,
    custom_categories:
      data.custom_categories || DEFAULT_SETTINGS.custom_categories,
    custom_wallets: data.custom_wallets || DEFAULT_SETTINGS.custom_wallets,
  };

  return { success: true, data: settings as Partial<AppSettings> };
}

export async function updateProfile(
  settings: Partial<AppSettings>,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not logged in" };

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    ...settings,
    updated_at: new Date().toISOString(),
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/pengaturan");
  return { success: true };
}
