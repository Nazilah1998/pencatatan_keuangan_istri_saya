"use client";
import React, { useState, useEffect } from "react";
import { Input, InputProps } from "./Input";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAppStore } from "@/store/useAppStore";
import { getCurrencySymbol, getConvertedAmount, getOriginalAmount } from "@/lib/utils/currency";

interface CurrencyInputProps extends Omit<InputProps, "onChange" | "value"> {
  value?: number;
  onChange?: (value: number) => void;
}

export const CurrencyInput = React.memo(function CurrencyInput({
  value,
  onChange,
  ...props
}: CurrencyInputProps) {
  const { currentLang } = useTranslation();
  const { settings } = useAppStore();
  const [displayValue, setDisplayValue] = useState("");

  const locale = currentLang === "id" ? "id-ID" : "en-US";
  const currencyPrefix = getCurrencySymbol(settings.mata_uang || "IDR");

  useEffect(() => {
    if (value !== undefined) {
      const displayAmount = getConvertedAmount(value, settings.mata_uang || "IDR");
      const roundedDisplayAmount = Math.round(displayAmount);
      const formatted = new Intl.NumberFormat(locale).format(roundedDisplayAmount);
      if (formatted !== displayValue) {
        setDisplayValue(value === 0 ? "" : formatted);
      }
    }
  }, [value, displayValue, locale, settings.mata_uang]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    const numericValue = rawValue === "" ? 0 : parseInt(rawValue, 10);

    // Update local display value with formatting
    const formatted =
      rawValue === "" ? "" : new Intl.NumberFormat(locale).format(numericValue);
    setDisplayValue(formatted);

    // Notify parent in the base currency (IDR)
    const baseValue = getOriginalAmount(numericValue, settings.mata_uang || "IDR");
    onChange?.(baseValue);
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      prefix={currencyPrefix}
      placeholder="0"
    />
  );
});
