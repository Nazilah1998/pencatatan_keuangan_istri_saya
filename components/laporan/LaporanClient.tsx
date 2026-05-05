"use client";
import React, { useState, useMemo } from "react";
import { FileText } from "lucide-react";
import { Transaction } from "@/types";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { arrayToCSV, downloadCSV } from "@/lib/utils";
import { format, addMonths, subMonths } from "date-fns";
import { useTranslation } from "@/lib/i18n/useTranslation";

// Sub-components
import { ReportHeader } from "@/components/laporan/sections/ReportHeader";
import { ReportFilter } from "@/components/laporan/sections/ReportFilter";
import { SummaryCards } from "@/components/laporan/sections/SummaryCards";

interface LaporanClientProps {
  initialTransactions: Transaction[];
}

export function LaporanClient({ initialTransactions }: LaporanClientProps) {
  const { t } = useTranslation();
  const [transactions] = useState<Transaction[]>(initialTransactions);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState(t("common.all"));

  const selectedMonth = format(currentDate, "yyyy-MM");

  const categories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((tx) => cats.add(tx.kategori));
    return [t("common.all"), ...Array.from(cats).sort()];
  }, [transactions, t]);

  const monthlyTx = useMemo(
    () =>
      transactions.filter((tx) => {
        const matchMonth = tx.tanggal.startsWith(selectedMonth);
        const matchCategory =
          selectedCategory === t("common.all") ||
          tx.kategori === selectedCategory;
        return matchMonth && matchCategory;
      }),
    [transactions, selectedMonth, selectedCategory, t],
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
    const headers = [
      "ID",
      t("transactions.date"),
      t("transactions.type"),
      t("transactions.amount"),
      t("transactions.category"),
      t("transactions.wallet"),
      t("transactions.description"),
    ];
    const rows = monthlyTx.map((tx) => [
      tx.id,
      tx.tanggal,
      tx.jenis === "pemasukan" ? t("common.income") : t("common.expense"),
      String(tx.jumlah),
      tx.kategori,
      tx.dompet,
      tx.deskripsi || "",
    ]);
    downloadCSV(arrayToCSV(headers, rows), `report-${selectedMonth}.csv`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(1, 105, 111);
    doc.text("Sintya Finance", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${t("reports.monthly_report")}: ${selectedMonth}`, 14, 30);
    doc.setFontSize(10);
    doc.text(
      `${t("reports.total_income")}: Rp ${income.toLocaleString()}`,
      14,
      40,
    );
    doc.text(
      `${t("reports.total_expense")}: Rp ${expense.toLocaleString()}`,
      14,
      45,
    );
    doc.text(`${t("reports.surplus")}: Rp ${surplus.toLocaleString()}`, 14, 50);
    const tableData = monthlyTx.map((tx, i) => [
      i + 1,
      tx.tanggal,
      tx.jenis === "pemasukan" ? t("common.income") : t("common.expense"),
      tx.kategori,
      `Rp ${tx.jumlah.toLocaleString()}`,
      tx.deskripsi || "-",
    ]);
    autoTable(doc, {
      startY: 60,
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
      headStyles: { fillColor: [1, 105, 111] },
      alternateRowStyles: { fillColor: [245, 247, 249] },
      margin: { top: 60 },
    });
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
          <p style={{ fontWeight: 600 }}>{t("common.no_data")}</p>
        </div>
      )}
    </div>
  );
}
