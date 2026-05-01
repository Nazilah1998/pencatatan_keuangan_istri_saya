"use client";
import React from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "📭",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 2rem",
        textAlign: "center",
        gap: "1rem",
      }}
    >
      <div
        style={{
          fontSize: "3.5rem",
          lineHeight: 1,
          marginBottom: "0.5rem",
          filter: "grayscale(0.3)",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          maxWidth: "320px",
        }}
      >
        <h3
          style={{
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "var(--color-text)",
          }}
        >
          {title}
        </h3>
        {description && (
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--color-text-muted)",
              lineHeight: 1.6,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} style={{ marginTop: "0.5rem" }}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
