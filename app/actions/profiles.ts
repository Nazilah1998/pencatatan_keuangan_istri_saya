"use server";

import { createClient } from "@/lib/supabase/server";
import { AppSettings, ActionResult } from "@/types";
import { revalidatePath } from "next/cache";

export async function getProfile(): Promise<
  ActionResult<Partial<AppSettings>>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not logged in" };

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    // If profile doesn't exist yet, we might want to return default or handle it
    return { success: false, error: error.message };
  }

  return { success: true, data: data as Partial<AppSettings> };
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
