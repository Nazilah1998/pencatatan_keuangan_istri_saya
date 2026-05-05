"use client";
import React, { useState, useEffect } from "react";
import { useForm, Controller, useWatch, type Resolver } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { transactionSchema } from "@/lib/validations";
import { addTransaction, updateTransaction } from "@/app/actions/transactions";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Transaction, AppSettings } from "@/types";
import { TransactionSchema } from "@/lib/validations";
import { useTranslation } from "@/lib/i18n/useTranslation";

// Sub-components
import { TypeSelector } from "./form/TypeSelector";
import { WalletSelector } from "./form/WalletSelector";
import { CategorySelector } from "./form/CategorySelector";
import { SubCategorySelector } from "./form/SubCategorySelector";

interface TransactionFormProps {
  onSuccess?: () => void;
  initialData?: Transaction;
  rowIndex?: number;
  initialSettings?: Partial<AppSettings>;
}

export function TransactionForm({
  onSuccess,
  initialData,
  rowIndex,
  initialSettings,
}: TransactionFormProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const { settings: storeSettings } = useAppStore();

  const settings = initialSettings || storeSettings;
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
  } = useForm<TransactionSchema>({
    resolver: zodResolver(
      transactionSchema,
    ) as unknown as Resolver<TransactionSchema>,

    defaultValues: initialData
      ? { ...initialData, tanggal: initialData.tanggal.split("T")[0] }
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
  const subCategories = currentCategory?.sub_categories || [];

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

  useEffect(() => {
    setValue("sub_kategori", "");
  }, [selectedKategori, setValue]);

  const onSubmit = async (data: TransactionSchema) => {
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
        initialData
          ? t("transactions.success_edit")
          : t("transactions.success_add"),
      );

      if (result.data) {
        const store = useAppStore.getState();
        const currentTransactions = store.transactions;

        // Update Local Store (Transactions)
        if (initialData) {
          const updated = currentTransactions.map((t) =>
            t.id === initialData.id ? result.data! : t,
          );
          store.setTransactions(updated);
        } else {
          store.setTransactions([result.data, ...currentTransactions]);
        }

        // Update Local Store (Assets)
        const currentAssets = store.assets;
        let amountChange = 0;
        const newAmount = result.data.jumlah;
        const isPemasukan = result.data.jenis === "pemasukan";

        if (initialData) {
          const oldAmount = initialData.jumlah;
          const wasPemasukan = initialData.jenis === "pemasukan";
          amountChange =
            (wasPemasukan ? -oldAmount : oldAmount) +
            (isPemasukan ? newAmount : -newAmount);
        } else {
          amountChange = isPemasukan ? newAmount : -newAmount;
        }

        const updatedAssets = currentAssets.map((asset) =>
          asset.nama === result.data!.dompet
            ? { ...asset, nilai: asset.nilai + amountChange }
            : asset,
        );
        store.setAssets(updatedAssets);
        window.dispatchEvent(new Event("focus"));
      }

      if (!initialData) {
        reset({
          tanggal: new Date().toISOString().split("T")[0],
          jenis: watchedJenis,
          dompet: data.dompet,
        });
      }
      onSuccess?.();
    } else {
      toast.error(result.error || t("common.error"));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      <TypeSelector
        watchedJenis={watchedJenis}
        onJenisChange={handleJenisChange}
      />
      <input type="hidden" {...register("jenis")} value={watchedJenis} />

      <div className="form-group">
        <Controller
          control={control}
          name="jumlah"
          render={({ field: { onChange, value } }) => (
            <CurrencyInput
              label={t("transactions.form.amount")}
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
              label={t("transactions.form.date")}
              required
              value={value}
              onChange={onChange}
              error={errors.tanggal?.message}
            />
          )}
        />

        <WalletSelector
          wallets={custom_wallets}
          selectedDompet={selectedDompet || ""}
          onSelect={(name) => setValue("dompet", name)}
          error={errors.dompet?.message}
        />
      </div>

      <CategorySelector
        categories={custom_categories}
        selectedKategori={selectedKategori || ""}
        watchedJenis={watchedJenis}
        onSelect={(name) => setValue("kategori", name)}
        error={errors.kategori?.message}
      />

      <SubCategorySelector
        subCategories={subCategories}
        selectedSubKategori={selectedSubKategori || ""}
        onSelect={(name) => setValue("sub_kategori", name)}
      />

      <div className="form-group">
        <label className="form-label">
          {t("transactions.form.description_label")}
        </label>
        <textarea
          placeholder={t("transactions.form.description_placeholder")}
          className={`input ${errors.deskripsi ? "input-error" : ""}`}
          style={{ minHeight: "80px", resize: "none" }}
          {...register("deskripsi")}
        />
        {errors.deskripsi && (
          <span className="form-error">{errors.deskripsi.message}</span>
        )}
      </div>

      <Button type="submit" loading={isLoading} style={{ width: "100%" }}>
        {t("transactions.form.save")}
      </Button>
    </form>
  );
}
