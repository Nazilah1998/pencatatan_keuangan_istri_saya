"use client";
import React from "react";
import { ArrowUpDown, ChevronDown, Check } from "lucide-react";

interface SortDropdownProps {
  sortBy: "highest" | "lowest" | "newest";
  setSortBy: (val: "highest" | "lowest" | "newest") => void;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export function SortDropdown({
  sortBy,
  setSortBy,
  isOpen,
  setIsOpen,
}: SortDropdownProps) {
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 0.75rem",
          borderRadius: "12px",
          background: "var(--color-surface-offset)",
          border: "1px solid var(--color-border)",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--color-text-muted)",
          cursor: "pointer",
          transition: "all var(--transition)",
        }}
      >
        <ArrowUpDown size={14} />
        <span style={{ color: "var(--color-text)", fontWeight: 700 }}>
          {sortBy === "newest" && "Terbaru"}
          {sortBy === "highest" && "Tertinggi"}
          {sortBy === "lowest" && "Terendah"}
        </span>
        <ChevronDown
          size={14}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
        />
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
            }}
          />
          <div
            className="card"
            style={{
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              right: 0,
              minWidth: "180px",
              zIndex: 101,
              padding: "0.5rem",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              background: "var(--color-surface)",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            {[
              { value: "newest", label: "Terbaru", icon: "✨" },
              { value: "highest", label: "Nominal Tertinggi", icon: "📈" },
              { value: "lowest", label: "Nominal Terendah", icon: "📉" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSortBy(option.value as "highest" | "lowest" | "newest");
                  setIsOpen(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 0.875rem",
                  borderRadius: "10px",
                  background: sortBy === option.value ? "var(--color-primary-highlight)" : "transparent",
                  border: "none",
                  color: sortBy === option.value ? "var(--color-primary)" : "var(--color-text)",
                  fontSize: "0.8125rem",
                  fontWeight: sortBy === option.value ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <span style={{ fontSize: "1rem" }}>{option.icon}</span>
                  {option.label}
                </div>
                {sortBy === option.value && <Check size={14} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
