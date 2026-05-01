"use client";
import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronDown,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getTransactions } from "@/app/actions/transactions";
import { Transaction } from "@/types";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { arrayToCSV, downloadCSV } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { format, addMonths, subMonths } from "date-fns";
import { id } from "date-fns/locale";

/** Animated number hook — smoothly counts from old → new value */
function useAnimatedValue(target: number, duration = 500) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    const to = target;
    if (from === to) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;

    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * ease));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}

/** Formats an animated integer the same way formatCurrency does */
function formatAnimated(value: number): string {
  return "Rp " + value.toLocaleString("id-ID");
}

export default function LaporanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const selectedMonth = format(currentDate, "yyyy-MM");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getTransactions();
      if (res.success && res.data) setTransactions(res.data);
      setLoading(false);
    }
    load();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((t) => cats.add(t.kategori));
    return ["Semua", ...Array.from(cats).sort()];
  }, [transactions]);

  const monthlyTx = useMemo(
    () =>
      transactions.filter((t) => {
        const matchMonth = t.tanggal.startsWith(selectedMonth);
        const matchCategory =
          selectedCategory === "Semua" || t.kategori === selectedCategory;
        return matchMonth && matchCategory;
      }),
    [transactions, selectedMonth, selectedCategory],
  );

  const income = useMemo(
    () =>
      monthlyTx
        .filter((t) => t.jenis === "pemasukan")
        .reduce((s, t) => s + t.jumlah, 0),
    [monthlyTx],
  );

  const expense = useMemo(
    () =>
      monthlyTx
        .filter((t) => t.jenis === "pengeluaran")
        .reduce((s, t) => s + t.jumlah, 0),
    [monthlyTx],
  );

  const surplus = income - expense;

  // Animated values
  const animIncome = useAnimatedValue(income);
  const animExpense = useAnimatedValue(expense);
  const animSurplus = useAnimatedValue(Math.abs(surplus));

  const handlePrevMonth = useCallback(
    () => setCurrentDate((d) => subMonths(d, 1)),
    [],
  );
  const handleNextMonth = useCallback(
    () => setCurrentDate((d) => addMonths(d, 1)),
    [],
  );

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Tanggal",
      "Jenis",
      "Jumlah",
      "Kategori",
      "Dompet",
      "Deskripsi",
    ];
    const rows = monthlyTx.map((t) => [
      t.id,
      t.tanggal,
      t.jenis,
      String(t.jumlah),
      t.kategori,
      t.dompet,
      t.deskripsi,
    ]);
    downloadCSV(arrayToCSV(headers, rows), `laporan-${selectedMonth}.csv`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(1, 105, 111);
    doc.text("Tyaaa Financee", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Laporan Keuangan Bulanan: ${selectedMonth}`, 14, 30);
    doc.setFontSize(10);
    doc.text(`Total Pemasukan: Rp ${income.toLocaleString()}`, 14, 40);
    doc.text(`Total Pengeluaran: Rp ${expense.toLocaleString()}`, 14, 45);
    doc.text(`Surplus/Defisit: Rp ${surplus.toLocaleString()}`, 14, 50);
    const tableData = monthlyTx.map((t, i) => [
      i + 1,
      t.tanggal,
      t.jenis === "pemasukan" ? "Masuk" : "Keluar",
      t.kategori,
      `Rp ${t.jumlah.toLocaleString()}`,
      t.deskripsi || "-",
    ]);
    autoTable(doc, {
      startY: 60,
      head: [["No", "Tanggal", "Jenis", "Kategori", "Jumlah", "Keterangan"]],
      body: tableData,
      headStyles: { fillColor: [1, 105, 111] },
      alternateRowStyles: { fillColor: [245, 247, 249] },
      margin: { top: 60 },
    });
    doc.save(`laporan-${selectedMonth}.pdf`);
    setShowExportMenu(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* ── Page Header ── */}
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

        {/* Export Button */}
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
              {/* Click-outside backdrop */}
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
                  boxShadow:
                    "0 20px 48px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)",
                  zIndex: 9999,
                  minWidth: "175px",
                  overflow: "hidden",
                }}
              >
                {[
                  {
                    label: "CSV Spreadsheet",
                    color: "#10b981",
                    action: handleExportCSV,
                  },
                  {
                    label: "Dokumen PDF",
                    color: "#ef4444",
                    action: handleExportPDF,
                  },
                ].map(({ label, color, action }) => (
                  <button
                    key={label}
                    onClick={action}
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
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--color-surface-offset)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <FileText size={17} color={color} /> {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modern Filter Section ── */}
      <div
        className="card"
        style={{
          padding: "1.25rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {/* Month Stepper */}
        <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
          <button
            onClick={handlePrevMonth}
            aria-label="Bulan sebelumnya"
            style={{
              width: 36,
              height: 36,
              borderRadius: "10px 0 0 10px",
              border: "1px solid var(--color-border)",
              borderRight: "none",
              background: "var(--color-surface-offset)",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--color-primary-highlight)";
              (e.currentTarget as HTMLElement).style.color =
                "var(--color-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--color-surface-offset)";
              (e.currentTarget as HTMLElement).style.color =
                "var(--color-text-muted)";
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <div
            style={{
              flex: 1,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "var(--color-text)",
              letterSpacing: "-0.01em",
              userSelect: "none",
            }}
          >
            {format(currentDate, "MMMM yyyy", { locale: id })}
          </div>

          <button
            onClick={handleNextMonth}
            aria-label="Bulan berikutnya"
            style={{
              width: 36,
              height: 36,
              borderRadius: "0 10px 10px 0",
              border: "1px solid var(--color-border)",
              borderLeft: "none",
              background: "var(--color-surface-offset)",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--color-primary-highlight)";
              (e.currentTarget as HTMLElement).style.color =
                "var(--color-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--color-surface-offset)";
              (e.currentTarget as HTMLElement).style.color =
                "var(--color-text-muted)";
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Category Pill Chips */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "0.375rem 0.875rem",
                  borderRadius: "999px",
                  border: active
                    ? "1.5px solid var(--color-primary)"
                    : "1.5px solid var(--color-border)",
                  background: active
                    ? "var(--color-primary-highlight)"
                    : "var(--color-surface)",
                  color: active
                    ? "var(--color-primary)"
                    : "var(--color-text-muted)",
                  fontSize: "0.8125rem",
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Summary Cards ── */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.25rem",
          }}
        >
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {/* Income */}
            <div
              className="card"
              style={{
                padding: "1.5rem",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Pemasukan
                  </p>
                  <h3
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 800,
                      color: "var(--color-income)",
                      fontFamily: "var(--font-mono)",
                      transition: "opacity 0.2s",
                    }}
                  >
                    {formatAnimated(animIncome)}
                  </h3>
                </div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    background: "var(--color-income-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-income)",
                  }}
                >
                  <TrendingUp size={22} />
                </div>
              </div>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-faint)",
                }}
              >
                Total transaksi masuk untuk filter ini
              </p>
            </div>

            {/* Expense */}
            <div
              className="card"
              style={{
                padding: "1.5rem",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Pengeluaran
                  </p>
                  <h3
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 800,
                      color: "var(--color-expense)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {formatAnimated(animExpense)}
                  </h3>
                </div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    background: "var(--color-expense-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-expense)",
                  }}
                >
                  <TrendingDown size={22} />
                </div>
              </div>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-faint)",
                }}
              >
                Total transaksi keluar untuk filter ini
              </p>
            </div>

            {/* Surplus/Deficit */}
            <div
              className="card"
              style={{
                padding: "1.5rem",
                background:
                  surplus >= 0
                    ? "linear-gradient(135deg, var(--color-surface) 0%, var(--color-income-bg) 100%)"
                    : "linear-gradient(135deg, var(--color-surface) 0%, var(--color-danger-bg) 100%)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {surplus >= 0 ? "Selisih (Surplus)" : "Selisih (Defisit)"}
                  </p>
                  <h3
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 800,
                      color:
                        surplus >= 0
                          ? "var(--color-income)"
                          : "var(--color-danger)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {formatAnimated(animSurplus)}
                  </h3>
                </div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    background:
                      surplus >= 0
                        ? "var(--color-income)"
                        : "var(--color-danger)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <Wallet size={22} />
                </div>
              </div>
              <p
                style={{
                  fontSize: "0.75rem",
                  color:
                    surplus >= 0
                      ? "var(--color-income)"
                      : "var(--color-danger)",
                  fontWeight: 600,
                  opacity: 0.9,
                }}
              >
                {surplus >= 0 ? "Keuangan sehat! 🎉" : "Perlu penghematan"}
              </p>
            </div>
          </div>

          {/* Empty state */}
          {monthlyTx.length === 0 && (
            <div
              style={{
                padding: "3rem",
                textAlign: "center",
                color: "var(--color-text-muted)",
                background: "var(--color-surface)",
                borderRadius: "var(--radius-xl)",
                border: "1px dashed var(--color-border)",
              }}
            >
              <div style={{ marginBottom: "0.75rem" }}>
                <FileText size={40} opacity={0.2} />
              </div>
              <p style={{ fontWeight: 600 }}>
                Tidak ada data untuk periode atau kategori ini
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
