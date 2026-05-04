import Link from "next/link";

export default function AuthCodeError() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        textAlign: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h1 style={{ color: "#ff6b81", marginBottom: "1rem" }}>
        Ups! Terjadi Kesalahan Autentikasi
      </h1>
      <p style={{ color: "#666", maxWidth: "400px", lineHeight: "1.6" }}>
        Gagal menukarkan kode akses dari Google. Ini biasanya terjadi jika
        konfigurasi Client ID atau Secret di Supabase tidak cocok dengan yang
        ada di Google Cloud Console.
      </p>
      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        <Link
          href="/login"
          style={{
            padding: "12px 24px",
            backgroundColor: "#ff6b81",
            color: "white",
            borderRadius: "12px",
            textDecoration: "none",
            fontWeight: "600",
          }}
        >
          Coba Login Lagi
        </Link>
      </div>
    </div>
  );
}
