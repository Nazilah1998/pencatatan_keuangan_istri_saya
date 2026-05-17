"use client";
import React, { useEffect, useRef, useState } from "react";
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
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);

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

  // Touch handlers for drag-to-dismiss bottom sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // Allow dragging from header area or specific handle
    if (target.closest(".modal-header") || target.closest(".drag-handle")) {
      setIsDragging(true);
      startYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    // Only allow dragging down
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 100) {
      // Satisfying micro-vibration if supported
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10);
      }
      onClose();
    }
    setDragOffset(0);
  };

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="modal-panel"
        style={{
          maxWidth,
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile Drag Handle */}
        <div className="drag-handle-container">
          <div className="drag-handle" />
        </div>

        {/* Header */}
        <div
          className="modal-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--color-divider)",
            cursor: "grab",
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
          .drag-handle-container {
            display: none;
            justify-content: center;
            align-items: center;
            padding: 0.75rem 0 0.25rem;
            cursor: grab;
          }
          .drag-handle {
            width: 36px;
            height: 4px;
            border-radius: 99px;
            background: var(--color-border);
          }
          .modal-body {
            padding: 1.5rem;
          }
          @media (max-width: 640px) {
            .drag-handle-container {
              display: flex;
            }
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
