"use client";
import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "prefix" | "suffix"
> {
  label?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = React.memo(function Input({
  label,
  error,
  prefix,
  suffix,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {props.required && (
            <span style={{ color: "var(--color-danger)", marginLeft: 4 }}>
              *
            </span>
          )}
        </label>
      )}
      <div
        style={{ position: "relative", display: "flex", alignItems: "center" }}
      >
        {prefix && (
          <span
            style={{
              position: "absolute",
              left: "0.875rem",
              color: "var(--color-text-muted)",
              fontSize: "0.875rem",
              pointerEvents: "none",
            }}
          >
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={cn("input", error && "input-error", className)}
          style={{
            paddingLeft: prefix ? "2.5rem" : undefined,
            paddingRight: suffix ? "2.5rem" : undefined,
          }}
          {...props}
        />
        {suffix && (
          <span
            style={{
              position: "absolute",
              right: "0.875rem",
              color: "var(--color-text-muted)",
              fontSize: "0.875rem",
              pointerEvents: "none",
            }}
          >
            {suffix}
          </span>
        )}
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
});
