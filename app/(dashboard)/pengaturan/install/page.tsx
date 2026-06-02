"use client";
import React from "react";
import { Button } from "@/components/ui/Button";
import {
  Smartphone,
  ChevronLeft,
  Download,
  Share2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { usePWA } from "@/components/providers/PWAProvider";

function ChromeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="12" />
      <line x1="12" y1="12" x2="20" y2="8" />
      <line x1="12" y1="12" x2="4" y2="8" />
    </svg>
  );
}

function SafariIcon() {
  return (
    <svg viewBox="-1 -1 26 26" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="11" />
      <path d="M12 2a14 14 0 0 1 0 20 14 14 0 0 1 0-20z" />
      <path d="M8 12a4 4 0 0 0 8 0 4 4 0 0 0-8 0z" />
    </svg>
  );
}

export default function InstallPage() {
  const { t } = useTranslation();
  const { isInstallable, isIOS, installApp } = usePWA();

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", paddingBottom: "3rem" }}>
      <Link
        href="/pengaturan"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--color-text-muted)",
          textDecoration: "none",
          fontSize: "0.875rem",
          fontWeight: 600,
          marginBottom: "1.5rem",
          width: "fit-content",
        }}
      >
        <ChevronLeft size={18} /> {t("settings.back")}
      </Link>

      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.5rem",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              background: "rgba(6, 182, 212, 0.1)",
              color: "#06b6d4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Smartphone size={20} />
          </div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            Install Aplikasi
          </h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          Pasang Tyaaa Financee ke layar utama HP Anda seperti aplikasi native
        </p>
      </div>

      {/* Install Button Card */}
      {isInstallable && (
        <div
          className="card"
          style={{
            padding: "2rem",
            marginBottom: "2rem",
            textAlign: "center",
            background: "linear-gradient(135deg, var(--color-primary-highlight), transparent)",
            border: "2px solid var(--color-primary)",
          }}
        >
          <CheckCircle2
            size={48}
            style={{ color: "var(--color-primary)", marginBottom: "1rem" }}
          />
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "var(--color-text)",
              marginBottom: "0.5rem",
            }}
          >
            Aplikasi Siap Dipasang
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
              marginBottom: "1.5rem",
              lineHeight: 1.5,
            }}
          >
            Tyaaa Financee dapat dipasang langsung ke perangkat Anda. 
            Klik tombol di bawah untuk memulai instalasi.
          </p>
          <Button
            onClick={installApp}
            variant="primary"
            size="lg"
            style={{
              height: "3.5rem",
              borderRadius: "16px",
              fontWeight: 700,
              fontSize: "1.1rem",
            }}
            fullWidth
          >
            <Download size={20} style={{ marginRight: "0.5rem" }} />
            Install Aplikasi
          </Button>
        </div>
      )}

      {/* How to Install Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Android Guide */}
        <div
          className="card"
          style={{
            padding: "1.75rem",
            border: "1px solid var(--color-border)",
          }}
        >
          <h4
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "1.1rem",
              fontWeight: 800,
              marginBottom: "1rem",
              color: "#3ddc84",
            }}
          >
            <ChromeIcon /> Android — Google Chrome
          </h4>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "var(--color-text)",
            }}
          >
            <Step num="1" color="#3ddc84">
              Buka aplikasi <strong>Chrome</strong> di HP Android Anda dan kunjungi website Tyaaa Financee.
            </Step>
            <Step num="2" color="#3ddc84">
              Ketuk ikon menu <strong>⋮</strong> (titik tiga) di pojok kanan atas.
            </Step>
            <Step num="3" color="#3ddc84">
              Pilih <strong>&quot;Install Aplikasi&quot;</strong> atau <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.
            </Step>
            <Step num="4" color="#3ddc84">
              Klik <strong>&quot;Install&quot;</strong> — aplikasi akan muncul di layar utama HP Anda seperti aplikasi biasa!
            </Step>
          </div>
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              background: "rgba(61, 220, 132, 0.08)",
              borderRadius: "12px",
              fontSize: "0.8125rem",
              color: "var(--color-text-muted)",
            }}
          >
            💡 Setelah terinstall, aplikasi bisa digunakan <strong>offline</strong> (transaksi yang sudah tersimpan tetap bisa dilihat).
          </div>
        </div>

        {/* iOS Guide */}
        <div
          className="card"
          style={{
            padding: "1.75rem",
            border: "1px solid var(--color-border)",
          }}
        >
          <h4
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "1.1rem",
              fontWeight: 800,
              marginBottom: "1rem",
              color: "#007aff",
            }}
          >
            <SafariIcon /> iPhone / iPad — Safari
          </h4>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "var(--color-text)",
            }}
          >
            <Step num="1" color="#007aff">
              Buka aplikasi <strong>Safari</strong> di iPhone/iPad Anda dan kunjungi website Tyaaa Financee.
            </Step>
            <Step num="2" color="#007aff">
              Ketuk ikon <strong>Bagikan / Share</strong> <Share2 size={14} style={{ display: "inline", verticalAlign: "middle" }} /> di menu bawah Safari.
            </Step>
            <Step num="3" color="#007aff">
              Gulir ke bawah dan pilih <strong>&quot;Tambahkan ke Layar Utama&quot;</strong> (Add to Home Screen).
            </Step>
            <Step num="4" color="#007aff">
              Klik <strong>&quot;Tambah&quot;</strong> di pojok kanan atas — ikon aplikasi akan muncul di Home Screen!
            </Step>
          </div>
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              background: "rgba(0, 122, 255, 0.08)",
              borderRadius: "12px",
              fontSize: "0.8125rem",
              color: "var(--color-text-muted)",
            }}
          >
            💡 Pada iPhone, notifikasi dan badge icon akan aktif setelah aplikasi ditambahkan ke Home Screen.
          </div>
        </div>
      </div>

      {/* Features Comparison */}
      <div
        className="card"
        style={{
          padding: "1.75rem",
          border: "1px solid var(--color-border)",
          marginBottom: "2rem",
        }}
      >
        <h4
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            marginBottom: "1rem",
          }}
        >
          ✨ Kelebihan Aplikasi Terinstall
        </h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {[
            { icon: "🚀", title: "Loading Cepat", desc: "Cache lokal membuat aplikasi terasa lebih ringan" },
            { icon: "📱", title: "Fullscreen", desc: "Tanpa address bar browser, seperti aplikasi native" },
            { icon: "📶", title: "Offline Mode", desc: "Data tersimpan bisa diakses tanpa internet" },
            { icon: "🔔", title: "Auto Update", desc: "Versi terbaru selalu tersedia tanpa install ulang" },
          ].map((feat) => (
            <div
              key={feat.title}
              style={{
                padding: "1rem",
                background: "var(--color-surface-offset)",
                borderRadius: "12px",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{feat.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                {feat.title}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                {feat.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div
        style={{
          padding: "1rem",
          background: "rgba(255, 193, 7, 0.08)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 193, 7, 0.3)",
          fontSize: "0.8125rem",
          lineHeight: 1.5,
          color: "var(--color-text-muted)",
        }}
      >
        <strong>📌 Catatan:</strong> Aplikasi ini adalah <strong>Progressive Web App (PWA)</strong> — teknologi web modern 
        yang memiliki kemampuan setara aplikasi native. Ukurannya sangat ringan (&lt; 1 MB), tidak memakan 
        penyimpanan, dan bisa dihapus kapan saja seperti aplikasi biasa.
      </div>
    </div>
  );
}

function Step({ num, color, children }: { num: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: color,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.75rem",
          fontWeight: 800,
          flexShrink: 0,
          marginTop: "2px",
        }}
      >
        {num}
      </div>
      <span>{children}</span>
    </div>
  );
}
