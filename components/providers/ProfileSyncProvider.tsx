"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getProfile, updateProfile } from "@/app/actions/profiles";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { DEFAULT_SETTINGS } from "@/lib/defaults";

export function ProfileSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings, setSettings, user, setUser, _lastManualSyncStr, setLastManualSyncStr } = useAppStore();
  const isInitialMount = useRef(true);
  const initialSyncDone = useRef(false);
  const supabase = createClient();

  // 1. Sync User Session and Fetch Profile
  useEffect(() => {
    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { user: sUser } = session;
        setUser({
          id: sUser.id,
          email: sUser.email || "",
          full_name: sUser.user_metadata?.full_name,
          avatar_url: sUser.user_metadata?.avatar_url,
        });

        if (!initialSyncDone.current) {
          initialSyncDone.current = true;
          const res = await getProfile();
          if (res.success && res.data) {
            const safeCloudSettings = Object.fromEntries(
              Object.entries(res.data).filter(([, v]) => v != null),
            );
            // Only overwrite local with cloud if local settings are still defaults (never customized)
            const currentSettings = useAppStore.getState().settings;
            const isDefault = JSON.stringify(currentSettings) === JSON.stringify(DEFAULT_SETTINGS);
            if (isDefault) {
              setSettings(safeCloudSettings);
            }
          }
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
  // Skips if settings haven't changed from last manual sync
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!user) return;

    const settingsStr = JSON.stringify(settings);

    // Skip auto-sync if this exact state was already manually synced
    if (_lastManualSyncStr && settingsStr === _lastManualSyncStr) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await updateProfile(settings);
        if (!res.success) {
          console.error("❌ [CloudSync] Update failed:", res.error);
          toast.error("Gagal menyimpan pengaturan ke cloud");
        }
      } catch (err) {
        console.error("❌ [CloudSync] Unexpected error:", err);
        toast.error("Gagal menyimpan pengaturan ke cloud");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [settings, user, _lastManualSyncStr]);

  return <>{children}</>;
}
