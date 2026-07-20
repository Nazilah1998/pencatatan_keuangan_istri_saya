"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Transaction, BudgetEntry } from "@/types";

const apiKey = process.env.GEMINI_API_KEY;

export async function generateFinancialInsights(
  transactions: Transaction[],
  budgets: BudgetEntry[],
  mataUang: string
) {
  if (!apiKey) {
    return {
      success: false,
      error: "API Key Gemini tidak ditemukan di .env.local",
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" }); // Using fast model

    // Prepare data for AI
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const thisMonthTransactions = transactions.filter((t) => {
      const d = new Date(t.tanggal);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalPemasukan = thisMonthTransactions
      .filter((t) => t.jenis === "pemasukan")
      .reduce((sum, t) => sum + Number(t.jumlah), 0);

    const totalPengeluaran = thisMonthTransactions
      .filter((t) => t.jenis === "pengeluaran")
      .reduce((sum, t) => sum + Number(t.jumlah), 0);

    // Group expenses by category for AI to analyze
    const expensesByCategory = thisMonthTransactions
      .filter((t) => t.jenis === "pengeluaran")
      .reduce((acc, t) => {
        const cat = t.kategori || "Lainnya";
        acc[cat] = (acc[cat] || 0) + Number(t.jumlah);
        return acc;
      }, {} as Record<string, number>);

    const prompt = `
      Anda adalah asisten keuangan pribadi yang profesional, ramah, dan empatik.
      Berikut adalah data keuangan pengguna untuk bulan ini:
      - Total Pemasukan: ${totalPemasukan} ${mataUang}
      - Total Pengeluaran: ${totalPengeluaran} ${mataUang}
      - Rincian Pengeluaran per Kategori: ${JSON.stringify(expensesByCategory)}
      - Data Anggaran Bulanan: ${JSON.stringify(
        budgets.map((b) => ({ kategori: b.kategori, batas: b.batas_bulanan }))
      )}

      Tugas Anda adalah menganalisis data di atas dan memberikan masukan yang sangat ringkas dan bermanfaat.
      Berikan respons Anda TEPAT dalam format JSON berikut tanpa tambahan teks apapun di luar JSON:
      {
        "summary": "Satu kalimat ringkasan kondisi keuangan bulan ini (misal: 'Keuangan Anda sangat sehat!' atau 'Awas, pengeluaran Anda hampir melebihi pemasukan.')",
        "alert": "Peringatan spesifik terkait kategori yang paling boros atau mendekati batas anggaran (opsional, kosongkan jika aman). Maksimal 1 kalimat.",
        "tips": ["Tip praktis 1", "Tip praktis 2"] (Berikan tepat 2 tips yang relevan dengan data mereka)
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract JSON from response (handling potential markdown blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Format respons AI tidak valid");
    }

    const data = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data: {
        summary: data.summary,
        alert: data.alert || null,
        tips: data.tips || [],
      },
    };
  } catch (error: unknown) {
    console.error("Gemini AI Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghubungi asisten AI.",
    };
  }
}
