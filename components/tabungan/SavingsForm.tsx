"use client";
import React, { useState } from "react";
import { useForm, Controller, useWatch, type Resolver } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { savingsSchema, SavingsSchema } from "@/lib/validations";
import { addSavings, updateSavings } from "@/app/actions/savings";
import { SAVINGS_ICONS, SAVINGS_COLORS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { SavingsGoal } from "@/types";
import { SavingsIconSelector } from "./sections/SavingsIconSelector";

interface SavingsFormProps {
  initialData?: SavingsGoal;
  rowIndex?: number;
  onSuccess?: () => void;
}

export function SavingsForm({
  initialData,
  rowIndex,
  onSuccess,
}: SavingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!initialData && rowIndex !== undefined;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<SavingsSchema>({
    resolver: zodResolver(savingsSchema) as unknown as Resolver<SavingsSchema>,

    defaultValues: (initialData || {
      ikon: SAVINGS_ICONS[0],
      warna: SAVINGS_COLORS[0],
      prioritas: "sedang",
      status: "aktif",
      jumlah_terkumpul: 0,
      deskripsi: "",
      target_tanggal: new Date().toISOString().split("T")[0],
    }) as SavingsSchema,
  });

  const selectedIcon = useWatch({ control, name: "ikon" });
  const selectedColor = useWatch({ control, name: "warna" });

  const onSubmit = async (data: SavingsSchema) => {
    setIsLoading(true);
    const result = isEdit
      ? await updateSavings(initialData.id, data)
      : await addSavings(data);
    setIsLoading(false);
    if (result.success) {
      toast.success(isEdit ? "Target diperbarui!" : "Target tabungan dibuat!");
      onSuccess?.();
    } else {
      toast.error(result.error || "Gagal menyimpan target");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      <div className="form-group">
        <label className="form-label">Nama Tujuan *</label>
        <input
          type="text"
          placeholder="Contoh: Liburan ke Bali"
          className={`input ${errors.nama_tujuan ? "input-error" : ""}`}
          {...register("nama_tujuan")}
        />
        {errors.nama_tujuan && (
          <span className="form-error">{errors.nama_tujuan.message}</span>
        )}
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
      >
        <div className="form-group">
          <Controller
            control={control}
            name="target_jumlah"
            render={({ field: { onChange, value } }) => (
              <CurrencyInput
                label="Target Jumlah"
                required
                value={value}
                onChange={onChange}
                error={errors.target_jumlah?.message}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              />
            )}
          />
        </div>
        <div className="form-group">
          <Controller
            control={control}
            name="jumlah_terkumpul"
            render={({ field: { onChange, value } }) => (
              <CurrencyInput
                label="Sudah Terkumpul"
                value={value}
                onChange={onChange}
                error={errors.jumlah_terkumpul?.message}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              />
            )}
          />
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
      >
        <Controller
          control={control}
          name="target_tanggal"
          render={({ field: { onChange, value } }) => (
            <DatePicker
              label="Target Selesai"
              required
              value={value}
              onChange={onChange}
              error={errors.target_tanggal?.message}
            />
          )}
        />
        <div className="form-group">
          <label className="form-label">Prioritas</label>
          <select className="input" {...register("prioritas")}>
            <option value="rendah">Rendah</option>
            <option value="sedang">Sedang</option>
            <option value="tinggi">Tinggi</option>
          </select>
        </div>
      </div>

      <SavingsIconSelector
        selectedIcon={selectedIcon}
        selectedColor={selectedColor}
        onIconSelect={(icon) => setValue("ikon", icon)}
        onColorSelect={(color) => setValue("warna", color)}
      />

      <Button
        type="submit"
        loading={isLoading}
        size="lg"
        fullWidth
        style={{ marginTop: "0.5rem" }}
      >
        {isEdit ? "Simpan Perubahan" : "Buat Target Tabungan"}
      </Button>
    </form>
  );
}
