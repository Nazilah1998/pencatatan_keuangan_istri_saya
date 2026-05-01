"use client";
import React, { useRef } from "react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  error,
  required,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    inputRef.current?.showPicker();
  };

  const displayDate = value
    ? format(parseISO(value), "EEEE, d MMMM yyyy", { locale: id })
    : "Pilih tanggal...";

  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}{" "}
          {required && <span style={{ color: "var(--color-danger)" }}>*</span>}
        </label>
      )}
      <div
        onClick={handleContainerClick}
        className={cn(
          "input",
          error && "input-error",
          "flex items-center justify-between cursor-pointer group transition-all duration-300",
        )}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
          minHeight: "3.5rem",
          background: "var(--color-surface)",
          border: "2px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "var(--radius-md)",
              background: "var(--color-primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary)",
            }}
          >
            <CalendarIcon size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: value ? "var(--color-text)" : "var(--color-text-muted)",
              }}
            >
              {displayDate}
            </span>
            {value && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                }}
              >
                Ketuk untuk ubah tanggal
              </span>
            )}
          </div>
        </div>
        <ChevronRight
          size={18}
          className="text-muted group-hover:translate-x-1 transition-transform"
          style={{ color: "var(--color-text-muted)" }}
        />

        {/* Hidden but functional input */}
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: "absolute",
            opacity: 0,
            width: 0,
            height: 0,
            pointerEvents: "none",
          }}
        />
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};
