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
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#fcf8f9",
        fontFamily: "'Satoshi', sans-serif",
      }}
    >
      {/* Dynamic Background Elements */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          right: "-10%",
          width: "60vw",
          height: "60vw",
          background:
            "radial-gradient(circle, rgba(255,133,162,0.15) 0%, rgba(255,133,162,0) 70%)",
          borderRadius: "50%",
          filter: "blur(80px)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          left: "-10%",
          width: "50vw",
          height: "50vw",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0) 70%)",
          borderRadius: "50%",
          filter: "blur(80px)",
          zIndex: 0,
        }}
      />

      <div
        className="login-card"
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "3rem 2.5rem",
          position: "relative",
          zIndex: 1,
          background: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          borderRadius: "32px",
          boxShadow: "0 25px 50px -12px rgba(255, 133, 162, 0.15)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "2.5rem",
        }}
      >
        {/* Brand Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "linear-gradient(135deg, #ff85a2 0%, #ff6b8e 100%)",
              borderRadius: "20px",
              margin: "0 auto 0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              boxShadow: "0 10px 20px rgba(255, 133, 162, 0.3)",
              transform: "rotate(-5deg)",
            }}
          >
            💰
          </div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 900,
              color: "#2d3436",
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            Tyaaa Financee
          </h1>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "#636e72",
              lineHeight: 1.6,
              maxWidth: "320px",
              margin: "0 auto",
              fontWeight: 500,
            }}
          >
            Raih kendali penuh atas{" "}
            <span style={{ color: "#ff85a2", fontWeight: 700 }}>
              masa depan finansial
            </span>{" "}
            Anda dengan cara yang{" "}
            <span style={{ color: "#ff85a2", fontWeight: 700 }}>cerdas</span>{" "}
            dan{" "}
            <span style={{ color: "#ff85a2", fontWeight: 700 }}>eksklusif</span>
            .
          </p>
        </div>

        {/* Login Action */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              height: "3.75rem",
              borderRadius: "18px",
              fontSize: "1rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              background: "white",
              color: "#2d3436",
              border: "1px solid #e2e8f0",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 10px 15px -3px rgba(0, 0, 0, 0.08)";
              e.currentTarget.style.borderColor = "#ff85a2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 6px -1px rgba(0, 0, 0, 0.05)";
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}
          >
            {loading ? (
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  border: "2px solid #ff85a2",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            ) : (
              <>
                <Image
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  width={22}
                  height={22}
                  priority
                  unoptimized
                />
                Lanjut dengan Google
              </>
            )}
          </Button>

          <button
            onClick={() => (window.location.href = "/")}
            style={{
              background: "none",
              border: "none",
              color: "#636e72",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              padding: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ff85a2")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#636e72")}
          >
            <span>← Kembali ke Dashboard</span>
          </button>

          <p
            style={{ fontSize: "0.8125rem", color: "#b2bec3", fontWeight: 500 }}
          >
            Dengan masuk, Anda menyetujui{" "}
            <span style={{ textDecoration: "underline", cursor: "pointer" }}>
              Ketentuan Layanan
            </span>{" "}
            kami.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            paddingTop: "1.5rem",
            borderTop: "1px solid rgba(0,0,0,0.05)",
            fontSize: "0.75rem",
            color: "#b2bec3",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          © 2026 Tyaaa Financee • Version 2.0
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .login-card {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
