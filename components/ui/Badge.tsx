"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "income" | "expense" | "saving" | "warning" | "default";
  className?: string;
  style?: React.CSSProperties;
}

export const Badge = React.memo(function Badge({
  children,
  variant = "default",
  className,
  style,
}: BadgeProps) {
  const variantClass = {
    income: "badge-income",
    expense: "badge-expense",
    saving: "badge-saving",
    warning: "badge-warning",
    default: "",
  }[variant];

  return (
    <span
      className={cn("badge", variantClass, className)}
      style={{
        ...(variant === "default"
          ? {
              background: "var(--color-surface-offset)",
              color: "var(--color-text-muted)",
            }
          : {}),
        ...style,
      }}
    >
      {children}
    </span>
  );
});
