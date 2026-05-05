"use client";
import React, { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { budgetSchema, BudgetSchema } from "@/lib/validations";
import { addBudget } from "@/app/actions/budgets";
import { getCurrentPeriod } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { BudgetCategorySelector } from "./sections/BudgetCategorySelector";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface BudgetFormProps {
  onSuccess?: () => void;
}

export function BudgetForm({ onSuccess }: BudgetFormProps) {
  const { t } = useTranslation();
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
      toast.success(t("budget.form.success"));
      reset({ periode: getCurrentPeriod() });
      onSuccess?.();
    } else {
      toast.error(result.error || t("budget.form.error"));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      <BudgetCategorySelector
        selectedKategori={selectedKategori}
        onSelect={(cat: string) => setValue("kategori", cat)}
        error={errors.kategori?.message}
      />

      {/* Batas Bulanan */}
      <div className="form-group">
        <Controller
          control={control}
          name="batas_bulanan"
          render={({ field: { onChange, value } }) => (
            <CurrencyInput
              label={t("budget.form.limit_label")}
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
            label={t("budget.form.period_label")}
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
        {t("budget.form.save")}
      </Button>
    </form>
  );
}
