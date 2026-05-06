"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getProfile, updateProfile } from "@/app/actions/profiles";
import { createClient } from "@/lib/supabase/client";

export function ProfileSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings, setSettings, user, setUser } = useAppStore();
  const isInitialMount = useRef(true);
  const supabase = createClient();

  // 1. Sync User Session and Fetch Profile
  useEffect(() => {
    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { user: sUser } = session;
        // Map Supabase user to our Profile type
        setUser({
          id: sUser.id,
          email: sUser.email || "",
          full_name: sUser.user_metadata?.full_name,
          avatar_url: sUser.user_metadata?.avatar_url,
        });

        const res = await getProfile();
        if (res.success && res.data) {
          // Only merge non-null cloud values
          const safeCloudSettings = Object.fromEntries(
            Object.entries(res.data).filter(([, v]) => v != null),
          );
          setSettings(safeCloudSettings);
        }
      } else {
        setUser(null);
      }
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const { user: sUser } = session;
        setUser({
          id: sUser.id,
          email: sUser.email || "",
          full_name: sUser.user_metadata?.full_name,
          avatar_url: sUser.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, setSettings, setUser]);

  // 2. Auto-save settings to DB when they change (Debounced)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!user) return;

    const timer = setTimeout(async () => {
      try {
        const res = await updateProfile(settings);
        if (!res.success) {
          console.error("❌ [CloudSync] Update failed:", res.error);
        } else {
          console.log("✅ [CloudSync] Settings saved to Supabase");
        }
      } catch (err) {
        console.error("❌ [CloudSync] Unexpected error:", err);
      }
    }, 2000); // Debounce 2s

    return () => clearTimeout(timer);
  }, [settings, user]);

  return <>{children}</>;
}
