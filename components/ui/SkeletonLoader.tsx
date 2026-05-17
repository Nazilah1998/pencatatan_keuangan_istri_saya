"use client";
import React from "react";

interface SkeletonProps {
  variant?: "card" | "list" | "table" | "chart" | "text" | "circle";
  count?: number;
  height?: string | number;
  width?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function SkeletonLoader({
  variant = "text",
  count = 1,
  height,
  width,
  className = "",
  style,
}: SkeletonProps) {
  const items = Array.from({ length: count });

  const renderSkeleton = (idx: number) => {
    switch (variant) {
      case "card":
        return (
          <div
            key={idx}
            className={`card skeleton-container ${className}`}
            style={{
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              minHeight: height || "120px",
              width: width || "100%",
              border: "1px solid var(--color-border-subtle)",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              ...style,
            }}
          >
            <div className="skeleton" style={{ width: "40%", height: "16px" }} />
            <div className="skeleton" style={{ width: "70%", height: "28px" }} />
            <div className="skeleton" style={{ width: "50%", height: "14px" }} />
          </div>
        );
      case "list":
        return (
          <div
            key={idx}
            className={`skeleton-container ${className}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "0.875rem 1rem",
              border: "1px solid var(--color-border-subtle)",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              width: width || "100%",
              ...style,
            }}
          >
            <div className="skeleton" style={{ width: "40px", height: "40px", borderRadius: "12px", flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div className="skeleton" style={{ width: "60%", height: "16px" }} />
              <div className="skeleton" style={{ width: "30%", height: "12px" }} />
            </div>
            <div className="skeleton" style={{ width: "80px", height: "18px", borderRadius: "6px" }} />
          </div>
        );
      case "chart":
        return (
          <div
            key={idx}
            className={`card skeleton-container ${className}`}
            style={{
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1.5rem",
              minHeight: height || "300px",
              width: width || "100%",
              border: "1px solid var(--color-border-subtle)",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              ...style,
            }}
          >
            <div className="skeleton" style={{ width: "160px", height: "160px", borderRadius: "50%" }} />
            <div style={{ width: "100%", display: "flex", justifyContent: "space-around" }}>
              <div className="skeleton" style={{ width: "60px", height: "14px" }} />
              <div className="skeleton" style={{ width: "60px", height: "14px" }} />
              <div className="skeleton" style={{ width: "60px", height: "14px" }} />
            </div>
          </div>
        );
      case "circle":
        return (
          <div
            key={idx}
            className={`skeleton ${className}`}
            style={{
              width: width || "40px",
              height: height || "40px",
              borderRadius: "50%",
              ...style,
            }}
          />
        );
      default:
        return (
          <div
            key={idx}
            className={`skeleton ${className}`}
            style={{
              width: width || "100%",
              height: height || "16px",
              ...style,
            }}
          />
        );
    }
  };

  if (count > 1) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
        {items.map((_, i) => renderSkeleton(i))}
      </div>
    );
  }

  return renderSkeleton(0);
}
