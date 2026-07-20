"use client";
import React, { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type ViewState = "login" | "register" | "forgot_password";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewState>("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Email dan kata sandi harus diisi");
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Login berhasil!");
      router.push("/");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Gagal masuk");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Email dan kata sandi harus diisi");
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      toast.success("Berhasil mendaftar! Cek email untuk verifikasi atau Anda bisa langsung masuk.");
      setView("login");
      setPassword("");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Gagal membuat akun");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Email harus diisi terlebih dahulu");
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) throw error;
      toast.success("Tautan reset kata sandi telah dikirim ke email Anda!");
      setView("login");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Gagal mengirim tautan reset");
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
          background: "radial-gradient(circle, rgba(255,133,162,0.15) 0%, rgba(255,133,162,0) 70%)",
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
          background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0) 70%)",
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
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        {view !== "login" && (
          <button
            onClick={() => setView("login")}
            style={{
              position: "absolute",
              top: "1.5rem",
              left: "1.5rem",
              background: "none",
              border: "none",
              color: "#636e72",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
        )}

        {/* Brand Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "center", marginTop: view !== "login" ? "1.5rem" : "0" }}>
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
            {view === "login" ? "Tyaaa Financee" : view === "register" ? "Buat Akun Baru" : "Lupa Password"}
          </h1>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "#636e72",
              lineHeight: 1.6,
              margin: "0 auto",
              fontWeight: 500,
            }}
          >
            {view === "login" && (
              <>Raih kendali penuh atas <span style={{ color: "#ff85a2", fontWeight: 700 }}>masa depan finansial</span> Anda.</>
            )}
            {view === "register" && "Mulai perjalanan finansial Anda bersama kami."}
            {view === "forgot_password" && "Masukkan email Anda untuk menerima tautan reset kata sandi."}
          </p>
        </div>

        {/* Auth Forms */}
        <form
          onSubmit={
            view === "login" ? handleEmailLogin : view === "register" ? handleSignUp : handleForgotPassword
          }
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <div style={{ position: "relative" }}>
            <Mail size={18} color="#a0aec0" style={{ position: "absolute", top: "14px", left: "14px" }} />
            <input
              type="email"
              placeholder="Email Anda"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px 12px 42px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                background: "white",
                fontSize: "0.9375rem",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              required
            />
          </div>

          {view !== "forgot_password" && (
            <div style={{ position: "relative" }}>
              <Lock size={18} color="#a0aec0" style={{ position: "absolute", top: "14px", left: "14px" }} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Kata Sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 42px 12px 42px",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  background: "white",
                  fontSize: "0.9375rem",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#a0aec0",
                  padding: 0,
                  display: "flex",
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {view === "login" && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setView("forgot_password")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ff85a2",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Lupa Password?
              </button>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            style={{
              height: "3.25rem",
              borderRadius: "14px",
              fontSize: "1rem",
              fontWeight: 700,
              background: "linear-gradient(135deg, #ff85a2 0%, #ff6b8e 100%)",
              color: "white",
              border: "none",
              boxShadow: "0 10px 15px -3px rgba(255, 133, 162, 0.4)",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "0.5rem",
            }}
          >
            {loading ? (
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  border: "2px solid white",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            ) : view === "login" ? (
              "Masuk"
            ) : view === "register" ? (
              "Daftar Sekarang"
            ) : (
              "Kirim Tautan Reset"
            )}
          </Button>
        </form>

        {view === "login" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "0.5rem 0" }}>
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
              <span style={{ fontSize: "0.8125rem", color: "#a0aec0", fontWeight: 600 }}>Atau</span>
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            </div>

            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                height: "3.25rem",
                borderRadius: "14px",
                fontSize: "0.9375rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                background: "white",
                color: "#2d3436",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
            >
              <Image
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                width={20}
                height={20}
                priority
                unoptimized
              />
              Lanjut dengan Google
            </Button>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          {view === "login" ? (
            <p style={{ fontSize: "0.875rem", color: "#636e72", margin: 0, fontWeight: 500 }}>
              Belum punya akun?{" "}
              <button
                onClick={() => setView("register")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ff85a2",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Buat Akun
              </button>
            </p>
          ) : view === "register" ? (
            <p style={{ fontSize: "0.875rem", color: "#636e72", margin: 0, fontWeight: 500 }}>
              Sudah punya akun?{" "}
              <button
                onClick={() => setView("login")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ff85a2",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Masuk
              </button>
            </p>
          ) : null}
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
            textAlign: "center"
          }}
        >
          © 2026 Tyaaa Financee • Version 2.0
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .login-card {
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
