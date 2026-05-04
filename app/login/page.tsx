"use client";

import React, { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal login dengan Google";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        padding: "1.5rem",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "2.5rem 2rem",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
          boxShadow: "var(--shadow-lg)",
          borderRadius: "24px",
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <div
            style={{
              fontSize: "2.5rem",
              marginBottom: "0.5rem",
            }}
          >
            💰
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>
            Tyaaa Financee
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
              lineHeight: 1.5,
            }}
          >
            Kelola aset dan hutang keluarga dengan lebih cerdas dan profesional.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              height: "3.5rem",
              borderRadius: "16px",
              fontSize: "1rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              background: "white",
              color: "#333",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            }}
          >
            {loading ? (
              "Menghubungkan..."
            ) : (
              <>
                <Image
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  width={20}
                  height={20}
                  priority
                  unoptimized
                />
                Lanjut dengan Google
              </>
            )}
          </Button>

          <p style={{ fontSize: "0.75rem", color: "var(--color-text-faint)" }}>
            Dengan masuk, Anda menyetujui ketentuan layanan kami.
          </p>
        </div>

        <div
          style={{
            paddingTop: "1rem",
            borderTop: "1px solid var(--color-divider)",
            fontSize: "0.8125rem",
            color: "var(--color-text-muted)",
          }}
        >
          © 2026 Tyaaa Financee
        </div>
      </div>
    </div>
  );
}
