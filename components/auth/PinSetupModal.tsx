"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import toast from "react-hot-toast";

interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PinSetupModal({ isOpen, onClose }: PinSetupModalProps) {
  const { pinCode, setPinCode } = useAppStore();
  const [pin, setPin] = useState("");

  const handleSave = () => {
    if (pin && pin.length !== 4) {
      toast.error("PIN harus 4 angka!");
      return;
    }
    setPinCode(pin || null);
    toast.success(pin ? "PIN berhasil disimpan!" : "PIN berhasil dihapus!");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pengaturan PIN Keamanan">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          {pinCode 
            ? "Aplikasi saat ini dilindungi oleh PIN. Anda bisa mengubah atau menghapusnya (kosongkan kolom)." 
            : "Tambahkan PIN 4 angka untuk mengunci aplikasi saat dibuka kembali."}
        </p>
        
        <input
          type="password"
          maxLength={4}
          placeholder="Masukkan 4 angka"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
          style={{
            padding: "0.75rem",
            borderRadius: "8px",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            color: "var(--color-text)",
            fontSize: "1.25rem",
            textAlign: "center",
            letterSpacing: "0.25rem",
          }}
        />

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>
            Batal
          </Button>
          <Button onClick={handleSave} style={{ flex: 1 }}>
            Simpan PIN
          </Button>
        </div>
      </div>
    </Modal>
  );
}
