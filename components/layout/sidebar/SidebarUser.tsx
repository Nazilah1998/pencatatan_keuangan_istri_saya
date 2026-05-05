"use client";
import React from "react";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface SidebarUserProps {
  user: User | null;
  onSignOut: () => void;
  onSignIn: () => void;
}

export function SidebarUser({ user, onSignOut, onSignIn }: SidebarUserProps) {
  if (!user) {
    return (
      <div style={{ margin: "0 0.75rem 1rem" }}>
        <button
          onClick={onSignIn}
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
    );
  }

  return (
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
            background: "linear-gradient(45deg, var(--color-primary), #6366f1)",
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
        onClick={onSignOut}
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
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}
