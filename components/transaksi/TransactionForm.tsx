"use client";
import React, { useState, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { transactionSchema } from "@/lib/validations";
import { addTransaction, updateTransaction } from "@/app/actions/transactions";
import { useAppStore } from "@/store/useAppStore";
import {
  PEMASUKAN_CATEGORIES,
  PENGELUARAN_CATEGORIES,
  DOMPET_OPTIONS,
  SUB_CATEGORIES,
  CATEGORY_ICONS,
  SUB_CATEGORY_ICONS,
  DOMPET_ICONS,
} from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { TransactionFormData, Transaction } from "@/types";

interface TransactionFormProps {
  onSuccess?: () => void;
  initialData?: Transaction;
  rowIndex?: number;
}

export function TransactionForm({
  onSuccess,
  initialData,
  rowIndex,
}: TransactionFormProps) {
  const { settings } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [jenis, setJenis] = useState<"pemasukan" | "pengeluaran">(
    initialData?.jenis || "pengeluaran",
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          tanggal: initialData.tanggal.split("T")[0],
        }
      : {
          tanggal: new Date().toISOString().split("T")[0],
          jenis: "pengeluaran",
          jumlah: 0,
          kategori: "",
          sub_kategori: "",
          dompet: DOMPET_OPTIONS[0],
          deskripsi: "",
        },
  });

  const selectedKategori = useWatch({ control, name: "kategori" });
  const selectedSubKategori = useWatch({ control, name: "sub_kategori" });
  const selectedDompet = useWatch({ control, name: "dompet" });
  const subCategoryOptions = SUB_CATEGORIES[selectedKategori] || [];

  // Reset sub_kategori if parent kategori changes
  useEffect(() => {
    setValue("sub_kategori", "");
  }, [selectedKategori, setValue]);

  const onSubmit = async (data: TransactionFormData) => {
    setIsLoading(true);
    let result;

    if (initialData && rowIndex !== undefined) {
      result = await updateTransaction(
        initialData.id,
        rowIndex,
        data,
        settings.google_sheet_id,
        settings.sheet_tabs.transaksi,
      );
    } else {
      result = await addTransaction(
        data,
        settings.google_sheet_id,
        settings.sheet_tabs.transaksi,
      );
    }

    setIsLoading(false);
    if (result.success) {
      toast.success(
        initialData ? "Transaksi diperbarui!" : "Transaksi berhasil dicatat!",
      );
      if (!initialData) {
        reset({
          tanggal: new Date().toISOString().split("T")[0],
          jenis,
          dompet: data.dompet,
        });
      }
      onSuccess?.();
    } else {
      toast.error(result.error || "Gagal menyimpan transaksi");
    }
  };

  const handleJenisChange = (val: "pemasukan" | "pengeluaran") => {
    setJenis(val);
    setValue("jenis", val);
    setValue("kategori", "");
  };

  const categories =
    jenis === "pemasukan" ? PEMASUKAN_CATEGORIES : PENGELUARAN_CATEGORIES;

  const tabStyle = (active: boolean, color: string) => ({
    flex: 1,
    padding: "0.75rem",
    border: "none",
    borderRadius: "var(--radius-md)",
    background: active ? color : "transparent",
    color: active ? "white" : "var(--color-text-muted)",
    fontWeight: 700,
    fontSize: "0.8125rem",
    cursor: "pointer",
    transition: "all var(--transition)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="transaction-form"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <style jsx>{`
        .transaction-form {
          gap: 1.5rem;
        }
        @media (max-width: 640px) {
          .transaction-form {
            gap: 1.125rem;
          }
          .grid-item-btn {
            padding: 0.625rem 0.375rem !important;
          }
        }
        .grid-item-btn {
          padding: 0.875rem 0.5rem;
        }
      `}</style>
      {/* Jenis Transaksi Tabs */}
      <div className="form-group">
        <label className="form-label">Jenis Transaksi</label>
        <div
          style={{
            display: "flex",
            gap: "0.375rem",
            padding: "0.375rem",
            background: "var(--color-surface-offset)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <button
            type="button"
            style={tabStyle(jenis === "pemasukan", "var(--color-income)")}
            onClick={() => handleJenisChange("pemasukan")}
          >
            📈 Pemasukan
          </button>
          <button
            type="button"
            style={tabStyle(jenis === "pengeluaran", "var(--color-expense)")}
            onClick={() => handleJenisChange("pengeluaran")}
          >
            📉 Pengeluaran
          </button>
        </div>
        <input type="hidden" {...register("jenis")} value={jenis} />
      </div>

      {/* Jumlah Input */}
      <div className="form-group">
        <Controller
          control={control}
          name="jumlah"
          render={({ field: { onChange, value } }) => (
            <CurrencyInput
              label="Jumlah"
              required
              value={value}
              onChange={onChange}
              error={errors.jumlah?.message}
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                textAlign: "center",
              }}
            />
          )}
        />
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}
      >
        <Controller
          control={control}
          name="tanggal"
          render={({ field: { onChange, value } }) => (
            <DatePicker
              label="Tanggal Transaksi"
              required
              value={value}
              onChange={onChange}
              error={errors.tanggal?.message}
            />
          )}
        />

        {/* Dompet Selector (Modern Grid) */}
        <div className="form-group">
          <label className="form-label">Pilih Dompet *</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: "0.625rem",
            }}
          >
            {DOMPET_OPTIONS.map((d) => {
              const isSelected = selectedDompet === d;
              const icon = DOMPET_ICONS[d] || "💳";
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setValue("dompet", d)}
                  className="grid-item-btn"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.375rem",
                    borderRadius: "var(--radius-lg)",
                    border: "2px solid",
                    borderColor: isSelected
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                    background: isSelected
                      ? "var(--color-surface-offset)"
                      : "transparent",
                    cursor: "pointer",
                    transition: "all var(--transition)",
                  }}
                >
                  <span style={{ fontSize: "1.25rem" }}>{icon}</span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: isSelected
                        ? "var(--color-primary)"
                        : "var(--color-text)",
                    }}
                  >
                    {d}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.dompet && (
            <span className="form-error">{errors.dompet.message}</span>
          )}
        </div>
      </div>

      {/* Kategori Grid */}
      <div className="form-group">
        <label className="form-label">Pilih Kategori *</label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            gap: "0.625rem",
          }}
        >
          {categories.map((cat) => {
            const isSelected = selectedKategori === cat;
            const icon = CATEGORY_ICONS[cat] || "📁";
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setValue("kategori", cat)}
                className="grid-item-btn"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                  borderRadius: "var(--radius-xl)",
                  border: "2px solid",
                  borderColor: isSelected
                    ? "var(--color-primary)"
                    : "var(--color-border)",
                  background: isSelected
                    ? "var(--color-surface-offset)"
                    : "transparent",
                  cursor: "pointer",
                  transition: "all var(--transition)",
                  boxShadow: isSelected ? "var(--shadow-sm)" : "none",
                }}
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

      {/* Sub Kategori - Only show if current category has subs */}
      {subCategoryOptions.length > 0 && (
        <div className="form-group animate-in fade-in slide-in-from-top-2">
          <label className="form-label">Pilih Sub Kategori</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: "0.625rem",
            }}
          >
            {subCategoryOptions.map((sub) => {
              const isSelected = selectedSubKategori === sub;
              const icon = SUB_CATEGORY_ICONS[sub] || "🔹";
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setValue("sub_kategori", sub)}
                  className="grid-item-btn"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.5rem",
                    borderRadius: "var(--radius-xl)",
                    border: "2px solid",
                    borderColor: isSelected
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                    background: isSelected
                      ? "var(--color-surface-offset)"
                      : "transparent",
                    cursor: "pointer",
                    transition: "all var(--transition)",
                    boxShadow: isSelected ? "var(--shadow-sm)" : "none",
                  }}
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
                    {sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Deskripsi</label>
        <textarea
          placeholder="Contoh: Makan siang, Gaji bulan Mei..."
          className={`input ${errors.deskripsi ? "input-error" : ""}`}
          style={{ minHeight: "80px", resize: "none" }}
          {...register("deskripsi")}
        />
        {errors.deskripsi && (
          <span className="form-error">{errors.deskripsi.message}</span>
        )}
      </div>

      <Button type="submit" loading={isLoading} style={{ width: "100%" }}>
        Simpan Transaksi
      </Button>
    </form>
  );
}
