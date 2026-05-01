"use client";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

/**
 * A utility function to adjust the brightness of a hex color.
 * Used to calculate the hover state.
 */
function adjustColor(hex: string, amount: number) {
  let color = hex.replace("#", "");
  if (color.length === 3) {
    color = color
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const num = parseInt(color, 16);
  let r = (num >> 16) + amount;
  let b = ((num >> 8) & 0x00ff) + amount;
  let g = (num & 0x0000ff) + amount;

  r = Math.max(Math.min(255, r), 0);
  b = Math.max(Math.min(255, b), 0);
  g = Math.max(Math.min(255, g), 0);

  return `#${(g | (b << 8) | (r << 16)).toString(16).padStart(6, "0")}`;
}

export function ThemeProvider() {
  const tema_warna =
    useAppStore((state) => state.settings.tema_warna) || "#ff85a2";

  useEffect(() => {
    const root = document.documentElement;

    // Set primary color
    root.style.setProperty("--color-primary", tema_warna);

    // Calculate and set hover state (slightly darker)
    root.style.setProperty(
      "--color-primary-hover",
      adjustColor(tema_warna, -20),
    );

    // Set highlight state (transparent version using hex opacity)
    // Hex 1A is ~10% opacity, 26 is ~15% opacity
    root.style.setProperty("--color-primary-highlight", `${tema_warna}26`);

    // Update meta theme-color for PWA/Browser bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", tema_warna);
    }
  }, [tema_warna]);

  return null;
}
