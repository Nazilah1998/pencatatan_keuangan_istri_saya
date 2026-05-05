"use client";
import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CategoryChartData } from "@/types";
import { useTranslation } from "@/lib/i18n/useTranslation";

// Sub-components
import { CategoryTooltip } from "./charts/CategoryTooltip";
import { CategoryFilter } from "./charts/CategoryFilter";
import { CategoryLegend } from "./charts/CategoryLegend";

interface CategoryPieChartProps {
  data: CategoryChartData[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const { t, currentLang } = useTranslation();
  const intlLocale = currentLang === "id" ? "id-ID" : currentLang === "en" ? "en-US" : currentLang;

  const categoryKeys = data.map((d) => d.kategori).join(",");
  const [prevKeys, setPrevKeys] = useState(categoryKeys);
  const [activeCategories, setActiveCategories] = useState<string[]>(data.map((d) => d.kategori));

  // Sync active categories when data categories change
  if (categoryKeys !== prevKeys) {
    setPrevKeys(categoryKeys);
    setActiveCategories(data.map((d) => d.kategori));
  }

  const filteredData = useMemo(() => {
    return data.filter((d) => activeCategories.includes(d.kategori));
  }, [data, activeCategories]);

  const toggleCategory = (kategori: string) => {
    setActiveCategories((prev) =>
      prev.includes(kategori) ? prev.filter((c) => c !== kategori) : [...prev, kategori]
    );
  };

  if (!data.length) {
    return (
      <div className="card" style={{ padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 280 }}>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem" }}>{t("dashboard.pie_empty")}</p>
      </div>
    );
  }

  const totalFiltered = filteredData.reduce((s, d) => s + d.total, 0);

  return (
    <div className="card" style={{ padding: "var(--card-padding)", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <CategoryFilter
        data={data}
        activeCategories={activeCategories}
        onToggle={toggleCategory}
        onReset={() => setActiveCategories(data.map((d) => d.kategori))}
        t={t}
      />

      <div style={{ position: "relative", minHeight: 200 }}>
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={filteredData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="total"
                nameKey="kategori"
                animationBegin={0}
                animationDuration={800}
              >
                {filteredData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CategoryTooltip intlLocale={intlLocale} />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            {t("dashboard.pie_select")}
          </div>
        )}
      </div>

      <CategoryLegend filteredData={filteredData} totalFiltered={totalFiltered} intlLocale={intlLocale} />
    </div>
  );
}
