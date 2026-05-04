"use client";
import React, { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { assetSchema, AssetSchema } from "@/lib/validations";
import { addAsset, updateAsset } from "@/app/actions/assets";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Asset } from "@/types";

interface AssetFormProps {
  initialData?: Asset;
  onSuccess?: () => void;
}

const ASSET_TYPES = [
  { value: "kas", label: "Uang Tunai (Cash)", icon: "💵" },
  { value: "rekening", label: "Tabungan/Bank", icon: "🏦" },
  { value: "investasi", label: "Investasi", icon: "📈" },
  { value: "emas", label: "Emas/Perhiasan", icon: "🟡" },
  { value: "properti", label: "Properti", icon: "🏠" },
  { value: "kendaraan", label: "Kendaraan", icon: "🚗" },
  { value: "lainnya", label: "Aset Lainnya", icon: "📦" },
];

export function AssetForm({ onSuccess, initialData }: AssetFormProps) {
  const { settings } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AssetSchema>({
    resolver: zodResolver(assetSchema),
    defaultValues: initialData
      ? {
          nama: initialData.nama,
          jenis: initialData.jenis,
          nilai: initialData.nilai,
          tanggal_update: initialData.tanggal_update,
          catatan: initialData.catatan || "",
        }
      : {
          nilai: 0,
          tanggal_update: new Date().toISOString().split("T")[0],
          jenis: "kas",
        },
  });

  const selectedJenis = useWatch({
    control,
    name: "jenis",
  });

  const onSubmit = async (data: AssetSchema) => {
    setIsLoading(true);
    let result;
    if (initialData) {
      result = await updateAsset(initialData.id, data);
    } else {
      result = await addAsset(data);
    }
    setIsLoading(false);
    if (result.success) {
      toast.success(
        initialData ? "Aset diperbarui!" : "Aset berhasil dicatat!",
      );
      onSuccess?.();
    } else {
      toast.error(
        result.error ||
          (initialData ? "Gagal memperbarui aset" : "Gagal mencatat aset"),
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
    >
      <div className="form-group">
        <label className="form-label">Nama Aset *</label>
        <input
          type="text"
          placeholder="Contoh: Rumah Tinggal, Emas Batangan"
          className={`input ${errors.nama ? "input-error" : ""}`}
          {...register("nama")}
        />
        {errors.nama && (
          <span className="form-error">{errors.nama.message}</span>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Jenis Aset</label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {ASSET_TYPES.map((type) => (
            <label
              key={type.value}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                borderRadius: "var(--radius-lg)",
                border: "2px solid",
                borderColor:
                  selectedJenis === type.value
                    ? "var(--color-primary)"
                    : "var(--color-border)",
                background:
                  selectedJenis === type.value
                    ? "var(--color-surface-offset)"
                    : "transparent",
                cursor: "pointer",
                transition: "all var(--transition)",
              }}
            >
              <input
                type="radio"
                value={type.value}
                style={{ display: "none" }}
                {...register("jenis")}
              />
              <span style={{ fontSize: "1.5rem" }}>{type.icon}</span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                {type.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {selectedJenis === "emas" && (
        <div
          style={{
            padding: "0.875rem",
            background: "#fff9db",
            borderRadius: "var(--radius-lg)",
            border: "1px solid #fab005",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          <div
            style={{
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "#856404",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            <span>💡</span> Tips Pencatatan Emas
          </div>
          <p style={{ fontSize: "0.75rem", color: "#856404", margin: 0 }}>
            Anda bisa mencatat <strong>berat (gram)</strong> dan{" "}
            <strong>harga beli</strong> di kolom Catatan di bawah agar
            riwayatnya lebih lengkap.
          </p>
        </div>
      )}

      <div className="form-group">
        <Controller
          control={control}
          name="nilai"
          render={({ field: { onChange, value } }) => (
            <CurrencyInput
              label="Nilai Aset Saat Ini"
              required
              value={value}
              onChange={onChange}
              error={errors.nilai?.message}
            />
          )}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Tanggal Update *</label>
        <input
          type="date"
          className={`input ${errors.tanggal_update ? "input-error" : ""}`}
          {...register("tanggal_update")}
        />
        {errors.tanggal_update && (
          <span className="form-error">{errors.tanggal_update.message}</span>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Catatan</label>
        <textarea
          placeholder="Tambahkan detail (misal: berat emas, harga beli, atau keterangan lainnya)"
          className="input"
          style={{ minHeight: "80px", resize: "vertical", padding: "0.75rem" }}
          {...register("catatan")}
        />
      </div>

      <Button type="submit" loading={isLoading} style={{ width: "100%" }}>
        {initialData ? "Simpan Perubahan" : "Simpan Aset"}
      </Button>
    </form>
  );
}
