"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { id as idLocale, enUS as enLocale } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() =>
    value ? parseISO(value) : new Date(),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

  const dateLocale = currentLang === "id" ? idLocale : enLocale;

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

  const dayHeaders = useMemo(() => {
    const indices = [1, 2, 3, 4, 5, 6, 0] as const;
    return indices.map((i) =>
      dateLocale.localize?.day(i, { width: "abbreviated" }),
    );
  }, [dateLocale]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [viewDate]);

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  const handleDayClick = (day: Date) => {
    onChange(format(day, "yyyy-MM-dd"));
    setIsOpen(false);
  };

  const displayDate = value
    ? format(parseISO(value), "EEEE, d MMMM yyyy", { locale: dateLocale })
    : t("transactions.form.date_instruction");

  const parsedValue = value ? parseISO(value) : null;

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
                marginBottom: "0.5rem",
              }}
            >
              <button
                type="button"
                onClick={() => setViewDate((prev) => subMonths(prev, 1))}
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
                {format(viewDate, "MMMM yyyy", { locale: dateLocale })}
              </span>
              <button
                type="button"
                onClick={() => setViewDate((prev) => addMonths(prev, 1))}
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
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "0.125rem",
                marginBottom: "0.25rem",
              }}
            >
              {dayHeaders.map((name) => (
                <div
                  key={name}
                  style={{
                    textAlign: "center",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--color-text-muted)",
                    padding: "0.375rem 0",
                  }}
                >
                  {name}
                </div>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div
                key={wi}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "0.25rem",
                }}
              >
                {week.map((day) => {
                  const selected = parsedValue && isSameDay(day, parsedValue);
                  const currentMonth = isSameMonth(day, viewDate);
                  const today = isToday(day);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      style={{
                        textAlign: "center",
                        padding: "0.375rem 0",
                        borderRadius: "var(--radius-md)",
                        border: today && !selected ? "1.5px solid var(--color-primary)" : "none",
                        background: selected
                          ? "var(--color-primary)"
                          : today
                            ? "var(--color-primary-highlight)"
                            : "transparent",
                        color: !currentMonth
                          ? "var(--color-text-faint)"
                          : selected
                            ? "#fff"
                            : today
                              ? "var(--color-primary)"
                              : "var(--color-text)",
                        fontWeight: selected || today ? 700 : 500,
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
                          e.currentTarget.style.background = today
                            ? "var(--color-primary-highlight)"
                            : "transparent";
                        }
                      }}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {error && <span className="form-error">{error}</span>}
    </div>
  );
};
