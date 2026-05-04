"use client";
import React, { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { savingsSchema, SavingsSchema } from "@/lib/validations";
import { addSavings, updateSavings } from "@/app/actions/savings";
import { SAVINGS_ICONS, SAVINGS_COLORS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { SavingsGoal } from "@/types";

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
    resolver: zodResolver(savingsSchema),
    defaultValues: initialData || {
      ikon: SAVINGS_ICONS[0],
      warna: SAVINGS_COLORS[0],
      prioritas: "sedang",
      status: "aktif",
      jumlah_terkumpul: 0,
      deskripsi: "",
      target_tanggal: new Date().toISOString().split("T")[0],
    },
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
      className="savings-form"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <style jsx>{`
        .savings-form {
          gap: 1.5rem;
        }
        .selection-grid {
          display: flex;
          gap: 0.625rem;
          flex-wrap: wrap;
        }
        .icon-btn {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-lg);
          background: transparent;
          border: 2px solid var(--color-border);
          font-size: 1.25rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition);
        }
        .icon-btn.selected {
          border-color: var(--color-primary);
          background: var(--color-surface-offset);
          transform: scale(1.05);
        }
        .color-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all var(--transition);
          position: relative;
        }
        .color-btn.selected {
          transform: scale(1.2);
          box-shadow:
            0 0 0 2px var(--color-surface),
            0 0 0 4px currentColor;
        }
        @media (max-width: 640px) {
          .savings-form {
            gap: 1.125rem;
          }
        }
      `}</style>

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

      <div className="form-group">
        <label className="form-label">Pilih Ikon</label>
        <div className="selection-grid">
          {SAVINGS_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setValue("ikon", icon)}
              className={`icon-btn ${selectedIcon === icon ? "selected" : ""}`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Pilih Warna</label>
        <div
          className="selection-grid"
          style={{ gap: "1rem", padding: "0.25rem" }}
        >
          {SAVINGS_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue("warna", color)}
              className={`color-btn ${selectedColor === color ? "selected" : ""}`}
              style={{
                backgroundColor: color,
                color: color,
              }}
            />
          ))}
        </div>
      </div>

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
