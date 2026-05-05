"use client";
import React, { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { debtSchema, DebtSchema } from "@/lib/validations";
import { addDebt, updateDebt } from "@/app/actions/assets";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Debt } from "@/types";
import { DebtTypeSelector } from "./form/DebtTypeSelector";

interface DebtFormProps {
  initialData?: Debt;
  onSuccess?: () => void;
}

export function DebtForm({ onSuccess, initialData }: DebtFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DebtSchema>({
    resolver: zodResolver(debtSchema),
    defaultValues: initialData
      ? {
          nama_hutang: initialData.nama_hutang,
          total_awal: initialData.total_awal,
          sisa_hutang: initialData.sisa_hutang,
          cicilan_bulanan: initialData.cicilan_bulanan,
          suku_bunga: initialData.suku_bunga,
          tanggal_jatuh_tempo: initialData.tanggal_jatuh_tempo,
          jenis: initialData.jenis,
          catatan: initialData.catatan || "",
        }
      : {
          nama_hutang: "",
          total_awal: 0,
          sisa_hutang: 0,
          cicilan_bulanan: 0,
          suku_bunga: 0,
          tanggal_jatuh_tempo: new Date().toISOString().split("T")[0],
          jenis: "lainnya",
          catatan: "",
        },

  });

  const selectedJenis = useWatch({ control, name: "jenis" });

  const onSubmit = async (data: DebtSchema) => {
    setIsLoading(true);
    const result = initialData ? await updateDebt(initialData.id, data) : await addDebt(data);
    setIsLoading(false);
    if (result.success) {
      toast.success(initialData ? "Data hutang diperbarui!" : "Hutang berhasil dicatat!");
      onSuccess?.();
    } else {
      toast.error(result.error || (initialData ? "Gagal memperbarui data hutang" : "Gagal mencatat hutang"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="form-group">
        <label className="form-label">Nama Hutang/Pinjaman *</label>
        <input
          type="text"
          placeholder="Contoh: KPR Bank ABC, Cicilan Motor"
          className={`input ${errors.nama_hutang ? "input-error" : ""}`}
          {...register("nama_hutang")}
        />
        {errors.nama_hutang && <span className="form-error">{errors.nama_hutang.message}</span>}
      </div>

      <DebtTypeSelector selectedJenis={selectedJenis} register={register} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="form-group">
          <Controller
            control={control}
            name="total_awal"
            render={({ field: { onChange, value } }) => (
              <CurrencyInput label="Total Pinjaman Awal" required value={value} onChange={onChange} error={errors.total_awal?.message} />
            )}
          />
        </div>
        <div className="form-group">
          <Controller
            control={control}
            name="sisa_hutang"
            render={({ field: { onChange, value } }) => (
              <CurrencyInput label="Sisa Hutang Saat Ini" required value={value} onChange={onChange} error={errors.sisa_hutang?.message} />
            )}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="form-group">
          <Controller
            control={control}
            name="cicilan_bulanan"
            render={({ field: { onChange, value } }) => (
              <CurrencyInput label="Cicilan per Bulan" required value={value} onChange={onChange} error={errors.cicilan_bulanan?.message} />
            )}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Suku Bunga (%)</label>
          <input type="number" step="0.01" placeholder="0" className="input" {...register("suku_bunga", { valueAsNumber: true })} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Jatuh Tempo/Berakhir *</label>
        <input type="date" className={`input ${errors.tanggal_jatuh_tempo ? "input-error" : ""}`} {...register("tanggal_jatuh_tempo")} />
        {errors.tanggal_jatuh_tempo && <span className="form-error">{errors.tanggal_jatuh_tempo.message}</span>}
      </div>

      <Button type="submit" loading={isLoading} style={{ width: "100%" }}>
        {initialData ? "Simpan Perubahan" : "Simpan Hutang"}
      </Button>
    </form>
  );
}
