"use client";
import React, { useState, useMemo } from "react";
import { Sparkles, RefreshCw, CheckCircle2, Bot, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { generateFinancialInsights } from "@/app/actions/ai";
import { Transaction, BudgetEntry } from "@/types";
import toast from "react-hot-toast";

interface AiInsightsProps {
  stats: {
    totalSaldo: number;
    totalPemasukan: number;
    totalPengeluaran: number;
    totalTabungan: number;
    spendingRatio: number;
    totalAset: number;
    totalHutang: number;
    netWorth: number;
    categoryData: { kategori: string; total: number; fill: string }[];
  };
  t: (key: string) => string;
  isPrivateMode?: boolean;
  transactions?: Transaction[];
  budgets?: BudgetEntry[];
  mataUang?: string;
}

// A collection of saving tips that the AI can randomly pick from when the user refreshes
const GENERAL_SAVING_TIPS = [
  {
    title: "Aturan 24 Jam untuk Belanja Non-Primer",
    description: "Sebelum membeli barang non-primer (seperti baju atau gadget baru), tunggu selama 24 jam. Biasanya keinginan membeli akan hilang setelah emosi mereda.",
    steps: [
      "Masukkan barang ke keranjang belanja digital atau wish list.",
      "Tinggalkan dan lakukan aktivitas produktif lain.",
      "Setelah 24 jam, evaluasi apakah barang tersebut benar-benar dibutuhkan."
    ]
  },
  {
    title: "Metode Budgeting 50/30/20",
    description: "Bagi pendapatan bersihmu menjadi tiga bagian: 50% untuk kebutuhan pokok, 30% untuk keinginan, dan 20% langsung ditabung atau investasi.",
    steps: [
      "Hitung total pendapatan bulanan.",
      "Alokasikan Rp 0 untuk pos tabungan di awal bulan, bukan menyisakan di akhir.",
      "Gunakan amplop digital (custom wallets) untuk memisahkan pengeluaran."
    ]
  },
  {
    title: "Detoks Belanja Mingguan",
    description: "Tentukan 1 hari dalam seminggu sebagai 'No Spend Day'—hari di mana kamu sama sekali tidak mengeluarkan uang sepeser pun kecuali untuk hal darurat.",
    steps: [
      "Rencanakan bekal makanan dan minuman dari rumah.",
      "Hindari membuka aplikasi e-commerce atau layanan pesan-antar makanan.",
      "Nikmati hiburan gratis seperti membaca buku atau olahraga di taman."
    ]
  },
  {
    title: "Evaluasi Biaya Langganan (Subscription)",
    description: "Banyak langganan bulanan kecil yang tidak disadari menumpuk menjadi besar. Evaluasi layanan streaming, musik, atau keanggotaan gim Anda.",
    steps: [
      "Catat semua pengeluaran bulanan otomatis berulang.",
      "Hapus langganan yang tidak digunakan lebih dari 3 kali dalam sebulan.",
      "Gunakan paket keluarga (family sharing) untuk menghemat biaya bersama."
    ]
  },
  {
    title: "Aturan Kopi dan Cemilan Harian",
    description: "Membeli segelas kopi kekinian seharga Rp 25.000 setiap hari kerja bisa menghabiskan hingga Rp 500.000 sebulan. Coba batasi konsumsi luar.",
    steps: [
      "Investasikan pada botol minum berkualitas tinggi dan kopi seduh rumah.",
      "Sediakan cemilan porsi besar di meja kerja untuk menghindari jajan kecil.",
      "Jadikan jajan kopi sebagai 'reward' akhir pekan saja."
    ]
  }
];

export function AiInsights({ stats, isPrivateMode = false, transactions, budgets, mataUang }: AiInsightsProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "category" | "tips">("summary");
  const [isScanning, setIsScanning] = useState(false);
  const [aiData, setAiData] = useState<{summary: string; alert: string | null; tips: string[]} | null>(null);
  const [randomTipIndex, setRandomTipIndex] = useState(() =>
    Math.floor(Math.random() * GENERAL_SAVING_TIPS.length)
  );
  const [completedSteps, setCompletedSteps] = useState<{ [key: string]: boolean }>({});

  // Subtle haptic tick trigger
  const triggerHaptic = () => {
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(12);
      }
    } catch {
      // Ignored
    }
  };

  // Fetch real AI insights
  const fetchRealAiInsights = async () => {
    if (!transactions || !budgets || !mataUang) return;
    triggerHaptic();
    setIsScanning(true);
    try {
      const res = await generateFinancialInsights(transactions, budgets, mataUang);
      if (res.success && res.data) {
        setAiData(res.data as {summary: string; alert: string | null; tips: string[]});
        toast.success("Analisis AI berhasil dimuat!");
      } else {
        toast.error(res.error || "Gagal memuat AI.");
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem AI.");
    } finally {
      setIsScanning(false);
    }
  };

  // Simulate scanning action
  const handleRefreshTip = () => {
    triggerHaptic();
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setRandomTipIndex((prev) => {
        let next = Math.floor(Math.random() * GENERAL_SAVING_TIPS.length);
        while (next === prev && GENERAL_SAVING_TIPS.length > 1) {
          next = Math.floor(Math.random() * GENERAL_SAVING_TIPS.length);
        }
        return next;
      });
      // Reset checklist for new tip
      setCompletedSteps({});
    }, 1000);
  };

  const activeTip = useMemo(() => {
    return GENERAL_SAVING_TIPS[randomTipIndex];
  }, [randomTipIndex]);

  const toggleStep = (stepText: string) => {
    triggerHaptic();
    setCompletedSteps(prev => ({
      ...prev,
      [stepText]: !prev[stepText]
    }));
  };

  // 1. Dynamic Health Advice calculation based on real stats
  const healthAdvice = useMemo(() => {
    const ratio = stats.spendingRatio;
    if (stats.totalPemasukan === 0) {
      return {
        badge: "Halo Baru",
        color: "var(--color-primary)",
        bg: "rgba(99, 102, 241, 0.08)",
        title: "Yuk mulai catat keuanganmu! 📝",
        description: "Belum ada riwayat pemasukan di bulan ini. Catat transaksi pertamamu (baik gaji, uang saku, atau pengeluaran) agar asisten kecerdasan buatan saya bisa mulai mendeteksi kesehatan anggaranmu!",
        actionTip: "Klik tombol '+' di navigasi bawah untuk mencatat transaksi pertamamu."
      };
    }
    if (ratio > 80) {
      return {
        badge: "ZONA MERAH - PEMBOROSAN",
        color: "var(--color-expense)",
        bg: "rgba(239, 68, 68, 0.08)",
        title: "Waduh! Anggaranmu sedang kritis 🚨",
        description: `Pengeluaranmu telah menghabiskan ${ratio.toFixed(0)}% dari pendapatan bulan ini. Sisa uangmu sangat tipis. Rekomendasi mendesak: tunda pengeluaran non-primer dan stop langganan otomatis yang tidak penting sekarang juga!`,
        actionTip: "Fokus hanya pada kebutuhan pangan, tempat tinggal, dan cicilan wajib hingga akhir bulan."
      };
    }
    if (ratio > 60) {
      return {
        badge: "ZONA KUNING - CAUTION",
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.08)",
        title: "Perhatian, kantong mulai menipis! ⚠️",
        description: `Kamu telah membelanjakan ${ratio.toFixed(0)}% dari pemasukanmu. Posisi ini masih relatif aman namun kamu harus mengerem belanja impulsif agar sisa dana bisa dialokasikan untuk menabung di akhir bulan.`,
        actionTip: "Coba review pengeluaran terbesarmu hari ini dan cari alternatif belanja yang lebih hemat."
      };
    }
    return {
      badge: "ZONA HIJAU - SEHAT",
      color: "var(--color-income)",
      bg: "rgba(16, 185, 129, 0.08)",
      title: "Luar biasa! Keuanganmu sangat prima 🌟",
      description: `Rasio pengeluaranmu baru menyentuh ${ratio.toFixed(0)}% dari total pendapatan. Ini adalah manajemen dana yang luar biasa! Kamu memiliki ruang gerak finansial yang luas dan sisa dana yang sehat.`,
      actionTip: "Sangat direkomendasikan mengalokasikan sisa dana ekstra ini langsung ke target Tabungan aktifmu!"
    };
  }, [stats.totalPemasukan, stats.spendingRatio]);

  // 2. Dynamic top category analysis
  const topCategoryAdvice = useMemo(() => {
    if (!stats.categoryData || stats.categoryData.length === 0) {
      return {
        title: "Belum ada pengeluaran berdasarkan kategori",
        description: "Saat kamu mencatat pengeluaran harian, saya akan mengelompokkan kategori terbesar dan merumuskan saran hemat khusus untukmu di sini!"
      };
    }
    const top = stats.categoryData[0];
    return {
      title: `Kategori terbesar: ${top.kategori} 🏷️`,
      description: `Bulan ini kamu telah menghabiskan sebanyak ${
        isPrivateMode ? "Rp ••••••" : formatCurrency(top.total)
      } untuk kategori ${top.kategori}. Ini merupakan pos pengeluaran terbesar kamu. Coba buat pagu anggaran khusus di menu Anggaran agar pos ini tidak membengkak!`,
      color: top.fill || "var(--color-primary)"
    };
  }, [stats.categoryData, isPrivateMode]);

  return (
    <div
      className="card"
      style={{
        padding: "1.5rem",
        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(168, 85, 247, 0.04) 100%)",
        border: "1px solid rgba(168, 85, 247, 0.15)",
        borderRadius: "var(--radius-2xl)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        boxShadow: "0 10px 30px -10px rgba(168, 85, 247, 0.08)",
      }}
    >
      {/* Dynamic Glowing Accent Background Sphere */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-20px",
          right: "-20px",
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(99, 102, 241, 0) 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />

      {/* Shimmer Scan animation overlay when loading/scanning */}
      {isScanning && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(255, 255, 255, 0.35)",
            backdropFilter: "blur(2px)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "0.5rem"
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid var(--color-primary-bg)",
              borderTop: "3px solid var(--color-primary)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-primary-dark)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Menganalisis Transaksi...
          </span>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Title Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              background: "linear-gradient(135deg, var(--color-primary) 0%, #a855f7 100%)",
              color: "#fff",
              padding: "0.375rem",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Sparkles size={16} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--color-text)" }}>
              Asisten Finansial Pintar
            </span>
            <span style={{ fontSize: "0.6875rem", color: "var(--color-text-faint)", fontWeight: 500 }}>
              AI FINANCIAL CONSULTANT
            </span>
          </div>
        </div>

        {activeTab === "summary" && !aiData && (
          <button
            onClick={fetchRealAiInsights}
            disabled={isScanning}
            style={{
              background: "linear-gradient(135deg, var(--color-primary) 0%, #a855f7 100%)",
              border: "none",
              borderRadius: "10px",
              padding: "0.375rem 0.625rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              transition: "all 0.2s ease"
            }}
          >
            <Bot size={14} className={isScanning ? "animate-pulse" : ""} />
            {isScanning ? "Menganalisis..." : "Tanya AI"}
          </button>
        )}
        
        {activeTab === "tips" && !aiData && (
          <button
            onClick={handleRefreshTip}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              padding: "0.375rem 0.625rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              transition: "all 0.2s ease"
            }}
          >
            <RefreshCw size={12} className={isScanning ? "animate-spin" : ""} />
            Tips Baru
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          background: "var(--color-surface-offset, #f3f4f6)",
          padding: "0.25rem",
          borderRadius: "12px",
          gap: "0.25rem"
        }}
      >
        <button
          onClick={() => { triggerHaptic(); setActiveTab("summary"); }}
          style={{
            background: activeTab === "summary" ? "var(--color-surface)" : "transparent",
            border: "none",
            borderRadius: "9px",
            padding: "0.4rem 0",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: activeTab === "summary" ? "var(--color-text)" : "var(--color-text-muted)",
            cursor: "pointer",
            transition: "all 0.25s ease"
          }}
        >
          📊 Ringkasan
        </button>
        <button
          onClick={() => { triggerHaptic(); setActiveTab("category"); }}
          style={{
            background: activeTab === "category" ? "var(--color-surface)" : "transparent",
            border: "none",
            borderRadius: "9px",
            padding: "0.4rem 0",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: activeTab === "category" ? "var(--color-text)" : "var(--color-text-muted)",
            cursor: "pointer",
            transition: "all 0.25s ease"
          }}
        >
          🏷️ Kategori
        </button>
        <button
          onClick={() => { triggerHaptic(); setActiveTab("tips"); }}
          style={{
            background: activeTab === "tips" ? "var(--color-surface)" : "transparent",
            border: "none",
            borderRadius: "9px",
            padding: "0.4rem 0",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: activeTab === "tips" ? "var(--color-text)" : "var(--color-text-muted)",
            cursor: "pointer",
            transition: "all 0.25s ease"
          }}
        >
          💡 Tips Hemat
        </button>
      </div>

      {/* Tab Contents */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        
        {/* TAB 1: Summary Health Advice */}
        {activeTab === "summary" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 800,
                  color: healthAdvice.color,
                  background: healthAdvice.bg,
                  padding: "0.15rem 0.5rem",
                  borderRadius: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.025em"
                }}
              >
                {healthAdvice.badge}
              </span>
            </div>
            {aiData ? (
              <div
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-primary)",
                  borderRadius: "10px",
                  padding: "0.875rem",
                  marginTop: "0.25rem",
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "flex-start",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.05)"
                }}
              >
                <div style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: "2px" }}>
                  <Sparkles size={16} />
                </div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)", margin: 0, lineHeight: 1.5 }}>
                  {aiData.summary}
                </p>
              </div>
            ) : (
              <>
                <h4 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
                  {healthAdvice.title}
                </h4>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.45 }}>
                  {healthAdvice.description}
                </p>
                <div
                  style={{
                    background: "var(--color-surface)",
                    border: "1px dashed var(--color-border)",
                    borderRadius: "10px",
                    padding: "0.625rem",
                    marginTop: "0.25rem",
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "flex-start"
                  }}
                >
                  <div style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: "1px" }}>
                    <CheckCircle2 size={14} />
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500, lineHeight: 1.4 }}>
                    <strong>Saran Aksi:</strong> {healthAdvice.actionTip}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: Category Insights */}
        {activeTab === "category" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {aiData && aiData.alert ? (
              <div
                style={{
                  background: "var(--color-warning-bg)",
                  border: "1px solid var(--color-warning)",
                  borderRadius: "10px",
                  padding: "0.875rem",
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "flex-start"
                }}
              >
                <div style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: "2px" }}>
                  <AlertCircle size={16} />
                </div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)", margin: 0, lineHeight: 1.5 }}>
                  {aiData.alert}
                </p>
              </div>
            ) : (
              <>
                <h4 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
                  {topCategoryAdvice.title}
                </h4>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.45 }}>
                  {topCategoryAdvice.description}
                </p>
              </>
            )}
            
            {stats.categoryData && stats.categoryData.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", marginTop: "0.25rem" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--color-text-faint)", fontWeight: 700, textTransform: "uppercase" }}>
                  Pembanding Pengeluaran Teratas
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {stats.categoryData.slice(0, 3).map((item, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", justifySelf: "stretch", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", width: 14 }}>
                        #{idx + 1}
                      </span>
                      <div
                        style={{
                          background: item.fill,
                          width: 8,
                          height: 8,
                          borderRadius: "50%"
                        }}
                      />
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.kategori}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        {isPrivateMode ? "Rp •••" : formatCurrency(item.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AI Hacks Carousel & Checklist */}
        {activeTab === "tips" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {aiData && aiData.tips.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {aiData.tips.map((tip, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: "10px",
                      padding: "0.875rem",
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "flex-start"
                    }}
                  >
                    <div style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: "2px" }}>
                      <CheckCircle2 size={16} />
                    </div>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text)", margin: 0, lineHeight: 1.5 }}>
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <h4 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
                  💡 {activeTip.title}
                </h4>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.45 }}>
                  {activeTip.description}
                </p>
              </>
            )}

            {!aiData && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.375rem",
                  marginTop: "0.25rem",
                  paddingTop: "0.5rem",
                  borderTop: "1px dashed var(--color-border)"
                }}
              >
                <span style={{ fontSize: "0.7rem", color: "var(--color-text-faint)", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.125rem" }}>
                  Target Aksi Praktis (Checklist)
                </span>
                {activeTip.steps.map((step, idx) => {
                  const checked = !!completedSteps[step];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleStep(step)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                        padding: "0.35rem 0.5rem",
                        background: checked ? "rgba(16, 185, 129, 0.04)" : "var(--color-surface)",
                        border: `1px solid ${checked ? "rgba(16, 185, 129, 0.15)" : "var(--color-border-subtle)"}`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "4px",
                          border: `1px solid ${checked ? "var(--color-income)" : "var(--color-text-faint)"}`,
                          background: checked ? "var(--color-income)" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: "2px",
                          transition: "all 0.15s ease"
                        }}
                      >
                        {checked && (
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: "#fff"
                            }}
                          />
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: checked ? "var(--color-text-muted)" : "var(--color-text)",
                          textDecoration: checked ? "line-through" : "none",
                          lineHeight: 1.35,
                          fontWeight: checked ? 500 : 600
                        }}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
