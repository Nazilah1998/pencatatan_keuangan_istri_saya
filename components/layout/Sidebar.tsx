"use client";
import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { useTranslation } from "@/lib/i18n/useTranslation";

// Sub-components
import { SidebarOverlay } from "./sidebar/SidebarOverlay";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SidebarNav } from "./sidebar/SidebarNav";
import { SidebarUser } from "./sidebar/SidebarUser";

export function Sidebar() {
  const router = useRouter();
  const { isSidebarOpen, setSidebarOpen, settings } = useAppStore();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();
  const { t } = useTranslation();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  // Prevent scrolling when sidebar is open on mobile
  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
  }, [isSidebarOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  if (!mounted) return null;

  return (
    <>
      <SidebarOverlay isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100dvh",
          width: "var(--sidebar-width)",
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          zIndex: 9991,
          transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s",
          overflowY: "auto",
          boxShadow: isSidebarOpen ? "20px 0 25px -5px rgb(0 0 0 / 0.1)" : "none",
        }}
      >
        <SidebarHeader logoUrl={settings.logo_url} householdName={settings.nama_rumah_tangga} />
        
        <SidebarNav onItemClick={() => setSidebarOpen(false)} t={t} />

        <SidebarUser user={user} onSignOut={handleSignOut} onSignIn={handleSignIn} />
      </aside>

      <style jsx global>{`
        @media (max-width: 1023px) {
          aside { transform: ${isSidebarOpen ? "translateX(0)" : "translateX(-100%)"}; }
        }
        @media (min-width: 1024px) {
          .sidebar-overlay { display: none !important; }
          aside { transform: none !important; box-shadow: none !important; }
        }
      `}</style>
    </>
  );
}
