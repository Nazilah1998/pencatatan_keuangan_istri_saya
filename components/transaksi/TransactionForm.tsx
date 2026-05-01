"use client";
import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { transactionSchema, TransactionSchema } from "@/lib/validations";
import { addTransaction } from "@/app/actions/transactions";
import { useAppStore } from "@/store/useAppStore";
import {
  PEMASUKAN_CATEGORIES,
  PENGELUARAN_CATEGORIES,
  DOMPET_OPTIONS,
} from "@/lib/constants";
import { Button } from "@/components/ui/Button";

interface TransactionFormProps {
  onSuccess?: () => void;
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const { settings } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [jenis, setJenis] = useState<"pemasukan" | "pengeluaran" | "transfer">(
    "pengeluaran",
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<TransactionSchema>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      tanggal: new Date().toISOString().split("T")[0],
      jenis: "pengeluaran",
      is_recurring: false,
      tags: "",
      deskripsi: "",
      catatan: "",
    },
  });

  const selectedKategori = useWatch({
    control,
    name: "kategori",
  });

  const categories =
    jenis === "pemasukan"
      ? PEMASUKAN_CATEGORIES.map((c) => ({ value: c, label: c }))
      : PENGELUARAN_CATEGORIES.map((c) => ({ value: c, label: c }));

  const handleJenisChange = (val: typeof jenis) => {
    setJenis(val);
    setValue("jenis", val);
    setValue("kategori", "");
  };

  const onSubmit = async (data: TransactionSchema) => {
    setIsLoading(true);
    try {
      const result = await addTransaction(
        data,
        settings.google_sheet_id,
        settings.sheet_tabs.transaksi,
      );
      if (result.success) {
        toast.success("Transaksi berhasil disimpan!");
        reset();
        onSuccess?.();
      } else {
        toast.error(result.error || "Gagal menyimpan transaksi");
      }
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const tabStyle = (active: boolean, color: string): React.CSSProperties => ({
    flex: 1,
    padding: "0.5rem",
    fontWeight: active ? 700 : 500,
    fontSize: "0.875rem",
    border: "none",
    cursor: "pointer",
    borderRadius: "var(--radius-md)",
    transition: "all var(--transition)",
    background: active ? color : "transparent",
    color: active ? "#fff" : "var(--color-text-muted)",
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
    >
      {/* Type Selector */}
      <div>
        <div className="form-label" style={{ marginBottom: "0.5rem" }}>
          Jenis Transaksi
        </div>
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
          <button
            type="button"
            style={tabStyle(jenis === "transfer", "var(--color-saving)")}
            onClick={() => handleJenisChange("transfer")}
          >
            ↔️ Transfer
          </button>
        </div>
        <input type="hidden" {...register("jenis")} value={jenis} />
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
      >
        {/* Amount */}
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label className="form-label">
            Jumlah <span style={{ color: "var(--color-danger)" }}>*</span>
          </label>
          <input
            type="number"
            placeholder="0"
            className={`input ${errors.jumlah ? "input-error" : ""}`}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.25rem",
              fontWeight: 700,
            }}
            {...register("jumlah", { valueAsNumber: true })}
          />
          {errors.jumlah && (
            <span className="form-error">{errors.jumlah.message}</span>
          )}
        </div>

        {/* Date */}
        <div className="form-group">
          <label className="form-label">Tanggal *</label>
          <input
            type="date"
            className={`input ${errors.tanggal ? "input-error" : ""}`}
            {...register("tanggal")}
          />
          {errors.tanggal && (
            <span className="form-error">{errors.tanggal.message}</span>
          )}
        </div>

        {/* Wallet */}
        <div className="form-group">
          <label className="form-label">Dompet *</label>
          <select
            className={`input ${errors.dompet ? "input-error" : ""}`}
            {...register("dompet")}
          >
            <option value="">Pilih dompet</option>
            {DOMPET_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {errors.dompet && (
            <span className="form-error">{errors.dompet.message}</span>
          )}
        </div>

        {/* Category (Modern Grid) */}
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label className="form-label">Kategori *</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: "0.5rem",
              maxHeight: "240px",
              overflowY: "auto",
              padding: "0.5rem",
              background: "var(--color-surface-offset)",
              borderRadius: "var(--radius-lg)",
              border: errors.kategori
                ? "1px solid var(--color-danger)"
                : "1px solid transparent",
            }}
            className="custom-scrollbar"
          >
            {categories.map((c) => {
              const isSelected = selectedKategori === c.value;
              const icons: Record<string, string> = {
                "Makanan & Minuman": "🍕",
                Transportasi: "🚗",
                Belanja: "🛍️",
                "Tagihan & Utilitas": "⚡",
                Kesehatan: "🏥",
                Pendidikan: "🎓",
                Hiburan: "🎮",
                "Perawatan Rumah": "🏠",
                Pakaian: "👕",
                Asuransi: "🛡️",
                Cicilan: "💳",
                "Sosial & Donasi": "🤝",
                Lainnya: "📦",
                Gaji: "💰",
                Bonus: "🧧",
                Freelance: "💻",
                Investasi: "📈",
                Hadiah: "🎁",
              };
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setValue("kategori", c.value)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.25rem",
                    padding: "0.75rem 0.5rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    background: isSelected
                      ? "var(--color-primary)"
                      : "var(--color-surface)",
                    color: isSelected ? "#fff" : "var(--color-text)",
                    transition: "all var(--transition)",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: isSelected ? 700 : 500,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor =
                        "var(--color-primary)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "var(--color-border)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>
                    {icons[c.value] || "📦"}
                  </span>
                  <span style={{ textAlign: "center", lineHeight: 1.2 }}>
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
          <input type="hidden" {...register("kategori")} />
          {errors.kategori && (
            <span className="form-error">{errors.kategori.message}</span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label">Deskripsi</label>
        <input
          type="text"
          placeholder="Contoh: Makan siang, Gaji bulan Mei..."
          className="input"
          {...register("deskripsi")}
        />
      </div>

      {/* Notes */}
      <div className="form-group">
        <label className="form-label">Catatan</label>
        <textarea
          placeholder="Catatan tambahan..."
          className="input"
          rows={2}
          style={{ resize: "none", height: "auto" }}
          {...register("catatan")}
        />
      </div>

      {/* Tags */}
      <div className="form-group">
        <label className="form-label">Tags</label>
        <input
          type="text"
          placeholder="pisahkan dengan koma: makan,keluarga,bulanan"
          className="input"
          {...register("tags")}
        />
      </div>

      {/* Recurring */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem 1rem",
          background: "var(--color-surface-offset)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <input
          type="checkbox"
          id="recurring"
          {...register("is_recurring")}
          style={{
            width: 18,
            height: 18,
            accentColor: "var(--color-primary)",
            cursor: "pointer",
          }}
        />
        <label
          htmlFor="recurring"
          style={{
            fontSize: "0.9375rem",
            fontWeight: 500,
            color: "var(--color-text)",
            cursor: "pointer",
          }}
        >
          Transaksi berulang (recurring)
        </label>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        loading={isLoading}
        style={{ width: "100%", marginTop: "0.25rem" }}
      >
        Simpan Transaksi
      </Button>
    </form>
  );
}
