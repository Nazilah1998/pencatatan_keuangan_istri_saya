"use client";
import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  footer?: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  footer,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidth = { sm: "400px", md: "560px", lg: "720px" }[size];

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-panel" style={{ maxWidth }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--color-divider)",
          }}
        >
          <h2
            id="modal-title"
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "var(--color-text)",
            }}
          >
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Tutup modal"
            style={{
              minWidth: 36,
              height: 36,
              borderRadius: "var(--radius-md)",
            }}
          >
            <X size={18} />
          </Button>
        </div>

        {/* Body */}
        <div className="modal-body">{children}</div>

        <style jsx>{`
          .modal-body {
            padding: 1.5rem;
          }
          @media (max-width: 640px) {
            .modal-body {
              padding: 1.25rem 1rem;
            }
          }
        `}</style>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid var(--color-divider)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
