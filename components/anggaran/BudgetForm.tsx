"use client";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { budgetSchema, BudgetSchema } from "@/lib/validations";
import { addBudget } from "@/app/actions/budgets";
import { useAppStore } from "@/store/useAppStore";
import { PENGELUARAN_CATEGORIES } from "@/lib/constants";
import { getCurrentPeriod } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

interface BudgetFormProps {
  onSuccess?: () => void;
}

export function BudgetForm({ onSuccess }: BudgetFormProps) {
  const { settings } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<BudgetSchema>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { periode: getCurrentPeriod(), catatan: "" },
  });

  const onSubmit = async (data: BudgetSchema) => {
    setIsLoading(true);
    const result = await addBudget(
      data,
      settings.google_sheet_id,
      settings.sheet_tabs.anggaran,
    );
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
      style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}
    >
      <div className="form-group">
        <label className="form-label">Kategori *</label>
        <select
          className={`input ${errors.kategori ? "input-error" : ""}`}
          {...register("kategori")}
        >
          <option value="">Pilih kategori</option>
          {PENGELUARAN_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors.kategori && (
          <span className="form-error">{errors.kategori.message}</span>
        )}
      </div>

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
              style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}
            />
          )}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Periode (YYYY-MM) *</label>
        <input
          type="month"
          className={`input ${errors.periode ? "input-error" : ""}`}
          {...register("periode")}
        />
        {errors.periode && (
          <span className="form-error">{errors.periode.message}</span>
        )}
      </div>

      <Button type="submit" loading={isLoading} style={{ width: "100%" }}>
        Simpan Anggaran
      </Button>
    </form>
  );
}
