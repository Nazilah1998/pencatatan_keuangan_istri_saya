"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  Building2,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarOpen, setSidebarOpen, settings } = useAppStore();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { href: "/", label: t("sidebar.dashboard"), icon: LayoutDashboard },
    {
      href: "/transaksi",
      label: t("sidebar.transactions"),
      icon: ArrowLeftRight,
    },
    { href: "/anggaran", label: t("sidebar.budget"), icon: Wallet },
    { href: "/tabungan", label: t("sidebar.savings"), icon: PiggyBank },
    { href: "/aset-hutang", label: t("sidebar.assets"), icon: Building2 },
    { href: "/laporan", label: t("sidebar.reports"), icon: BarChart3 },
    { href: "/pengaturan", label: t("sidebar.settings"), icon: Settings },
  ];

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  // Prevent scrolling when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isSidebarOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Mobile overlay with smooth fade */}
      <div
        onClick={() => setSidebarOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "oklch(0.15 0.01 80 / 0.4)",
          backdropFilter: "blur(4px)",
          zIndex: 9990,
          opacity: isSidebarOpen ? 1 : 0,
          visibility: isSidebarOpen ? "visible" : "hidden",
          transition:
            "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s",
          pointerEvents: isSidebarOpen ? "auto" : "none",
        }}
        className="sidebar-overlay"
      />

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
          transition:
            "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s",
          overflowY: "auto",
          boxShadow: isSidebarOpen
            ? "20px 0 25px -5px rgb(0 0 0 / 0.1), 8px 0 10px -6px rgb(0 0 0 / 0.1)"
            : "none",
        }}
      >
        {/* Logo Section */}
        <div
          style={{
            padding: "1.75rem 1.25rem 1.25rem",
            borderBottom: "1px solid var(--color-divider)",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                background: settings.logo_url
                  ? "var(--color-surface)"
                  : "linear-gradient(135deg, var(--color-primary), #ec4899)",
                borderRadius: "var(--radius-lg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                position: "relative",
                overflow: "hidden",
                border: settings.logo_url
                  ? "1px solid var(--color-border)"
                  : "none",
              }}
            >
              {settings.logo_url ? (
                <Image
                  src={settings.logo_url}
                  alt="App Logo"
                  fill
                  style={{ objectFit: "cover" }}
                />
              ) : (
                "💎"
              )}
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "1.0625rem",
                  color: "var(--color-text)",
                  letterSpacing: "-0.025em",
                }}
              >
                Tyaaa Financee
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  fontWeight: 500,
                }}
              >
                {settings.nama_rumah_tangga || "Rumah Tangga Saya"}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: "1rem 0.75rem 0" }}>
          <ul
            style={{
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem",
            }}
          >
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setSidebarOpen(false)} // Close sidebar on link click (mobile)
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.875rem",
                      padding: "0.75rem 1rem",
                      borderRadius: "var(--radius-xl)",
                      fontSize: "0.9375rem",
                      fontWeight: isActive ? 700 : 500,
                      color: isActive
                        ? "var(--color-primary)"
                        : "var(--color-text-muted)",
                      background: isActive
                        ? "var(--color-primary-highlight)"
                        : "transparent",
                      textDecoration: "none",
                      transition: "all 0.2s ease",
                      minHeight: 48,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--color-surface-offset)";
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--color-text)";
                        (e.currentTarget as HTMLElement).style.transform =
                          "translateX(4px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background =
                          "transparent";
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--color-text-muted)";
                        (e.currentTarget as HTMLElement).style.transform =
                          "translateX(0)";
                      }
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 20,
                      }}
                    >
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span style={{ flex: 1 }}>{label}</span>
                    {isActive && (
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "var(--color-primary)",
                          boxShadow: "0 0 10px var(--color-primary)",
                        }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Account Section */}
        {user ? (
          <div
            style={{
              margin: "0 0.75rem 1rem",
              padding: "1rem",
              background: "var(--color-surface-offset)",
              borderRadius: "var(--radius-xl)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              border: "1px solid var(--color-border)",
            }}
          >
            {user.user_metadata?.avatar_url ? (
              <Image
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata.full_name || "User"}
                width={36}
                height={36}
                style={{
                  borderRadius: "50%",
                  border: "2px solid var(--color-surface)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(45deg, var(--color-primary), #6366f1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  flexShrink: 0,
                }}
              >
                {user.user_metadata?.full_name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--color-text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.user_metadata?.full_name}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </div>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              title="Keluar"
              style={{
                padding: "0.5rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text-muted)",
                borderRadius: "var(--radius-md)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--color-danger)";
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(239, 68, 68, 0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--color-text-muted)";
                (e.currentTarget as HTMLElement).style.background = "none";
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div style={{ margin: "0 0.75rem 1rem" }}>
            <button
              onClick={async () => {
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  },
                });
              }}
              style={{
                width: "100%",
                padding: "0.875rem",
                background: "white",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-xl)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#333",
                boxShadow: "var(--shadow-sm)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--color-surface-offset)";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "white";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(0)";
              }}
            >
              <Image
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                width={18}
                height={18}
                unoptimized
              />
              Masuk dengan Google
            </button>
          </div>
        )}
      </aside>

      <style jsx global>{`
        @media (max-width: 1023px) {
          aside {
            transform: ${isSidebarOpen ? "translateX(0)" : "translateX(-100%)"};
          }
        }
        @media (min-width: 1024px) {
          .sidebar-overlay {
            display: none !important;
          }
          aside {
            transform: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  );
}
