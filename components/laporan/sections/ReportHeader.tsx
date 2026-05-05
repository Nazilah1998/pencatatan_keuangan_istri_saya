"use client";
import React, { useState } from "react";
import { Download, ChevronDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReportHeaderProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export function ReportHeader({
  onExportCSV,
  onExportPDF,
}: ReportHeaderProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: "1rem",
        padding: "0.5rem 0",
        borderBottom: "1px solid var(--color-border-subtle)",
        marginBottom: "0.5rem",
        position: "relative",
        zIndex: 50,
      }}
    >
      <div>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "var(--color-text)",
            letterSpacing: "-0.025em",
            margin: 0,
          }}
        >
          Laporan Bulanan
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
            marginTop: "0.25rem",
          }}
        >
          Ringkasan arus kas dan kesehatan keuangan Anda
        </p>
      </div>

      <div style={{ position: "relative" }}>
        <Button
          variant="primary"
          onClick={() => setShowExportMenu(!showExportMenu)}
          size="sm"
          style={{
            gap: "0.375rem",
            borderRadius: "12px",
            padding: "0.5rem 1rem",
          }}
        >
          <Download size={16} />
          <span style={{ fontWeight: 700 }}>Export</span>
          <ChevronDown size={13} />
        </Button>

        {showExportMenu && (
          <>
            <div
              onClick={() => setShowExportMenu(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9998,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 0.5rem)",
                left: 0,
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-xl)",
                boxShadow: "0 20px 48px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)",
                zIndex: 9999,
                minWidth: "175px",
                overflow: "hidden",
              }}
            >
              {[
                { label: "CSV Spreadsheet", color: "#10b981", action: onExportCSV },
                { label: "Dokumen PDF", color: "#ef4444", action: onExportPDF },
              ].map(({ label, color, action }) => (
                <button
                  key={label}
                  onClick={() => { action(); setShowExportMenu(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    width: "100%",
                    padding: "0.875rem 1rem",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    color: "var(--color-text)",
                    textAlign: "left",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-offset)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <FileText size={17} color={color} /> {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
