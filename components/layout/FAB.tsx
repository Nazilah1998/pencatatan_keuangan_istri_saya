"use client";
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { TransactionForm } from "@/components/transaksi/TransactionForm";
import { Modal } from "@/components/ui/Modal";

export function FAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="fab"
        onClick={() => setIsOpen(true)}
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
          <Plus size={24} strokeWidth={2.5} />
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
