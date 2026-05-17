import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sintyafinance.app",
  appName: "Sintya Finance",
  webDir: "out",
  server: {
    // Menggunakan IP Wi-Fi lokal komputer Anda agar bisa diakses langsung dari HP asli (Android/iOS)
    // yang terhubung di WiFi/Hotspot yang sama.
    // Nanti ganti dengan link website produksi Anda (misal: https://sintya-finance.vercel.app)
    url: "http://192.168.100.9:3000",
    cleartext: true,
  },
};

export default config;
