"use client";
import React, { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { budgetSchema, BudgetSchema } from "@/lib/validations";
import { addBudget } from "@/app/actions/budgets";
import { useAppStore } from "@/store/useAppStore";
import { PENGELUARAN_CATEGORIES } from "@/lib/constants";
import { getCurrentPeriod } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { CATEGORY_ICONS } from "@/lib/constants";

interface BudgetFormProps {
  onSuccess?: () => void;
}

export function BudgetForm({ onSuccess }: BudgetFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<BudgetSchema>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { periode: getCurrentPeriod(), catatan: "" },
  });

  const selectedKategori = useWatch({ control, name: "kategori" });

  const onSubmit = async (data: BudgetSchema) => {
    setIsLoading(true);
    const result = await addBudget(data);
    setIsLoading(false);
    if (result.success) {
      toast.success("Anggaran berhasil disimpan!");
      reset({ periode: getCurrentPeriod() });
      onSuccess?.();
    } else {
      toast.error(result.error || "Gagal menyimpan anggaran");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="budget-form"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <style jsx>{`
        .budget-form {
          gap: 1.5rem;
        }
        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.625rem;
        }
        .grid-item-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 0.5rem;
          border-radius: var(--radius-xl);
          border: 2px solid var(--color-border);
          background: transparent;
          cursor: pointer;
          transition: all var(--transition);
        }
        .grid-item-btn.selected {
          border-color: var(--color-primary);
          background: var(--color-surface-offset);
          box-shadow: var(--shadow-sm);
        }
        @media (max-width: 640px) {
          .budget-form {
            gap: 1.125rem;
          }
          .grid-item-btn {
            padding: 0.625rem 0.375rem;
          }
        }
      `}</style>

      {/* Kategori Grid */}
      <div className="form-group">
        <label className="form-label">Pilih Kategori *</label>
        <div className="category-grid">
          {PENGELUARAN_CATEGORIES.map((cat) => {
            const isSelected = selectedKategori === cat;
            const icon = CATEGORY_ICONS[cat] || "📁";
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setValue("kategori", cat)}
                className={`grid-item-btn ${isSelected ? "selected" : ""}`}
              >
                <span style={{ fontSize: "1.5rem" }}>{icon}</span>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    textAlign: "center",
                    color: isSelected
                      ? "var(--color-primary)"
                      : "var(--color-text)",
                    lineHeight: 1.2,
                  }}
                >
                  {cat}
                </span>
              </button>
            );
          })}
        </div>
        {errors.kategori && (
          <span className="form-error">{errors.kategori.message}</span>
        )}
      </div>

      {/* Batas Bulanan */}
      <div className="form-group">
        <Controller
          control={control}
          name="batas_bulanan"
          render={({ field: { onChange, value } }) => (
            <CurrencyInput
              label="Batas Bulanan"
              required
              value={value}
              onChange={onChange}
              error={errors.batas_bulanan?.message}
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
                fontSize: "1.125rem",
                textAlign: "center",
              }}
            />
          )}
        />
      </div>

      {/* Periode Modern */}
      <Controller
        control={control}
        name="periode"
        render={({ field: { onChange, value } }) => (
          <MonthPicker
            label="Periode Anggaran"
            required
            value={value}
            onChange={onChange}
            error={errors.periode?.message}
          />
        )}
      />

      <Button
        type="submit"
        loading={isLoading}
        size="lg"
        fullWidth
        style={{ marginTop: "0.5rem" }}
      >
        Simpan Anggaran
      </Button>
    </form>
  );
}
