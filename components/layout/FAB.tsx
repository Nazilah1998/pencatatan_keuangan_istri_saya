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
      >
        <Plus size={24} strokeWidth={2.5} />
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
