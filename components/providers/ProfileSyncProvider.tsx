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
  const { settings, setSettings, user } = useAppStore();
  const isInitialMount = useRef(true);
  const supabase = createClient();

  // 1. Fetch profile from DB on login/mount
  useEffect(() => {
    const fetchCloudProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await getProfile();
      if (res.success && res.data) {
        // Sync local store with cloud data
        setSettings(res.data);
      }
    };

    fetchCloudProfile();
  }, [supabase.auth, setSettings]);

  // 2. Auto-save settings to DB when they change (Debounced)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!user) return;

    const timer = setTimeout(async () => {
      await updateProfile(settings);
    }, 2000); // Debounce 2s

    return () => clearTimeout(timer);
  }, [settings, user]);

  return <>{children}</>;
}
