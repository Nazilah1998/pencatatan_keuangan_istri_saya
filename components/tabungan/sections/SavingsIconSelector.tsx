"use client";
import React from "react";
import { SAVINGS_ICONS, SAVINGS_COLORS } from "@/lib/constants";

interface SavingsIconSelectorProps {
  selectedIcon: string;
  selectedColor: string;
  onIconSelect: (icon: string) => void;
  onColorSelect: (color: string) => void;
}

export function SavingsIconSelector({
  selectedIcon,
  selectedColor,
  onIconSelect,
  onColorSelect,
}: SavingsIconSelectorProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <style jsx>{`
        .selection-grid {
          display: flex;
          gap: 0.625rem;
          flex-wrap: wrap;
        }
        .icon-btn {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-lg);
          background: transparent;
          border: 2px solid var(--color-border);
          font-size: 1.25rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justifycontent: center;
          transition: all var(--transition);
        }
        .icon-btn.selected {
          border-color: var(--color-primary);
          background: var(--color-surface-offset);
          transform: scale(1.05);
        }
        .color-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all var(--transition);
          position: relative;
        }
        .color-btn.selected {
          transform: scale(1.2);
          box-shadow:
            0 0 0 2px var(--color-surface),
            0 0 0 4px currentColor;
        }
      `}</style>

      <div className="form-group">
        <label className="form-label">Pilih Ikon</label>
        <div className="selection-grid">
          {SAVINGS_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => onIconSelect(icon)}
              className={`icon-btn ${selectedIcon === icon ? "selected" : ""}`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Pilih Warna</label>
        <div
          className="selection-grid"
          style={{ gap: "1rem", padding: "0.25rem" }}
        >
          {SAVINGS_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onColorSelect(color)}
              className={`color-btn ${selectedColor === color ? "selected" : ""}`}
              style={{ backgroundColor: color, color: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
