"use client";
import React, { useState, useMemo } from "react";
import { FileText } from "lucide-react";
import { Transaction } from "@/types";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { arrayToCSV, downloadCSV, formatCurrency, getConvertedAmount } from "@/lib/utils";
import { format, addMonths, subMonths } from "date-fns";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAppStore } from "@/store/useAppStore";

// Sub-components
import { ReportHeader } from "@/components/laporan/sections/ReportHeader";
import { ReportFilter } from "@/components/laporan/sections/ReportFilter";
import { SummaryCards } from "@/components/laporan/sections/SummaryCards";
import { LaporanPieChart, LaporanBarChart, CategoryProgressGrid } from "@/components/laporan/sections/LaporanCharts";
import { LaporanTransactionList } from "@/components/laporan/sections/LaporanTransactionList";
import { PieChart as ChartIcon, List as ListIcon } from "lucide-react";

interface LaporanClientProps {
  initialTransactions: Transaction[];
}

export function LaporanClient({ initialTransactions }: LaporanClientProps) {
  const { t, currentLang } = useTranslation();
  const { settings } = useAppStore();
  const [transactions] = useState<Transaction[]>(initialTransactions);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"visual" | "transaksi">("visual");
  const ALL_FILTER = "__ALL__";
  const [selectedCategory, setSelectedCategory] = useState(ALL_FILTER);

  const selectedMonth = format(currentDate, "yyyy-MM");

  const categories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((tx) => cats.add(tx.kategori));
    return [ALL_FILTER, ...Array.from(cats).sort()];
  }, [transactions, ALL_FILTER]);

  const monthlyTx = useMemo(
    () =>
      transactions.filter((tx) => {
        const matchMonth = tx.tanggal.startsWith(selectedMonth);
        const matchCategory =
          selectedCategory === ALL_FILTER || tx.kategori === selectedCategory;
        return matchMonth && matchCategory;
      }),
    [transactions, selectedMonth, selectedCategory, ALL_FILTER],
  );

  const income = useMemo(
    () =>
      monthlyTx
        .filter((tx) => tx.jenis === "pemasukan")
        .reduce((s, tx) => s + tx.jumlah, 0),
    [monthlyTx],
  );
  const expense = useMemo(
    () =>
      monthlyTx
        .filter((tx) => tx.jenis === "pengeluaran")
        .reduce((s, tx) => s + tx.jumlah, 0),
    [monthlyTx],
  );
  const surplus = income - expense;

  const handlePrevMonth = () => setCurrentDate((d) => subMonths(d, 1));
  const handleNextMonth = () => setCurrentDate((d) => addMonths(d, 1));

  const handleExportCSV = () => {
    const currencyCode = settings?.mata_uang || "IDR";
    const convertedIncome = getConvertedAmount(income, currencyCode);
    const convertedExpense = getConvertedAmount(expense, currencyCode);
    const convertedSurplus = getConvertedAmount(surplus, currencyCode);

    const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const intlLocale = currentLang === "id" ? "id-ID" : "en-US";
    const formattedMonth = new Intl.DateTimeFormat(intlLocale, { 
      month: "long", 
      year: "numeric" 
    }).format(currentDate);

    // Build Excel-compatible metadata lines
    const summaryBlock = [
      [escape("SINTYA FINANCE - LAPORAN KEUANGAN BULANAN"), ""],
      [escape(`Periode: ${formattedMonth}`), ""],
      [escape(`Mata Uang: ${currencyCode}`), ""],
      ["", ""],
      [escape("RINGKASAN KEUANGAN BULAN INI"), ""],
      [escape(t("common.income")), `${convertedIncome}`],
      [escape(t("common.expense")), `${convertedExpense}`],
      [escape(t("reports.surplus_label")), `${convertedSurplus}`],
      ["", ""],
      [escape("DAFTAR TRANSAKSI SELENGKAPNYA"), ""],
    ].map(row => row.join(",")).join("\n");

    const headers = [
      "No",
      t("transactions.date"),
      t("transactions.type"),
      t("transactions.category"),
      t("transactions.amount"),
      t("transactions.wallet"),
      t("transactions.description"),
    ];
    
    const rows = monthlyTx.map((tx, idx) => [
      String(idx + 1),
      tx.tanggal,
      tx.jenis === "pemasukan" ? t("common.income") : t("common.expense"),
      tx.kategori,
      String(getConvertedAmount(tx.jumlah, currencyCode)),
      tx.dompet,
      tx.deskripsi || "",
    ]);

    const tableCSV = arrayToCSV(headers, rows);
    const fullCSV = summaryBlock + "\n" + tableCSV;

    downloadCSV(fullCSV, `report-${selectedMonth}-${currencyCode}.csv`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const formatVal = (amt: number) => formatCurrency(amt, currentLang);
    const intlLocale = currentLang === "id" ? "id-ID" : "en-US";

    // 1. Top Green Accent Border
    doc.setFillColor(16, 185, 129); // Emerald primary
    doc.rect(0, 0, 210, 4, "F");

    // 2. Branding Header Box
    doc.setFillColor(240, 253, 250); // Soft teal background
    doc.roundedRect(14, 12, 12, 12, 3, 3, "F");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(13, 148, 136); // Emerald text icon
    doc.text("S", 18, 21);

    // 3. Title text
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // Slate 800
    doc.text("SINTYA FINANCE", 30, 21);

    // 4. Subtitle
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text("Laporan Keuangan Bulanan Keluarga", 30, 26);

    // 5. Metadata Block (Top Right)
    const formattedMonthName = new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" }).format(currentDate);
    const formattedPrintDate = new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "short", year: "numeric" }).format(new Date());
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Periode : ${formattedMonthName}`, 140, 21);
    doc.text(`Dicetak : ${formattedPrintDate}`, 140, 26);

    // 6. Horizontal Separator line
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);

    // 7. Colored Summary Cards (Y-start = 38)
    // Card 1: Total Pemasukan
    doc.setFillColor(240, 253, 250); // Light teal/green
    doc.roundedRect(14, 38, 58, 24, 3, 3, "F");
    doc.setFillColor(16, 185, 129); // Emerald border accent
    doc.rect(14, 38, 2, 24, "F");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(13, 148, 136);
    doc.text(t("common.income").toUpperCase(), 20, 45);
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(formatVal(income), 20, 53);

    // Card 2: Total Pengeluaran
    doc.setFillColor(254, 242, 242); // Light red
    doc.roundedRect(76, 38, 58, 24, 3, 3, "F");
    doc.setFillColor(239, 68, 68); // Red border accent
    doc.rect(76, 38, 2, 24, "F");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(220, 38, 38);
    doc.text(t("common.expense").toUpperCase(), 82, 45);
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(formatVal(expense), 82, 53);

    // Card 3: Surplus / Defisit
    const isSurplus = surplus >= 0;
    doc.setFillColor(isSurplus ? 245 : 255, isSurplus ? 243 : 251, isSurplus ? 255 : 235);
    doc.roundedRect(138, 38, 58, 24, 3, 3, "F");
    doc.setFillColor(isSurplus ? 124 : 245, isSurplus ? 58 : 158, isSurplus ? 237 : 11);
    doc.rect(138, 38, 2, 24, "F");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(isSurplus ? 109 : 180, isSurplus ? 40 : 83, isSurplus ? 217 : 9);
    doc.text(isSurplus ? `${t("reports.surplus_label").toUpperCase()} (SURPLUS)` : `${t("reports.surplus_label").toUpperCase()} (DEFISIT)`, 144, 45);
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(formatVal(Math.abs(surplus)), 144, 53);

    // 8. Transaction Title (Y-start = 72)
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text("RINCIAN ALUR TRANSAKSI", 14, 72);

    // 9. Structured Transactions Table
    const tableData = monthlyTx.map((tx, i) => [
      i + 1,
      tx.tanggal,
      tx.jenis === "pemasukan" ? t("common.income") : t("common.expense"),
      tx.kategori,
      formatVal(tx.jumlah),
      tx.deskripsi || "-",
    ]);
    
    autoTable(doc, {
      startY: 76,
      head: [
        [
          "No",
          t("transactions.date"),
          t("transactions.type"),
          t("transactions.category"),
          t("transactions.amount"),
          t("transactions.description"),
        ],
      ],
      body: tableData,
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      bodyStyles: { textColor: [51, 65, 85] },
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        1: { halign: "center", cellWidth: 26 },
        2: { halign: "center", cellWidth: 24 },
        3: { halign: "left", cellWidth: 32 },
        4: { halign: "right", fontStyle: "bold", cellWidth: 34 },
        5: { halign: "left" },
      },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8.5, cellPadding: 4.5 },
    });

    // 10. Dynamic Family Separator Footer on Every Page
    const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      // Line separator at Y = 280
      doc.setDrawColor(241, 245, 249); // Slate 100
      doc.setLineWidth(0.5);
      doc.line(14, 280, 196, 280);
      
      // Loving signature on the left
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text("Dicetak secara otomatis oleh Sintya Finance dengan ❤️ untuk Istri Tercinta", 14, 286);
      
      // Page number on the right
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Halaman ${i} dari ${pageCount}`, 196, 286, { align: "right" });
    }

    doc.save(`report-${selectedMonth}.pdf`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <ReportHeader
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
      />

      <ReportFilter
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <SummaryCards income={income} expense={expense} surplus={surplus} />

      {monthlyTx.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: "0.25rem" }}>
          <button
            onClick={() => setActiveTab("visual")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.625rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 700,
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "visual" ? "2px solid var(--color-primary)" : "2px solid transparent",
              color: activeTab === "visual" ? "var(--color-primary)" : "var(--color-text-muted)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <ChartIcon size={16} />
            Ringkasan Visual
          </button>
          <button
            onClick={() => setActiveTab("transaksi")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.625rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 700,
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "transaksi" ? "2px solid var(--color-primary)" : "2px solid transparent",
              color: activeTab === "transaksi" ? "var(--color-primary)" : "var(--color-text-muted)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <ListIcon size={16} />
            Rincian Transaksi
          </button>
        </div>
      )}

      {monthlyTx.length === 0 ? (
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
          <p style={{ fontWeight: 600 }}>{t("common.no_data")}</p>
        </div>
      ) : activeTab === "visual" ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
              gap: "1.25rem",
            }}
          >
            <LaporanPieChart transactions={monthlyTx} />
            <LaporanBarChart transactions={monthlyTx} />
          </div>
          <CategoryProgressGrid transactions={monthlyTx} />
        </>
      ) : (
        <LaporanTransactionList transactions={monthlyTx} />
      )}
    </div>
  );
}
