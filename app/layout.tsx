import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

import { PWAProvider } from "@/components/providers/PWAProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LanguageSyncProvider } from "@/components/providers/LanguageSyncProvider";
import { ProfileSyncProvider } from "@/components/providers/ProfileSyncProvider";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    default: "Tyaaa Financee — Smart Financial Tracking",
    template: "%s | Tyaaa Financee",
  },
  description:
    "Raih kendali penuh atas masa depan finansial Anda dengan cara yang cerdas dan eksklusif bersama Tyaaa Financee.",
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

import { DataSyncProvider } from "@/components/providers/DataSyncProvider";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // We check for supabase session if needed, but for layout we just render
  return (
    <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning>
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
        <PWAProvider>
          <DataSyncProvider>
            <ThemeProvider />
            <LanguageSyncProvider />
            <ProfileSyncProvider>{children}</ProfileSyncProvider>
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
          </DataSyncProvider>
        </PWAProvider>

        {/* Google Translate Integration */}
        <div id="google_translate_element" style={{ display: "none" }}></div>
        <Script
          strategy="afterInteractive"
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        />
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'id',
                autoDisplay: false
              }, 'google_translate_element');
            }
          `}
        </Script>
      </body>
    </html>
  );
}
