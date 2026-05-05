"use client";
import React from "react";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";

interface ChartsGridProps {
  weeklyData: { week: string; pemasukan: number; pengeluaran: number }[];
  categoryData: { kategori: string; total: number; fill: string }[];
}

export function ChartsGrid({ weeklyData, categoryData }: ChartsGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "1rem",
      }}
    >
      <SpendingChart data={weeklyData} />
      <CategoryPieChart data={categoryData} />
    </div>
  );
}
