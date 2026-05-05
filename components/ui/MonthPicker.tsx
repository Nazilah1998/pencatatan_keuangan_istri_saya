"use client";
import React, { useRef } from "react";
import { format } from "date-fns";
import { id as localeId, enUS as localeEn } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface MonthPickerProps {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({
  value,
  onChange,
  label,
  error,
  required,
}) => {
  const { t, currentLang } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    inputRef.current?.showPicker();
  };

  const dateLocale = currentLang === "id" ? localeId : localeEn;

  // Convert YYYY-MM to a readable label
  const getDisplayLabel = () => {
    if (!value) return t("budget.form.period_label") + "...";
    try {
      const [year, month] = value.split("-");
      const date = new Date(Number(year), Number(month) - 1);
      return format(date, "MMMM yyyy", { locale: dateLocale });
    } catch {
      return value;
    }
  };

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
              {getDisplayLabel()}
            </span>
            {value && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                }}
              >
                {t("budget.form.period_instruction")}
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
          type="month"
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
