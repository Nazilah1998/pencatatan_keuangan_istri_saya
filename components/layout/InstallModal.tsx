"use client";
import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Smartphone, Zap, Layout, Share } from "lucide-react";
import Image from "next/image";

interface InstallModalProps {
  isOpen: boolean;
  isIOS?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function InstallModal({
  isOpen,
  isIOS = false,
  onClose,
  onConfirm,
}: InstallModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pasang Aplikasi">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
          padding: "0.5rem 0",
        }}
      >
        {/* App Icon Preview */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "24px",
              overflow: "hidden",
              boxShadow: "0 10px 25px -5px rgba(244, 114, 182, 0.4)",
              border: "4px solid white",
            }}
          >
            <Image
              src="/icons/icon-512.png"
              alt="App Icon"
              width={100}
              height={100}
              style={{ objectFit: "cover" }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: -5,
              right: -5,
              background: "#10b981",
              color: "white",
              width: 28,
              height: 28,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3px solid white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Zap size={14} fill="currentColor" />
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "var(--color-text)",
              marginBottom: "0.5rem",
            }}
          >
            Tyaaa Financee
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
              maxWidth: "260px",
              margin: "0 auto",
            }}
          >
            Nikmati pengalaman mencatat keuangan yang lebih nyaman dan cepat di
            HP Anda.
          </p>
        </div>

        {/* Benefits or Instructions List */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "0.875rem",
          }}
        >
          {isIOS ? (
            <>
              <BenefitItem
                icon={<Share size={18} />}
                title="1. Ketuk Tombol Share"
                desc="Cari ikon Share (Bagikan) di bagian bawah browser Safari Anda."
              />
              <BenefitItem
                icon={<Smartphone size={18} />}
                title="2. Tambah ke Layar Utama"
                desc="Gulir ke bawah dan pilih opsi 'Add to Home Screen'."
              />
            </>
          ) : (
            <>
              <BenefitItem
                icon={<Smartphone size={18} />}
                title="Akses Cepat"
                desc="Langsung buka dari layar utama HP"
              />
              <BenefitItem
                icon={<Layout size={18} />}
                title="Layar Penuh"
                desc="Tampilan bersih tanpa bar browser"
              />
            </>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            width: "100%",
            marginTop: "0.5rem",
          }}
        >
          <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            {isIOS ? "Tutup" : "Nanti Saja"}
          </Button>
          {!isIOS && (
            <Button
              onClick={onConfirm}
              style={{ flex: 1, background: "var(--color-primary)" }}
            >
              Pasang Sekarang
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function BenefitItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "0.75rem 1rem",
        background: "var(--color-surface-offset)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div style={{ color: "var(--color-primary)" }}>{icon}</div>
      <div style={{ textAlign: "left" }}>
        <div
          style={{
            fontSize: "0.875rem",
            fontWeight: 700,
            color: "var(--color-text)",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          {desc}
        </div>
      </div>
    </div>
  );
}
