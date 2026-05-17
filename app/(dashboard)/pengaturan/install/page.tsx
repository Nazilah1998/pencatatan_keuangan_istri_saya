"use client";
import React from "react";
import { Button } from "@/components/ui/Button";
import {
  Smartphone,
  Download,
  ChevronLeft,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

const AndroidIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
    <path d="M17.6 9.48l1.44-2.5a.48.48 0 0 0-.18-.65.48.48 0 0 0-.65.18l-1.47 2.54a10.02 10.02 0 0 0-9.48 0L5.79 6.51a.48.48 0 0 0-.65-.18.48.48 0 0 0-.18.65l1.44 2.5A9.97 9.97 0 0 0 2 17.5a.5.5 0 0 0 .5.5h19a.5.5 0 0 0 .5-.5c0-3.32-1.63-6.27-4.4-8.02zM7.5 14a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm9 0a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.05-1 .04-2.22.67-2.94 1.52-.63.73-1.18 1.87-1.03 2.98 1.11.09 2.23-.55 2.98-1.45z" />
  </svg>
);

export default function InstallPage() {
  const { t } = useTranslation();

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 1rem" }}>
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
            Download Aplikasi Mobile
          </h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          Unduh dan pasang berkas aplikasi native Sintya Finance langsung ke smartphone Anda
        </p>
      </div>

      {/* Grid Cards Container */}
      <div
        className="download-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {/* Android APK Card */}
        <div
          className="card"
          style={{
            padding: "2rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {/* Subtle top decorative border for Android */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(90deg, #3ddc84 0%, #00b0ff 100%)",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "20px",
                background: "rgba(61, 220, 132, 0.1)",
                color: "#3ddc84",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1.25rem",
              }}
            >
              <AndroidIcon />
            </div>

            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--color-text)" }}>
              Aplikasi Android
            </h3>
            
            <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "1.25rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
              <span className="badge" style={{ background: "rgba(61, 220, 132, 0.15)", color: "#2e7d32", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: 600 }}>
                Format: .APK
              </span>
              <span className="badge text-muted" style={{ background: "var(--color-surface-offset)", border: "1px solid var(--color-border)", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: 600 }}>
                v2.0 • 15 MB
              </span>
            </div>

            <p style={{ fontSize: "0.875rem", lineHeight: 1.5, color: "var(--color-text-muted)", marginBottom: "2rem" }}>
              Paket aplikasi resmi (APK) yang siap di-install langsung di semua smartphone Android tanpa lewat Google Play Store.
            </p>
          </div>

          <a
            href="/downloads/sintya-finance.apk"
            download="sintya-finance.apk"
            style={{ width: "100%", textDecoration: "none" }}
          >
            <Button variant="primary" fullWidth size="lg" style={{ height: "3.5rem", borderRadius: "16px", background: "linear-gradient(135deg, #3ddc84 0%, #00b0ff 100%)", border: "none", fontWeight: 700 }}>
              <Download size={18} style={{ marginRight: "0.5rem" }} />
              Unduh File APK
            </Button>
          </a>
        </div>

        {/* iOS IPA Card */}
        <div
          className="card"
          style={{
            padding: "2rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {/* Subtle top decorative border for iOS */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(90deg, #ff85a2 0%, #ec4899 100%)",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "20px",
                background: "rgba(255, 133, 162, 0.1)",
                color: "#ff85a2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1.25rem",
              }}
            >
              <AppleIcon />
            </div>

            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--color-text)" }}>
              Aplikasi Apple iOS
            </h3>
            
            <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "1.25rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
              <span className="badge" style={{ background: "rgba(255, 133, 162, 0.15)", color: "#d81b60", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: 600 }}>
                Format: .IPA
              </span>
              <span className="badge text-muted" style={{ background: "var(--color-surface-offset)", border: "1px solid var(--color-border)", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: 600 }}>
                v2.0 • 18 MB
              </span>
            </div>

            <p style={{ fontSize: "0.875rem", lineHeight: 1.5, color: "var(--color-text-muted)", marginBottom: "2rem" }}>
              Paket instalasi resmi (IPA) untuk dipasang di iPhone atau iPad Anda menggunakan tools sideloading.
            </p>
          </div>

          <a
            href="/downloads/sintya-finance.ipa"
            download="sintya-finance.ipa"
            style={{ width: "100%", textDecoration: "none" }}
          >
            <Button variant="primary" fullWidth size="lg" style={{ height: "3.5rem", borderRadius: "16px", background: "linear-gradient(135deg, #ff85a2 0%, #ec4899 100%)", border: "none", fontWeight: 700 }}>
              <Download size={18} style={{ marginRight: "0.5rem" }} />
              Unduh File IPA
            </Button>
          </a>
        </div>
      </div>

      {/* Installation Guide Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "3rem" }}>
        
        {/* Android Guide */}
        <div
          className="card"
          style={{
            padding: "1.75rem",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h4 style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem", color: "#3ddc84" }}>
            <AndroidIcon /> Panduan Instalasi Android (.apk)
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem", lineHeight: 1.6, color: "var(--color-text)" }}>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <span style={{ fontWeight: 700, color: "#3ddc84", minWidth: "20px" }}>1.</span>
              <span>Tekan tombol <strong>Unduh File APK</strong> di atas untuk mengunduh paket berkas aplikasi.</span>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <span style={{ fontWeight: 700, color: "#3ddc84", minWidth: "20px" }}>2.</span>
              <span>Buka berkas <code>.apk</code> yang baru diunduh melalui folder <em>Unduhan / Downloads</em> di HP Anda.</span>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <span style={{ fontWeight: 700, color: "#3ddc84", minWidth: "20px" }}>3.</span>
              <span>Jika HP Android memblokir, klik <strong>Setelan</strong> pada pop-up keamanan dan centang/aktifkan opsi <strong>&quot;Izinkan instalasi dari sumber ini&quot;</strong> (Allow from this source).</span>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <span style={{ fontWeight: 700, color: "#3ddc84", minWidth: "20px" }}>4.</span>
              <span>Klik <strong>Instal</strong>, tunggu beberapa detik hingga selesai, dan buka aplikasi dari layar utama HP Anda!</span>
            </div>
          </div>
        </div>

        {/* iOS Guide */}
        <div
          className="card"
          style={{
            padding: "1.75rem",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h4 style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem", color: "#ff85a2" }}>
            <AppleIcon /> Panduan Instalasi Apple iOS (.ipa)
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.875rem", lineHeight: 1.6, color: "var(--color-text)" }}>
            <p style={{ margin: 0, fontWeight: 500 }}>
              iOS memiliki sistem keamanan tertutup, sehingga berkas <code>.ipa</code> harus dipasang menggunakan metode sideloading atau Xcode:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingLeft: "0.5rem" }}>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <span style={{ fontWeight: 700, color: "#ff85a2", minWidth: "20px" }}>A.</span>
                <span><strong>Metode Sideloading (Direkomendasikan)</strong>: Unduh berkas <code>.ipa</code> di atas, lalu gunakan aplikasi pembantu gratis di laptop seperti <strong>Sideloadly</strong> atau <strong>AltStore</strong> untuk memasang aplikasi langsung ke iPhone menggunakan Apple ID pribadi Anda.</span>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <span style={{ fontWeight: 700, color: "#ff85a2", minWidth: "20px" }}>B.</span>
                <span><strong>Metode Xcode Developer</strong>: Hubungkan iPhone Anda ke laptop Mac, jalankan perintah <code>npx cap open ios</code> untuk membuka proyek di <strong>Xcode</strong>, lalu kompilasi & jalankan langsung ke perangkat iPhone Anda.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Warning/Info Box */}
        <div
          style={{
            padding: "1.25rem",
            background: "rgba(255, 193, 7, 0.08)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid rgba(255, 193, 7, 0.3)",
            display: "flex",
            gap: "1rem",
            alignItems: "flex-start",
          }}
        >
          <Info
            size={20}
            style={{ color: "#FFC107", flexShrink: 0, marginTop: "2px" }}
          />
          <div style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}>
            <strong>💡 Informasi Penting Pengguna Jaringan Lokal:</strong>
            <p style={{ margin: "0.25rem 0 0" }}>
              Kedua aplikasi native di atas dikonfigurasi menggunakan <strong>Live URL Wrapper</strong> yang mengarah langsung ke server lokal laptop Anda (<code>http://192.168.100.9:3000</code>). Pastikan HP Anda selalu tersambung ke **Wi-Fi yang sama** dengan laptop Anda agar aplikasi native ini dapat dimuat dengan sempurna!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
