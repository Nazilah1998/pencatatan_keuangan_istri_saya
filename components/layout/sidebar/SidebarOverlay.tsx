"use client";
import React from "react";

interface SidebarOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SidebarOverlay({ isOpen, onClose }: SidebarOverlayProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "oklch(0.15 0.01 80 / 0.4)",
        backdropFilter: "blur(4px)",
        zIndex: 9990,
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? "visible" : "hidden",
        transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s",
        pointerEvents: isOpen ? "auto" : "none",
      }}
      className="sidebar-overlay"
    />
  );
}
