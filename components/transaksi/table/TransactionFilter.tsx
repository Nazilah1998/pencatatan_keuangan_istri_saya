"use client";
import React from "react";
import { Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";


interface TransactionFilterProps {

  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedMonth: number;
  setSelectedMonth: (val: number) => void;
  selectedYear: number;
  setSelectedYear: (val: number) => void;
  typeFilter: "all" | "pemasukan" | "pengeluaran";
  setTypeFilter: (val: "all" | "pemasukan" | "pengeluaran") => void;
}

const MONTHS_KEYS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec"
];


export function TransactionFilter({
  searchTerm,
  setSearchTerm,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  typeFilter,
  setTypeFilter,
}: TransactionFilterProps) {
  const { t } = useTranslation();
  const now = new Date();
  
  const months = MONTHS_KEYS.map(key => t(`common.months.${key}`));


  
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        background: "var(--color-surface)",
        padding: "1.25rem",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.875rem",
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            className="input"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
              padding: "0.625rem 1rem",
            }}
            onClick={() => {
              const el = document.getElementById("month-dropdown");
              if (el) el.style.display = el.style.display === "none" ? "block" : "none";
              const yr = document.getElementById("year-dropdown");
              if (yr) yr.style.display = "none";
            }}
          >
            {months[selectedMonth]}
            <span style={{ fontSize: "0.6rem", opacity: 0.5 }}>▼</span>
          </div>
          <div
            id="month-dropdown"
            className="card"
            style={{
              display: "none",
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              left: 0,
              right: 0,
              zIndex: 100,
              maxHeight: "240px",
              overflowY: "auto",
              padding: "0.5rem",
              boxShadow: "var(--shadow-xl)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            {months.map((m, i) => (
              <div
                key={m}
                onClick={() => {
                  setSelectedMonth(i);
                  document.getElementById("month-dropdown")!.style.display = "none";
                }}
                style={{
                  padding: "0.625rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.8125rem",
                  fontWeight: selectedMonth === i ? 700 : 500,
                  color: selectedMonth === i ? "var(--color-primary)" : "var(--color-text)",
                  background: selectedMonth === i ? "var(--color-primary-bg)" : "transparent",
                  cursor: "pointer",
                }}
              >
                {m}
              </div>
            ))}

          </div>
        </div>

        <div style={{ position: "relative" }}>
          <div
            className="input"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
              padding: "0.625rem 1rem",
            }}
            onClick={() => {
              const el = document.getElementById("year-dropdown");
              if (el) el.style.display = el.style.display === "none" ? "block" : "none";
              const mo = document.getElementById("month-dropdown");
              if (mo) mo.style.display = "none";
            }}
          >
            {selectedYear}
            <span style={{ fontSize: "0.6rem", opacity: 0.5 }}>▼</span>
          </div>
          <div
            id="year-dropdown"
            className="card"
            style={{
              display: "none",
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              left: 0,
              right: 0,
              zIndex: 100,
              padding: "0.5rem",
              boxShadow: "var(--shadow-xl)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
              <div
                key={y}
                onClick={() => {
                  setSelectedYear(y);
                  document.getElementById("year-dropdown")!.style.display = "none";
                }}
                style={{
                  padding: "0.625rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.8125rem",
                  fontWeight: selectedYear === y ? 700 : 500,
                  color: selectedYear === y ? "var(--color-primary)" : "var(--color-text)",
                  background: selectedYear === y ? "var(--color-primary-bg)" : "transparent",
                  cursor: "pointer",
                }}
              >
                {y}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <Search
          size={18}
          style={{
            position: "absolute",
            left: "1rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-text-faint)",
          }}
        />
        <input
          type="text"
          placeholder={t("common.search")}
          value={searchTerm}

          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "0.75rem 1rem 0.75rem 2.75rem",
            background: "var(--color-surface-offset)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            fontSize: "0.875rem",
            outline: "none",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          background: "var(--color-surface-offset)",
          padding: "0.25rem",
          borderRadius: "var(--radius-lg)",
          gap: "0.25rem",
        }}
      >
        {(["all", "pemasukan", "pengeluaran"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              background: typeFilter === type ? "var(--color-surface)" : "transparent",
              color: typeFilter === type
                ? type === "all" ? "var(--color-primary)" : type === "pemasukan" ? "var(--color-income)" : "var(--color-expense)"
                : "var(--color-text-muted)",
              boxShadow: typeFilter === type ? "var(--shadow-sm)" : "none",
              transition: "all 0.2s ease",
              textTransform: "capitalize",
            }}
          >
            {type === "all" ? t("transactions.filter_all") : type === "pemasukan" ? t("common.income") : t("common.expense")}
          </button>
        ))}

      </div>
    </div>
  );
}
