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
  const [isFocused, setIsFocused] = useState(false);
  const [rawDigits, setRawDigits] = useState("");

  const locale = currentLang === "id" ? "id-ID" : "en-US";
  const currencyPrefix = getCurrencySymbol(settings.mata_uang || "IDR");

  useEffect(() => {
    if (value !== undefined) {
      const displayAmount = Math.round(getConvertedAmount(value, settings.mata_uang || "IDR"));
      setRawDigits(displayAmount === 0 ? "" : String(displayAmount));
    }
  }, [value, settings.mata_uang]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setRawDigits(raw);
    const numericValue = raw === "" ? 0 : parseInt(raw, 10);
    const baseValue = getOriginalAmount(numericValue, settings.mata_uang || "IDR");
    onChange?.(baseValue);
  };

  const handleFocus = () => setIsFocused(true);

  const handleBlur = () => setIsFocused(false);

  const displayValue = rawDigits === ""
    ? ""
    : isFocused
      ? rawDigits
      : new Intl.NumberFormat(locale).format(parseInt(rawDigits, 10));

  return (
    <Input
      {...props}
      type="tel"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      prefix={currencyPrefix}
      placeholder="0"
    />
  );
});
