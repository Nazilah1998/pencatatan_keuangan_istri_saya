"use client";
import React, { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { savingsSchema, SavingsSchema } from "@/lib/validations";
import { addSavings } from "@/app/actions/savings";
import { useAppStore } from "@/store/useAppStore";
import { SAVINGS_ICONS, SAVINGS_COLORS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

interface SavingsFormProps {
  onSuccess?: () => void;
}

export function SavingsForm({ onSuccess }: SavingsFormProps) {
  const { settings } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<SavingsSchema>({
    resolver: zodResolver(savingsSchema),
    defaultValues: {
      ikon: SAVINGS_ICONS[0],
      warna: SAVINGS_COLORS[0],
      prioritas: "sedang",
      status: "aktif",
      jumlah_terkumpul: 0,
      deskripsi: "",
    },
  });

  const selectedIcon = useWatch({ control, name: "ikon" });
  const selectedColor = useWatch({ control, name: "warna" });

  const onSubmit = async (data: SavingsSchema) => {
    setIsLoading(true);
    const result = await addSavings(
      data,
      settings.google_sheet_id,
      settings.sheet_tabs.tabungan,
    );
    setIsLoading(false);
    if (result.success) {
      toast.success("Target tabungan berhasil dibuat!");
      onSuccess?.();
    } else {
      toast.error(result.error || "Gagal menyimpan target");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
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
                style={{ fontFamily: "var(--font-mono)" }}
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
                style={{ fontFamily: "var(--font-mono)" }}
              />
            )}
          />
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
      >
        <div className="form-group">
          <label className="form-label">Target Selesai *</label>
          <input
            type="date"
            className={`input ${errors.target_tanggal ? "input-error" : ""}`}
            {...register("target_tanggal")}
          />
          {errors.target_tanggal && (
            <span className="form-error">{errors.target_tanggal.message}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Prioritas</label>
          <select className="input" {...register("prioritas")}>
            <option value="rendah">Rendah</option>
            <option value="sedang">Sedang</option>
            <option value="tinggi">Tinggi</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Pilih Ikon</label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {SAVINGS_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setValue("ikon", icon)}
              style={{
                width: 40,
                height: 40,
                borderRadius: "var(--radius-md)",
                background:
                  selectedIcon === icon
                    ? "var(--color-surface-offset)"
                    : "transparent",
                border:
                  selectedIcon === icon
                    ? "2px solid var(--color-primary)"
                    : "1px solid var(--color-border)",
                fontSize: "1.25rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all var(--transition)",
              }}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Pilih Warna</label>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {SAVINGS_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue("warna", color)}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: color,
                border: "none",
                cursor: "pointer",
                transform: selectedColor === color ? "scale(1.15)" : "scale(1)",
                boxShadow:
                  selectedColor === color
                    ? `0 0 0 2px var(--color-surface), 0 0 0 4px ${color}`
                    : "none",
                transition: "all var(--transition)",
              }}
            />
          ))}
        </div>
      </div>

      <Button type="submit" loading={isLoading} style={{ width: "100%" }}>
        Buat Target Tabungan
      </Button>
    </form>
  );
}
