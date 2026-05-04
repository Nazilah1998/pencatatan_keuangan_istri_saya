"use client";
import React, { useState } from "react";
import { PenLine } from "lucide-react";
import { TransactionForm } from "@/components/transaksi/TransactionForm";
import { Modal } from "@/components/ui/Modal";

import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";

export function FAB() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();
  const router = useRouter();

  const isSettingsPage = pathname?.startsWith("/pengaturan");
  const isCustomizationPage =
    pathname?.includes("/dompet") || pathname?.includes("/kategori");

  if (isSettingsPage && !isCustomizationPage) return null;

  const handleOpen = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Silakan login untuk menambah transaksi");
      router.push("/login");
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      <button
        className="fab"
        onClick={handleOpen}
        aria-label="Tambah transaksi cepat"
        id="fab-add-transaction"
        style={{
          transform: isOpen ? "scale(0.9)" : "scale(1)",
          transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
            transition:
              "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PenLine size={24} strokeWidth={2.5} />
        </div>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Tambah Transaksi"
      >
        <TransactionForm onSuccess={() => setIsOpen(false)} />
      </Modal>
    </>
  );
}
