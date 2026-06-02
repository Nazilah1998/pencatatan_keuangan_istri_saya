"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { id as localeId, enUS as localeEn } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface MonthPickerProps {
  value: string;
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
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    if (value) {
      const [year] = value.split("-").map(Number);
      return year;
    }
    return new Date().getFullYear();
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

  const dateLocale = currentLang === "id" ? localeId : localeEn;

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPopupStyle({
          position: "fixed",
          top: rect.bottom + 8,
          left: Math.max(8, rect.left),
          width: Math.max(rect.width, 320),
          maxWidth: "calc(100vw - 16px)",
          zIndex: 9999,
        });
      }
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [isOpen]);

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

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      index: i,
      name: dateLocale.localize?.month(i as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11, { width: "abbreviated" }),
    }));
  }, [dateLocale]);

  const selectedMonthIndex = value ? parseInt(value.split("-")[1], 10) - 1 : -1;

  const handleMonthClick = (monthIndex: number) => {
    const monthStr = String(monthIndex + 1).padStart(2, "0");
    onChange(`${viewYear}-${monthStr}`);
    setIsOpen(false);
  };

  return (
    <div className="form-group" ref={containerRef} style={{ position: "relative" }}>
      {label && (
        <label className="form-label">
          {label}{" "}
          {required && <span style={{ color: "var(--color-danger)" }}>*</span>}
        </label>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn("input", error && "input-error")}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          cursor: "pointer",
          textAlign: "left",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "var(--radius-md)",
              background: "var(--color-primary-highlight)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary)",
              flexShrink: 0,
            }}
          >
            <CalendarIcon size={20} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: value ? "var(--color-text)" : "var(--color-text-muted)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
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
          style={{
            color: "var(--color-text-muted)",
            flexShrink: 0,
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 998,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            className="modal-panel"
            style={{
              ...popupStyle,
              padding: "1rem 1.25rem 0",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
              }}
            >
              <button
                type="button"
                onClick={() => setViewYear((prev) => prev - 1)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  padding: "0.375rem",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--color-text)",
                }}
              >
                {viewYear}
              </span>
              <button
                type="button"
                onClick={() => setViewYear((prev) => prev + 1)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  padding: "0.375rem",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.375rem",
              }}
            >
              {months.map((month) => {
                const selected = month.index === selectedMonthIndex;
                const isCurrentMonth =
                  month.index === new Date().getMonth() &&
                  viewYear === new Date().getFullYear();
                return (
                  <button
                    key={month.index}
                    type="button"
                    onClick={() => handleMonthClick(month.index)}
                    style={{
                      textAlign: "center",
                      padding: "0.625rem 0.5rem",
                      borderRadius: "var(--radius-md)",
                      border: isCurrentMonth && !selected
                        ? "1.5px solid var(--color-primary)"
                        : "none",
                      background: selected
                        ? "var(--color-primary)"
                        : isCurrentMonth
                          ? "var(--color-primary-highlight)"
                          : "transparent",
                      color: selected
                        ? "#fff"
                        : isCurrentMonth
                          ? "var(--color-primary)"
                          : "var(--color-text)",
                      fontWeight: selected || isCurrentMonth ? 700 : 500,
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) {
                        e.currentTarget.style.background = "var(--color-surface-offset)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) {
                        e.currentTarget.style.background = isCurrentMonth
                          ? "var(--color-primary-highlight)"
                          : "transparent";
                      }
                    }}
                  >
                    {month.name}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {error && <span className="form-error">{error}</span>}
    </div>
  );
};
