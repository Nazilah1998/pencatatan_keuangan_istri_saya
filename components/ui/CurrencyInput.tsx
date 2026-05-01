"use client";
import React, { useState, useEffect } from "react";
import { Input, InputProps } from "./Input";

interface CurrencyInputProps extends Omit<InputProps, "onChange" | "value"> {
  value?: number;
  onChange?: (value: number) => void;
}

export const CurrencyInput = React.memo(function CurrencyInput({
  value,
  onChange,
  ...props
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    if (value !== undefined) {
      const formatted = new Intl.NumberFormat("id-ID").format(value);
      if (formatted !== displayValue) {
        setDisplayValue(value === 0 ? "" : formatted);
      }
    }
  }, [value, displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    const numericValue = rawValue === "" ? 0 : parseInt(rawValue, 10);

    // Update local display value with formatting
    const formatted =
      rawValue === ""
        ? ""
        : new Intl.NumberFormat("id-ID").format(numericValue);
    setDisplayValue(formatted);

    // Notify parent
    onChange?.(numericValue);
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      prefix="Rp."
      placeholder="0"
    />
  );
});
