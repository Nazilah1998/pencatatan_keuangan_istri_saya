import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1
        style={{
          fontSize: "4rem",
          fontWeight: 800,
          color: "var(--color-primary)",
          marginBottom: "1rem",
          lineHeight: 1,
        }}
      >
        404
      </h1>
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--color-text)",
          marginBottom: "0.5rem",
        }}
      >
        Halaman Tidak Ditemukan
      </h2>
      <p
        style={{
          color: "var(--color-text-muted)",
          marginBottom: "2rem",
          maxWidth: 400,
        }}
      >
        Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <Link href="/" style={{ textDecoration: "none" }}>
        <Button>Kembali ke Dashboard</Button>
      </Link>
    </div>
  );
}
