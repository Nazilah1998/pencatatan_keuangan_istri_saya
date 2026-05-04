"use client";
import React, { useState, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { transactionSchema } from "@/lib/validations";
import { addTransaction, updateTransaction } from "@/app/actions/transactions";
import { useAppStore } from "@/store/useAppStore";
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
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useAppStore();
  const custom_categories = React.useMemo(
    () => settings.custom_categories || [],
    [settings.custom_categories],
  );
  const custom_wallets = React.useMemo(
    () => settings.custom_wallets || [],
    [settings.custom_wallets],
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
          dompet: custom_wallets[0]?.name || "Cash",
          deskripsi: "",
        },
  });

  const selectedKategori = useWatch({ control, name: "kategori" });
  const selectedSubKategori = useWatch({ control, name: "sub_kategori" });
  const selectedDompet = useWatch({ control, name: "dompet" });
  const watchedJenis = useWatch({ control, name: "jenis" }) || "pengeluaran";

  const handleJenisChange = (val: "pemasukan" | "pengeluaran") => {
    setValue("jenis", val);
    setValue("kategori", "");
  };

  const currentCategory = custom_categories.find(
    (c) => c.name === selectedKategori,
  );
  const subCategoryOptions =
    currentCategory?.sub_categories.map((s) => s.name) || [];

  // Force reset form when component mounts or initialData changes
  useEffect(() => {
    if (!initialData) {
      reset({
        tanggal: new Date().toISOString().split("T")[0],
        jenis: "pengeluaran",
        jumlah: 0,
        kategori: "",
        sub_kategori: "",
        dompet: custom_wallets[0]?.name || "Cash",
        deskripsi: "",
      });
    }
  }, [reset, initialData, custom_wallets]);

  // Reset sub_kategori if parent kategori changes
  useEffect(() => {
    setValue("sub_kategori", "");
  }, [selectedKategori, setValue]);

  const onSubmit = async (data: TransactionFormData) => {
    setIsLoading(true);
    let result;

    if (initialData && rowIndex !== undefined) {
      result = await updateTransaction(initialData.id, data, initialData);
    } else {
      result = await addTransaction(data);
    }

    setIsLoading(false);
    if (result.success) {
      toast.success(
        initialData ? "Transaksi diperbarui!" : "Transaksi berhasil dicatat!",
      );

      // --- INSTANT UPDATE LOGIC ---
      if (result.data) {
        const currentTransactions = useAppStore.getState().transactions;
        if (initialData) {
          // Update existing
          const updated = currentTransactions.map((t) =>
            t.id === initialData.id ? result.data! : t,
          );
          useAppStore.getState().setTransactions(updated);
        } else {
          // Add new
          useAppStore
            .getState()
            .setTransactions([result.data, ...currentTransactions]);
        }

        // --- INSTANT ASSET BALANCE UPDATE (SMART CALCULATION) ---
        const currentAssets = useAppStore.getState().assets;
        const targetDompet = result.data.dompet;

        let amountChange = 0;
        const newAmount = result.data.jumlah;
        const isPemasukan = result.data.jenis === "pemasukan";

        if (initialData) {
          // If editing: we need to revert old and apply new
          const oldAmount = initialData.jumlah;
          const wasPemasukan = initialData.jenis === "pemasukan";

          // Reverse old amount
          const oldEffect = wasPemasukan ? -oldAmount : oldAmount;
          // Apply new amount
          const newEffect = isPemasukan ? newAmount : -newAmount;

          amountChange = oldEffect + newEffect;
        } else {
          // If adding new
          amountChange = isPemasukan ? newAmount : -newAmount;
        }

        const updatedAssets = currentAssets.map((asset) => {
          if (asset.nama === targetDompet) {
            return { ...asset, nilai: asset.nilai + amountChange };
          }
          return asset;
        });
        useAppStore.getState().setAssets(updatedAssets);
        // -------------------------------------------------------

        // Trigger a background sync to update budgets/etc
        // We use window focus event as a trick to trigger DataSyncProvider's sync
        window.dispatchEvent(new Event("focus"));
      }
      // ----------------------------

      if (!initialData) {
        reset({
          tanggal: new Date().toISOString().split("T")[0],
          jenis: watchedJenis,
          dompet: data.dompet,
        });
      }
      onSuccess?.();
    } else {
      toast.error(result.error || "Gagal menyimpan transaksi");
    }
  };

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
            style={tabStyle(
              watchedJenis === "pemasukan",
              "var(--color-income)",
            )}
            onClick={() => handleJenisChange("pemasukan")}
          >
            📈 Pemasukan
          </button>
          <button
            type="button"
            style={tabStyle(
              watchedJenis === "pengeluaran",
              "var(--color-expense)",
            )}
            onClick={() => handleJenisChange("pengeluaran")}
          >
            📉 Pengeluaran
          </button>
        </div>
        <input type="hidden" {...register("jenis")} value={watchedJenis} />
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <label className="form-label" style={{ margin: 0 }}>
              Pilih Dompet *
            </label>
            <button
              type="button"
              onClick={() => (window.location.href = "/pengaturan/dompet")}
              style={{
                fontSize: "0.75rem",
                background: "var(--color-primary-highlight)",
                color: "var(--color-primary)",
                border: "none",
                padding: "2px 8px",
                borderRadius: "6px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>+ Tambah</span>
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: "0.625rem",
            }}
          >
            {custom_wallets.map((wallet) => {
              const isSelected = selectedDompet === wallet.name;
              const icon = wallet.icon || "💳";
              return (
                <button
                  key={wallet.id}
                  type="button"
                  onClick={() => setValue("dompet", wallet.name)}
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
                    {wallet.name}
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.5rem",
          }}
        >
          <label className="form-label" style={{ margin: 0 }}>
            Pilih Kategori *
          </label>
          <button
            type="button"
            onClick={() => (window.location.href = "/pengaturan/kategori")}
            style={{
              fontSize: "0.75rem",
              background: "var(--color-primary-highlight)",
              color: "var(--color-primary)",
              border: "none",
              padding: "2px 8px",
              borderRadius: "6px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>+ Tambah</span>
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            gap: "0.625rem",
          }}
        >
          {custom_categories
            .filter((c) => c.type === watchedJenis)
            .map((cat) => {
              const isSelected = selectedKategori === cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setValue("kategori", cat.name)}
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
                  <span style={{ fontSize: "1.5rem" }}>{cat.icon || "📁"}</span>
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
                    {cat.name}
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
            {currentCategory?.sub_categories.map((sub) => {
              const isSelected = selectedSubKategori === sub.name;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setValue("sub_kategori", sub.name)}
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
                  <span style={{ fontSize: "1.5rem" }}>{sub.icon || "🔹"}</span>
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
                    {sub.name}
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
