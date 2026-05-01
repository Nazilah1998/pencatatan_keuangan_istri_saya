import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

import { SessionProvider } from "@/components/providers/SessionProvider";
import { PWAProvider } from "@/components/providers/PWAProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: {
    default: "Tyaaa Financee — Smart Financial Tracking",
    template: "%s | Tyaaa Financee",
  },
  description:
    "Pencatatan keuangan rumah tangga terintegrasi Google Sheets. Lacak pemasukan, pengeluaran, anggaran, dan tabungan dengan Tyaaa Financee.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tyaaa Financee",
  },
  formatDetection: { telephone: false },
  keywords: [
    "keuangan",
    "Tyaaa Financee",
    "catat",
    "pengeluaran",
    "anggaran",
    "google sheets",
  ],
  authors: [{ name: "Tyaaa Financee" }],
  openGraph: {
    type: "website",
    title: "Tyaaa Financee — Smart Financial Tracking",
    description: "Pencatatan keuangan rumah tangga terintegrasi Google Sheets",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff85a2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"
        />
      </head>
      <body>
        <SessionProvider>
          <PWAProvider>
            <ThemeProvider />
            {children}
            <Toaster
              position="bottom-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "var(--color-surface)",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.875rem",
                  boxShadow: "var(--shadow-lg)",
                  padding: "0.75rem 1rem",
                },
                success: {
                  iconTheme: { primary: "#FFC107", secondary: "#FFF8E1" },
                },
                error: {
                  iconTheme: { primary: "#e74c3c", secondary: "#fbecec" },
                },
              }}
            />
          </PWAProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
