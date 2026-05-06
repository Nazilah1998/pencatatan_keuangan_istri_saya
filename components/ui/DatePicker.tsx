"use client";
import React, { useRef } from "react";
import { format, parseISO } from "date-fns";
import { id as idLocale, enUS as enLocale } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

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
  const { t, currentLang } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    // Attempt to focus and show picker for browsers that support it
    inputRef.current?.focus();
    if (inputRef.current?.showPicker) {
      try {
        inputRef.current.showPicker();
      } catch (e) {
        console.error("showPicker failed", e);
      }
    }
  };

  const dateLocale = currentLang === "id" ? idLocale : enLocale;

  const displayDate = value
    ? format(parseISO(value), "EEEE, d MMMM yyyy", { locale: dateLocale })
    : t("transactions.form.date_instruction");

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
                {t("transactions.form.date_instruction")}
              </span>
            )}
          </div>
        </div>
        <ChevronRight
          size={18}
          className="text-muted group-hover:translate-x-1 transition-transform"
          style={{ color: "var(--color-text-muted)" }}
        />

        {/* 
            Hidden but functional input. 
            We make it cover the entire container with opacity 0
            so that a direct tap on the container triggers the native iOS picker.
        */}
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0,
            width: "100%",
            height: "100%",
            cursor: "pointer",
            appearance: "none",
          }}
        />
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};
