"use client";

import React, { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { ChevronLeft, Users, Copy, LogOut, Link2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { joinFamily, leaveFamily } from "@/app/actions/family";
import { useRouter } from "next/navigation";

interface FamilyClientProps {
  familyCode: string;
  isOwner: boolean;
  members: { id: string; fullName: string | null; email: string | null }[];
}

export function FamilyClient({ familyCode, isOwner, members }: FamilyClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(familyCode);
    toast.success("Kode keluarga berhasil disalin!");
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error("Masukkan kode undangan terlebih dahulu.");
      return;
    }
    
    setIsJoining(true);
    const res = await joinFamily(inviteCode.trim());
    setIsJoining(false);

    if (res.success) {
      toast.success("Berhasil bergabung dengan keluarga!");
      setInviteCode("");
      router.refresh();
      setTimeout(() => window.location.reload(), 1000); // Hard reload to clear Zustand cache
    } else {
      toast.error(res.error || "Gagal bergabung.");
    }
  };

  const handleLeave = async () => {
    if (!confirm("Apakah Anda yakin ingin keluar dari dompet keluarga ini? Data Anda akan terpisah kembali.")) return;
    
    setIsLeaving(true);
    const res = await leaveFamily();
    setIsLeaving(false);

    if (res.success) {
      toast.success("Berhasil keluar dari keluarga.");
      router.refresh();
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error(res.error || "Gagal keluar.");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: "2rem" }}>
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
              background: "rgba(99, 102, 241, 0.1)",
              color: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={20} />
          </div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            Dompet Keluarga
          </h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          Kelola dompet bersama pasangan atau keluarga Anda. Transaksi akan terhubung secara real-time.
        </p>
      </div>

      <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "1rem" }}>
          Anggota Keluarga ({members.length})
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {members.map((m, i) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem", background: "var(--color-surface-offset)", borderRadius: "10px" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {m.fullName?.charAt(0).toUpperCase() || m.email?.charAt(0).toUpperCase() || "?"}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)" }}>
                  {m.fullName || "Pengguna"} {i === 0 && isOwner ? "(Anda/Pemilik)" : ""}
                </p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{m.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isOwner ? (
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.5rem" }}>
            Undang Anggota
          </h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
            Bagikan kode ini kepada pasangan Anda untuk bergabung ke dalam dompet ini.
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1, padding: "0.75rem", background: "var(--color-surface-offset)", border: "1px dashed var(--color-border)", borderRadius: "8px", fontSize: "0.875rem", fontFamily: "var(--font-mono)", color: "var(--color-text)", display: "flex", alignItems: "center", overflowX: "auto" }}>
              {familyCode}
            </div>
            <Button onClick={handleCopyCode} style={{ padding: "0 1rem" }}>
              <Copy size={18} />
            </Button>
          </div>
        </div>
      ) : null}

      {isOwner ? (
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.5rem" }}>
            Gabung ke Keluarga Lain
          </h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
            Punya kode undangan dari pasangan? Masukkan di sini. <br/>
            <strong>Perhatian:</strong> Anda hanya akan melihat data dari dompet yang Anda ikuti.
          </p>
          <form onSubmit={handleJoin} style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
            <input
              type="text"
              placeholder="Paste kode undangan..."
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="form-input"
              required
            />
            <Button type="submit" disabled={isJoining} fullWidth style={{ marginTop: "0.5rem" }}>
              <Link2 size={18} style={{ marginRight: "0.5rem" }} />
              {isJoining ? "Bergabung..." : "Gabung Dompet"}
            </Button>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: "1.5rem", border: "1px solid var(--color-expense)" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-expense)", marginBottom: "0.5rem" }}>
            Keluar dari Keluarga
          </h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
            Anda saat ini bergabung dengan dompet orang lain. Keluar untuk kembali ke dompet pribadi Anda.
          </p>
          <Button onClick={handleLeave} disabled={isLeaving} fullWidth style={{ background: "var(--color-expense-bg)", color: "var(--color-expense)", border: "1px solid var(--color-expense)" }}>
            <LogOut size={18} style={{ marginRight: "0.5rem" }} />
            {isLeaving ? "Keluar..." : "Keluar dari Dompet Ini"}
          </Button>
        </div>
      )}
    </div>
  );
}
